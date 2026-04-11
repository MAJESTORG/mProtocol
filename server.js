const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Добавлено для работы с внешними запросами

const app = express();
const server = http.createServer(app);

// Разрешаем CORS для всех маршрутов, чтобы /ice-config был доступен браузеру
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

// Эндпоинт для безопасной передачи ICE конфигурации
app.get('/ice-config', (req, res) => {
    res.json({
        iceServers: [
            { urls: "stun:stun.relay.metered.ca:80" },
            {
                urls: "turn:openrelay.metered.ca:80",
                username: process.env.TURN_USER,
                credential: process.env.TURN_PASS
            },
            {
                urls: "turn:openrelay.metered.ca:443",
                username: process.env.TURN_USER,
                credential: process.env.TURN_PASS
            },
            {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: process.env.TURN_USER,
                credential: process.env.TURN_PASS
            }
        ]
    });
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
                if (members.size === 0) rooms.delete(roomId);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is active on port ${PORT}`);
});
