const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

// REMOVED THE PUBLIC FOLDER REQUIREMENT:
// This serves index.html straight from your main root directory
app.use(express.static(__dirname));

// Serve movies directly from the /uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route handling to explicitly send index.html if someone lands on the homepage
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
const server = http.listen(PORT, () => {
    console.log(`Server executing at port ${PORT}`);
});

// Increase timeouts to prevent large movie streams from cutting off prematurely
server.timeout = 1800000;
