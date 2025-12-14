# AkkuChat 💬

A minimal, beginner-friendly real-time chat application where users can join rooms and chat with text messages and images.

## Features

- ✅ Join rooms with username and room ID
- ✅ Real-time text messaging
- ✅ Image sharing (PNG/JPG)
- ✅ No authentication required
- ✅ No database needed (all in memory)
- ✅ Clean and simple codebase

## Tech Stack

**Backend:**
- Node.js
- Express.js
- Socket.IO
- Multer (for image uploads)

**Frontend:**
- HTML
- CSS
- Vanilla JavaScript (no frameworks)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## How to Use

1. Enter your **Username** (e.g., "Alice")
2. Enter a **Room ID** (e.g., "room123")
3. Click **Join Room**
4. Start chatting! Users with the same Room ID will see your messages
5. Click the 📷 button to share images

## Project Structure

```
AkkuChat/
│
├── server.js          # Backend server with Socket.IO
├── package.json       # Dependencies
├── uploads/           # Directory for uploaded images
│
└── public/
    ├── index.html     # Frontend HTML
    ├── style.css      # Styles
    └── script.js      # Client-side JavaScript
```

## Notes

- Images are saved in the `uploads/` directory
- Messages are stored in memory (lost on server restart)
- Multiple users can join the same room ID
- Server runs on port 3000 by default

## License

MIT

