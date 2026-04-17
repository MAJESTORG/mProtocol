const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Разрешаем CORS
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: false
    },
    transports: ['websocket', 'polling']
});

// Проверка работоспособности
app.get('/', (req, res) => {
    res.send('mProtocol Server is running');
});

// Эндпоинт для получения ICE конфигурации через REST API Metered
app.get('/ice-config', async (req, res) => {
    try {
        const apiKey = process.env.METERED_API_KEY;
        
        if (!apiKey) {
            console.error('METERED_API_KEY is missing');
            return res.status(500).json({ error: 'API key is missing on server' });
        }

        const response = await fetch(`https://mprotocol.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
        
        // Проверяем, что Metered ответил статусом 200 OK, а не ошибкой
        if (!response.ok) {
            console.error(`Metered API Error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: 'Failed to fetch TURN credentials' });
        }

        const iceServers = await response.json();
        res.json({ iceServers });
    } catch (error) {
        console.error('Error fetching ICE config:', error);
        res.status(500).json({ error: 'Internal server error while fetching ICE configuration' });
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', () => {
        const roomId = Math.floor(100000 + Math.random() * 900000).toString();
        rooms.set(roomId, new Set([socket.id]));
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (rooms.has(roomId)) {
            rooms.get(roomId).add(socket.id);
            socket.join(roomId);
            socket.to(roomId).emit('guest-joined');
            socket.emit('join-success');
        } else {
            socket.emit('error', 'Код не найден');
        }
    });

    socket.on('signal', ({ roomId, data }) => {
        socket.to(roomId).emit('signal', data);
    });

    socket.on('disconnect', () => {
        for (const [roomId, members] of rooms.entries()) {
            if (members.has(socket.id)) {
                members.delete(socket.id);
                if (members.size === 0) {
                    rooms.delete(roomId);
                }
                break;
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
