const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map();

io.on('connection', (socket) => {
    socket.on('create-room', () => {
        const roomId = Math.floor(100000 + Math.random() * 900000).toString();
        rooms.set(roomId, socket.id);
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (rooms.has(roomId)) {
            socket.join(roomId);
            socket.to(rooms.get(roomId)).emit('guest-joined');
            socket.emit('join-success');
        } else {
            socket.emit('error', 'Код не найден');
        }
    });

    socket.on('signal', ({ roomId, data }) => {
        socket.to(roomId).emit('signal', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
