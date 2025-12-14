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
    
    // Send updated user list to all users in room
    const roomUsers = [];
    Object.keys(activeUsers).forEach((sid) => {
      if (activeUsers[sid].roomId === roomId) {
        roomUsers.push({
          socketId: sid,
          username: activeUsers[sid].username
        });
      }
    });
    io.to(roomId).emit('room-users-list', roomUsers);
    
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

  // Handle getting room users list
  socket.on('get-room-users', () => {
    const user = activeUsers[socket.id];
    if (!user) {
      return;
    }

    // Get all users in the same room
    const roomUsers = [];
    Object.keys(activeUsers).forEach((socketId) => {
      if (activeUsers[socketId].roomId === user.roomId && socketId !== socket.id) {
        roomUsers.push({
          socketId: socketId,
          username: activeUsers[socketId].username
        });
      }
    });

    socket.emit('room-users-list', roomUsers);
  });

  // Handle call initiation
  socket.on('call-user', (data) => {
    const caller = activeUsers[socket.id];
    if (!caller) {
      return;
    }

    const { targetSocketId, callType } = data; // callType: 'audio' or 'video'
    
    // Verify target is in the same room
    const target = activeUsers[targetSocketId];
    if (!target || target.roomId !== caller.roomId) {
      socket.emit('call-error', { message: 'User not found in room' });
      return;
    }

    // Send call request to target user
    socket.to(targetSocketId).emit('incoming-call', {
      callerSocketId: socket.id,
      callerUsername: caller.username,
      callType: callType
    });

    console.log(`${caller.username} calling ${target.username} (${callType})`);
  });

  // Handle call acceptance
  socket.on('accept-call', (data) => {
    const { callerSocketId } = data;
    const user = activeUsers[socket.id];
    const caller = activeUsers[callerSocketId];

    if (!user || !caller) {
      return;
    }

    // Notify caller that call was accepted
    socket.to(callerSocketId).emit('call-accepted', {
      answererSocketId: socket.id,
      answererUsername: user.username
    });

    console.log(`${user.username} accepted call from ${caller.username}`);
  });

  // Handle call rejection
  socket.on('reject-call', (data) => {
    const { callerSocketId } = data;
    const user = activeUsers[socket.id];
    const caller = activeUsers[callerSocketId];

    if (!user || !caller) {
      return;
    }

    // Notify caller that call was rejected
    socket.to(callerSocketId).emit('call-rejected', {
      answererSocketId: socket.id,
      answererUsername: user.username
    });

    console.log(`${user.username} rejected call from ${caller.username}`);
  });

  // Handle ending a call
  socket.on('end-call', (data) => {
    const { targetSocketId } = data;
    const user = activeUsers[socket.id];

    if (!user) {
      return;
    }

    // Notify other party that call ended
    socket.to(targetSocketId).emit('call-ended', {
      fromSocketId: socket.id,
      fromUsername: user.username
    });

    console.log(`${user.username} ended call`);
  });

  // WebRTC Signaling: Handle WebRTC offer
  socket.on('webrtc-offer', (data) => {
    const { targetSocketId, offer } = data;
    socket.to(targetSocketId).emit('webrtc-offer', {
      fromSocketId: socket.id,
      offer: offer
    });
  });

  // WebRTC Signaling: Handle WebRTC answer
  socket.on('webrtc-answer', (data) => {
    const { targetSocketId, answer } = data;
    socket.to(targetSocketId).emit('webrtc-answer', {
      fromSocketId: socket.id,
      answer: answer
    });
  });

  // WebRTC Signaling: Handle ICE candidates
  socket.on('webrtc-ice-candidate', (data) => {
    const { targetSocketId, candidate } = data;
    socket.to(targetSocketId).emit('webrtc-ice-candidate', {
      fromSocketId: socket.id,
      candidate: candidate
    });
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
      
      // Remove user from active users first
      delete activeUsers[socket.id];
      
      // Send updated user list to remaining users in room
      const roomUsers = [];
      Object.keys(activeUsers).forEach((sid) => {
        if (activeUsers[sid].roomId === user.roomId) {
          roomUsers.push({
            socketId: sid,
            username: activeUsers[sid].username
          });
        }
      });
      io.to(user.roomId).emit('room-users-list', roomUsers);
      
      console.log(`${user.username} left room: ${user.roomId}`);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

