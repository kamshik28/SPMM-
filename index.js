const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Обробка з'єднань
io.on('connection', (socket) => {
    console.log(`Користувач підключився: ${socket.id}`);

    // Підключення до кімнати
    socket.on('joinRoom', (roomId) => {
        const room = io.sockets.adapter.rooms[roomId];

        // Перевіряємо фактичну кількість користувачів у кімнаті
        const userCount = room ? room.size : 0;

        if (userCount < 2) {
            socket.join(roomId);
            console.log(`${socket.id} приєднався до кімнати ${roomId}`);
            socket.to(roomId).emit('userJoined', socket.id); // Сповіщення інших
        } else {
            console.log(`Кімната ${roomId} вже заповнена. Користувач ${socket.id} не може приєднатися.`);
            socket.emit('roomFull', roomId); // Сповіщення клієнта, що кімната заповнена
        }
    });

    // Пересилання сигналів WebRTC
    socket.on('signal', ({ to, signalData }) => {
        console.log(`Сигнал від ${socket.id} до ${to}:`, signalData);
        io.to(to).emit('signal', { from: socket.id, signalData }); // Пересилання сигналу
    });

    // Вихід із кімнати
    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`${socket.id} покинув кімнату ${roomId}`);
        socket.to(roomId).emit('userLeft', socket.id); // Сповіщення інших
    });

    // Відключення клієнта
    socket.on('disconnect', () => {
        console.log(`Користувач відключився: ${socket.id}`);
        for (let roomId in socket.rooms) {
            if (roomId !== socket.id) {
                socket.to(roomId).emit('userLeft', socket.id); // Сповіщення інших
            }
        }
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
