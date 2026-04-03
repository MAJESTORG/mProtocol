const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: false
    },
    transports: ['websocket', 'polling']
});

const rooms = new Map(); // roomId -> Set(socketId)

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create-room', () => {
        const roomId = Math.floor(100000 + Math.random() * 900000).toString();
        
        rooms.set(roomId, new Set([socket.id]));
        socket.join(roomId);

        socket.emit('room-created', roomId);
        console.log('Room created:', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (rooms.has(roomId)) {
            rooms.get(roomId).add(socket.id);
            socket.join(roomId);

            socket.to(roomId).emit('guest-joined');
            socket.emit('join-success');

            console.log(`Socket ${socket.id} joined room ${roomId}`);
        } else {
            socket.emit('error', 'Код не найден');
        }
    });

    socket.on('signal', ({ roomId, data }) => {
        socket.to(roomId).emit('signal', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        for (const [roomId, members] of rooms.entries()) {
            if (members.has(socket.id)) {
                members.delete(socket.id);
                if (members.size === 0) {
                    rooms.delete(roomId);
                    console.log('Room deleted:', roomId);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
