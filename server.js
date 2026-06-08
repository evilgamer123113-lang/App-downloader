const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

// No more public folder requirement. Serves index.html from your root directory.
app.use(express.static(__dirname));

// Stream movie assets straight from your local /uploads folder directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple fallback route to serve your cinema main page properly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSockets Watch-Party Syncer Core Logic
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
