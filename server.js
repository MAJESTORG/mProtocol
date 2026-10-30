const express = require('express');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: false },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e5 // сигналинг = только SDP/ICE, 100 КБ с запасом; защита от больших пакетов
});

app.get('/', (req, res) => {
    res.send('mProtocol Server is running');
});

// ---------- /ice-config ----------
// Кэш ответа Metered: не дёргаем их API на каждый запрос клиента.
// Если Metered выдаёт ключи с коротким сроком жизни — уменьшите ICE_CACHE_MS.
const ICE_CACHE_MS = 5 * 60 * 1000;
let iceCache = null; // { at: timestamp, iceServers: [...] }

app.get('/ice-config', async (req, res) => {
    try {
        if (iceCache && Date.now() - iceCache.at < ICE_CACHE_MS) {
            return res.json({ iceServers: iceCache.iceServers });
        }

        const apiKey = process.env.METERED_API_KEY;
        if (!apiKey) {
            console.error('METERED_API_KEY is missing');
            return res.status(500).json({ error: 'API key is missing on server' });
        }

        // Требуется Node 18+ (глобальный fetch)
        const response = await fetch(
            `https://mprotocol.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
            { signal: AbortSignal.timeout(10000) }
        );
        if (!response.ok) {
            console.error(`Metered API Error: ${response.status} ${response.statusText}`);
            return res.status(502).json({ error: 'Failed to fetch TURN credentials' });
        }

        const iceServers = await response.json();
        iceCache = { at: Date.now(), iceServers };
        res.json({ iceServers });
    } catch (error) {
        console.error('Error fetching ICE config:', error);
        res.status(500).json({ error: 'Internal server error while fetching ICE configuration' });
    }
});

// ---------- Комнаты ----------
// roomId -> { host: socketId, guest: socketId | null, timer }. Максимум 2 участника.
// Комната одноразовая: после входа гостя слот не освобождается (см. disconnect), ждать нового гостя нельзя.
const rooms = new Map();

function closeRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    clearTimeout(room.timer);
    rooms.delete(roomId);
}

const ROOM_ID_RE = /^\d{6}$/;
const MAX_FAILS_PER_MIN = 10; // неудачных join-room с одного IP в минуту (защита от перебора 6-значного кода)
// Сколько комната ждёт гостя (по умолчанию 10 минут; переопределяется переменной окружения ROOM_TTL_MS, миллисекунды).
// По истечении хост получает 'error' (клиент показывает тост и возвращается на главный экран),
// а ссылка/QR в истории чата перестают работать.
const ROOM_TTL_MS = parseInt(process.env.ROOM_TTL_MS, 10) || 10 * 60 * 1000;
// Сколько прокси стоит перед сервером (Render добавляет свой адрес в конец X-Forwarded-For).
// Левые записи списка подставляет сам клиент, поэтому считаем с ПРАВОГО края. Если лимит попыток срабатывает у всех сразу
// или, наоборот, не срабатывает на перебор, включите DEBUG_XFF=1, посмотрите заголовок в логах Render и подберите TRUSTED_PROXY_HOPS.
const TRUSTED_PROXY_HOPS = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS, 10) || 2);
const DEBUG_XFF = process.env.DEBUG_XFF === '1';
const failLog = new Map();    // ip -> [timestamps]

function genRoomId() {
    for (let i = 0; i < 20; i++) {
        const id = crypto.randomInt(100000, 1000000).toString();
        if (!rooms.has(id)) return id;
    }
    return null;
}

// За прокси Render IP клиента лежит в x-forwarded-for, но слева там могут быть записи, подставленные самим клиентом
// (иначе лимит попыток обходится одной строкой заголовка). Берём запись, отстоящую от правого края на TRUSTED_PROXY_HOPS.
function clientIp(socket) {
    const xff = socket.handshake.headers['x-forwarded-for'];
    if (DEBUG_XFF) console.log('x-forwarded-for:', xff, '| address:', socket.handshake.address);
    if (typeof xff === 'string') {
        const parts = xff.split(',').map(x => x.trim()).filter(Boolean);
        // Записей меньше, чем прокси: берём самую левую (так же ведёт себя схема с одним прокси)
        if (parts.length) return parts[Math.max(0, parts.length - TRUSTED_PROXY_HOPS)];
    }
    return socket.handshake.address || 'unknown';
}

function tooManyFails(ip) {
    const now = Date.now();
    const arr = (failLog.get(ip) || []).filter(t => now - t < 60000);
    failLog.set(ip, arr);
    return arr.length >= MAX_FAILS_PER_MIN;
}
function registerFail(ip) {
    const arr = failLog.get(ip) || [];
    arr.push(Date.now());
    failLog.set(ip, arr);
}
// Чистим устаревшие записи, чтобы Map не рос бесконечно
setInterval(() => {
    const now = Date.now();
    for (const [ip, arr] of failLog) {
        const fresh = arr.filter(t => now - t < 60000);
        if (fresh.length) failLog.set(ip, fresh); else failLog.delete(ip);
    }
}, 60000).unref();

io.on('connection', (socket) => {
    const ip = clientIp(socket);

    socket.on('create-room', () => {
        if (socket.data.roomId) return; // один сокет — одна комната
        const roomId = genRoomId();
        if (!roomId) return socket.emit('error', 'Сервер перегружен, попробуйте позже');
        const timer = setTimeout(() => {
            // Гость так и не пришёл: закрываем комнату и сообщаем хосту (клиент по 'error' делает failSession)
            const room = rooms.get(roomId);
            if (!room || room.guest) return;
            closeRoom(roomId);
            socket.emit('error', 'Время ожидания истекло. Создайте сессию заново.');
        }, ROOM_TTL_MS);
        timer.unref();
        rooms.set(roomId, { host: socket.id, guest: null, timer });
        socket.data.roomId = roomId;
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (socket.data.roomId) return;
        if (tooManyFails(ip)) return socket.emit('error', 'Слишком много попыток. Подождите минуту.');

        const room = (typeof roomId === 'string' && ROOM_ID_RE.test(roomId)) ? rooms.get(roomId) : null;
        // Занятая комната отвечает так же, как несуществующая: не раскрываем, какие коды живы
        if (!room || room.guest || room.host === socket.id) {
            registerFail(ip);
            return socket.emit('error', 'Код не найден');
        }

        room.guest = socket.id;
        clearTimeout(room.timer); // гость пришёл: TTL ожидания больше не нужен
        socket.data.roomId = roomId;
        socket.join(roomId);
        socket.to(roomId).emit('guest-joined'); // хост начинает createOffer
        socket.emit('join-success');
    });

    // Клиент шлёт { roomId, data }, но roomId от клиента игнорируем: берём комнату, в которой сокет реально состоит.
    socket.on('signal', (payload) => {
        const roomId = socket.data.roomId;
        if (!roomId || !payload || typeof payload !== 'object') return;
        const data = payload.data;
        if (!data || typeof data !== 'object') return;
        socket.to(roomId).emit('signal', data);
    });

    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        const room = roomId && rooms.get(roomId);
        if (!room) return;
        if (room.host === socket.id) closeRoom(roomId); // хост ушёл — комната больше не нужна
        // Гость ушёл: слот НЕ освобождаем. Иначе ссылка из чата пустила бы постороннего, пока вкладка хоста жива.
        // Повторить попытку можно только через новую сессию. Чтобы вернуть прежнее поведение: else if (room.guest === socket.id) room.guest = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
