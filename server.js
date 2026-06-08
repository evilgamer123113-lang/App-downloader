const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

// Serves index.html straight from your main root directory
app.use(express.static(__dirname));

// Route handling to explicitly send index.html when landing on the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSockets Sync Core
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
http.listen(PORT, () => {
    console.log(`Server executing at port ${PORT}`);
});
