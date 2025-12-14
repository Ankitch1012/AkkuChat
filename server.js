// Simple Real-Time Chat Server
// Uses Express, Socket.IO, and Multer for file uploads

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Port number (use environment variable if available, otherwise default to 3000)
const PORT = process.env.PORT || 3000;

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure Multer for image uploads
// Only accepts PNG and JPG files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PNG and JPG images
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPG images are allowed!'));
    }
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// Handle image upload POST request
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the image URL
  res.json({ 
    imageUrl: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

// Store active users (in memory, no database)
// Format: { socketId: { username, roomId } }
const activeUsers = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining a room
  socket.on('join-room', (data) => {
    const { username, roomId } = data;
    
    // Validate input
    if (!username || !roomId) {
      socket.emit('join-error', { message: 'Username and Room ID are required!' });
      return;
    }

    // Store user info
    activeUsers[socket.id] = { username, roomId };
    
    // Join the room
    socket.join(roomId);
    
    // Notify the user they joined successfully
    socket.emit('joined-room', { username, roomId });
    
    // Notify others in the room that someone joined
    socket.to(roomId).emit('user-joined', {
      username,
      message: `${username} joined the room`
    });
    
    console.log(`${username} joined room: ${roomId}`);
  });

  // Handle text messages
  socket.on('send-message', (data) => {
    const user = activeUsers[socket.id];
    
    if (!user) {
      socket.emit('error', { message: 'You must join a room first!' });
      return;
    }

    const { message } = data;
    
    if (!message || message.trim() === '') {
      return;
    }

    // Create message object with timestamp
    const messageData = {
      username: user.username,
      message: message.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    // Send message to everyone in the same room (including sender)
    io.to(user.roomId).emit('receive-message', messageData);
    
    console.log(`Message in room ${user.roomId} from ${user.username}: ${message}`);
  });

  // Handle image messages (image already uploaded, just broadcast the URL)
  socket.on('send-image', (data) => {
    const user = activeUsers[socket.id];
    
    if (!user) {
      socket.emit('error', { message: 'You must join a room first!' });
      return;
    }

    const { imageUrl } = data;
    
    if (!imageUrl) {
      return;
    }

    // Create image message object with timestamp
    const imageData = {
      username: user.username,
      imageUrl: imageUrl,
      timestamp: new Date().toLocaleTimeString()
    };

    // Send image to everyone in the same room (including sender)
    io.to(user.roomId).emit('receive-image', imageData);
    
    console.log(`Image shared in room ${user.roomId} by ${user.username}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    
    if (user) {
      // Notify others in the room that user left
      socket.to(user.roomId).emit('user-left', {
        username: user.username,
        message: `${user.username} left the room`
      });
      
      console.log(`${user.username} left room: ${user.roomId}`);
      
      // Remove user from active users
      delete activeUsers[socket.id];
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

