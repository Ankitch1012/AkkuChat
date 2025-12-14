// Simple Room Chat - Client Side JavaScript
// Handles Socket.IO connection, UI interactions, and message sending

// Connect to Socket.IO server
const socket = io();

// DOM Elements
const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomIdInput = document.getElementById('room-id-input');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const joinError = document.getElementById('join-error');
const currentRoomId = document.getElementById('current-room-id');
const currentUsername = document.getElementById('current-username');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imageBtn = document.querySelector('.image-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// Current user info (stored in memory)
let currentUser = {
    username: '',
    roomId: ''
};

// ==================== EVENT LISTENERS ====================

// Join Room Button Click
joinBtn.addEventListener('click', handleJoinRoom);

// Enter key press on join inputs
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        roomIdInput.focus();
    }
});

roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleJoinRoom();
    }
});

// Send Message Button Click
sendBtn.addEventListener('click', handleSendMessage);

// Enter key press on message input
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// Leave Room Button Click
leaveBtn.addEventListener('click', handleLeaveRoom);

// Image Upload Button Click
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

// Image Input Change (when file is selected)
imageInput.addEventListener('change', handleImageUpload);

// ==================== FUNCTIONS ====================

/**
 * Handle joining a room
 * Validates inputs and sends join request to server
 */
function handleJoinRoom() {
    const username = usernameInput.value.trim();
    const roomId = roomIdInput.value.trim();

    // Clear any previous errors
    joinError.textContent = '';

    // Validate inputs
    if (!username) {
        showJoinError('Please enter a username!');
        usernameInput.focus();
        return;
    }

    if (!roomId) {
        showJoinError('Please enter a room ID!');
        roomIdInput.focus();
        return;
    }

    // Store current user info
    currentUser.username = username;
    currentUser.roomId = roomId;

    // Send join request to server
    socket.emit('join-room', { username, roomId });
}

/**
 * Handle leaving the room
 * Disconnects socket and shows join screen
 */
function handleLeaveRoom() {
    // Disconnect socket (will trigger disconnect event on server)
    socket.disconnect();
    
    // Reconnect socket for potential rejoin
    socket.connect();
    
    // Clear user info
    currentUser = { username: '', roomId: '' };
    
    // Clear messages
    messagesContainer.innerHTML = '';
    
    // Clear inputs
    usernameInput.value = '';
    roomIdInput.value = '';
    messageInput.value = '';
    
    // Show join screen, hide chat screen
    joinScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    
    // Clear any errors
    joinError.textContent = '';
}

/**
 * Handle sending a text message
 * Validates input and sends message to server
 */
function handleSendMessage() {
    const message = messageInput.value.trim();

    // Don't send empty messages
    if (!message) {
        return;
    }

    // Send message to server
    socket.emit('send-message', { message });

    // Clear input field
    messageInput.value = '';
    messageInput.focus();
}

/**
 * Handle image upload
 * Uploads image to server, then sends image URL via socket
 */
async function handleImageUpload(event) {
    const file = event.target.files[0];

    // Check if file was selected
    if (!file) {
        return;
    }

    // Validate file type (client-side check)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Only PNG and JPG images are allowed!');
        imageInput.value = '';
        return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        alert('Image size must be less than 5MB!');
        imageInput.value = '';
        return;
    }

    // Show loading overlay
    loadingOverlay.classList.remove('hidden');

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);

        // Upload image to server
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();

        // Send image URL to server via socket
        socket.emit('send-image', { imageUrl: data.imageUrl });

        // Clear file input
        imageInput.value = '';
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
    } finally {
        // Hide loading overlay
        loadingOverlay.classList.add('hidden');
    }
}

/**
 * Display a join error message
 */
function showJoinError(message) {
    joinError.textContent = message;
}

/**
 * Display a text message in the chat
 */
function displayMessage(username, message, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'message-username';
    usernameSpan.textContent = username;

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    timestampSpan.textContent = timestamp;

    messageHeader.appendChild(usernameSpan);
    messageHeader.appendChild(timestampSpan);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content text';
    messageContent.textContent = message;

    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    scrollToBottom();
}

/**
 * Display an image message in the chat
 */
function displayImage(username, imageUrl, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'message-username';
    usernameSpan.textContent = username;

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    timestampSpan.textContent = timestamp;

    messageHeader.appendChild(usernameSpan);
    messageHeader.appendChild(timestampSpan);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content image';

    const image = document.createElement('img');
    image.className = 'message-image';
    image.src = imageUrl;
    image.alt = 'Shared image';
    
    // Open image in new tab on click
    image.addEventListener('click', () => {
        window.open(imageUrl, '_blank');
    });

    messageContent.appendChild(image);

    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    scrollToBottom();
}

/**
 * Display a system message (join/leave notifications)
 */
function displaySystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = message;

    messagesContainer.appendChild(systemDiv);

    // Scroll to bottom
    scrollToBottom();
}

/**
 * Scroll messages container to bottom
 */
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ==================== SOCKET.IO EVENT HANDLERS ====================

/**
 * When successfully joined a room
 * Show chat screen and update UI
 */
socket.on('joined-room', (data) => {
    // Update UI with room info
    currentRoomId.textContent = data.roomId;
    currentUsername.textContent = data.username;

    // Hide join screen, show chat screen
    joinScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    // Focus on message input
    messageInput.focus();

    // Display welcome message
    displaySystemMessage(`Welcome to room "${data.roomId}"! Start chatting...`);
});

/**
 * When there's an error joining room
 */
socket.on('join-error', (data) => {
    showJoinError(data.message);
});

/**
 * When a user joins the room (notification for others)
 */
socket.on('user-joined', (data) => {
    displaySystemMessage(data.message);
});

/**
 * When a user leaves the room (notification)
 */
socket.on('user-left', (data) => {
    displaySystemMessage(data.message);
});

/**
 * When receiving a text message
 */
socket.on('receive-message', (data) => {
    displayMessage(data.username, data.message, data.timestamp);
});

/**
 * When receiving an image message
 */
socket.on('receive-image', (data) => {
    displayImage(data.username, data.imageUrl, data.timestamp);
});

/**
 * When there's a general error
 */
socket.on('error', (data) => {
    alert(data.message);
});

/**
 * When socket connection is established
 */
socket.on('connect', () => {
    console.log('Connected to server');
});

/**
 * When socket connection is lost
 */
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

