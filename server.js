const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

// No more public folder! Serve index.html right from the root directory
app.use(express.static(__dirname));

// Serve files directly out of your lowercase /uploads directory 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback rule to send the homepage accurately
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSockets Core Logic
io.on('connection', (socket) => {
    socket.broadcast.emit('requestCurrentState', socket.id);

    socket.on('replyWithState', (data) => {
        io.to(data.to).emit('forceFirstTimeSync', data);
    });

    socket.on('playVideo', (time) => {
        socket.broadcast.emit('userPlayed', time);
    });

    socket.on('pauseVideo', (time) => {
        socket.broadcast.emit('userPaused', time);
    });

    socket.on('seekVideo', (time) => {
        socket.broadcast.emit('userSeeked', time);
    });
});

const PORT = process.env.PORT || 3001;
const server = http.listen(PORT, () => {
    console.log(`Server executing at port ${PORT}`);
});

server.timeout = 1800000;
