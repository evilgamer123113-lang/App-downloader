const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Set large parsing limits for incoming request metadata
app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ limit: '50gb', extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// 2. Set the binary upload ceiling to 50 GB
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 * 1024 } 
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.post('/upload-video', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({ url: videoUrl });
});

io.on('connection', (socket) => {
    socket.broadcast.emit('requestCurrentState', socket.id);

    socket.on('replyWithState', (data) => {
        io.to(data.to).emit('forceFirstTimeSync', data);
    });

    socket.on('changeVideo', (data) => {
        socket.broadcast.emit('userChangedVideo', data);
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

const PORT = 3001;
const server = http.listen(PORT, () => {
    console.log(`Server executing at http://localhost:${PORT}`);
});

// 3. CRITICAL: Set server timeout to 30 minutes (1,800,000 milliseconds)
// This prevents Node from dropping connections during large file uploads.
server.timeout = 1800000;