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
// roomId -> { host: socketId, guest: socketId | null }. Максимум 2 участника.
const rooms = new Map();

const ROOM_ID_RE = /^\d{6}$/;

function genRoomId() {
    for (let i = 0; i < 20; i++) {
        const id = crypto.randomInt(100000, 1000000).toString();
        if (!rooms.has(id)) return id;
    }
    return null;
}

io.on('connection', (socket) => {
    socket.on('create-room', () => {
        if (socket.data.roomId) return; // один сокет — одна комната
        const roomId = genRoomId();
        if (!roomId) return socket.emit('error', 'Сервер перегружен, попробуйте позже');
        rooms.set(roomId, { host: socket.id, guest: null });
        socket.data.roomId = roomId;
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (socket.data.roomId) return;

        const room = (typeof roomId === 'string' && ROOM_ID_RE.test(roomId)) ? rooms.get(roomId) : null;
        // Занятая комната отвечает так же, как несуществующая: не раскрываем, какие коды живы
        if (!room || room.guest || room.host === socket.id) {
            return socket.emit('error', 'Код не найден');
        }

        room.guest = socket.id;
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
        if (room.host === socket.id) rooms.delete(roomId); // хост ушёл — комната больше не нужна
        else if (room.guest === socket.id) room.guest = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
