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
    // End any active call
    if (currentCall.targetSocketId || callInterface.classList.contains('hidden') === false) {
        endCall();
    }
    
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
    
    // Clear users list
    if (usersList && userCount) {
        usersList.innerHTML = '';
        userCount.textContent = '0';
    }
    
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
    // Initialize call elements if not already done
    if (!usersList) {
        initCallElements();
        setupCallEventListeners();
    }

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

    // Request users list
    socket.emit('get-room-users');
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

// ==================== WEBCALL/CALLING FUNCTIONALITY ====================

// DOM Elements for calling (will be initialized when needed)
let usersList, userCount, incomingCallModal, incomingCallerName, incomingCallType, incomingCallTypeText;
let acceptCallBtn, rejectCallBtn, callInterface, localVideo, remoteVideo, remoteAudio;
let remoteAudioIndicator, remoteUsernameDisplay, toggleMuteBtn, toggleVideoBtn;
let toggleScreenShareBtn, endCallBtn, callStatusText, callDuration, toggleLocalVideoBtn, localMediaContainer;

// Initialize call-related DOM elements
function initCallElements() {
    usersList = document.getElementById('users-list');
    userCount = document.getElementById('user-count');
    incomingCallModal = document.getElementById('incoming-call-modal');
    incomingCallerName = document.getElementById('incoming-caller-name');
    incomingCallType = document.getElementById('incoming-call-type');
    incomingCallTypeText = document.getElementById('incoming-call-type-text');
    acceptCallBtn = document.getElementById('accept-call-btn');
    rejectCallBtn = document.getElementById('reject-call-btn');
    callInterface = document.getElementById('call-interface');
    localVideo = document.getElementById('local-video');
    remoteVideo = document.getElementById('remote-video');
    remoteAudio = document.getElementById('remote-audio');
    remoteAudioIndicator = document.getElementById('remote-audio-indicator');
    remoteUsernameDisplay = document.getElementById('remote-username-display');
    toggleMuteBtn = document.getElementById('toggle-mute');
    toggleVideoBtn = document.getElementById('toggle-video');
    toggleScreenShareBtn = document.getElementById('toggle-screen-share');
    endCallBtn = document.getElementById('end-call-btn');
    callStatusText = document.getElementById('call-status-text');
    callDuration = document.getElementById('call-duration');
    toggleLocalVideoBtn = document.getElementById('toggle-local-video');
    localMediaContainer = document.getElementById('local-media-container');
}

// WebRTC variables
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let currentCall = {
    targetSocketId: null,
    targetUsername: null,
    callType: null, // 'audio' or 'video'
    isIncoming: false
};
let callStartTime = null;
let callDurationInterval = null;
let roomUsers = [];

// WebRTC Configuration (using Google's public STUN server)
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// ==================== USER LIST MANAGEMENT ====================

/**
 * Update the users list in the sidebar
 */
function updateUsersList(users) {
    if (!usersList || !userCount) {
        initCallElements();
    }
    
    if (!usersList || !userCount) {
        console.error('Users list elements not found');
        return;
    }

    roomUsers = users;
    usersList.innerHTML = '';
    userCount.textContent = users.length + 1; // +1 for current user

    if (users.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'user-item';
        emptyMsg.style.color = '#8e9297';
        emptyMsg.style.fontSize = '0.85em';
        emptyMsg.textContent = 'No other users in room';
        usersList.appendChild(emptyMsg);
        return;
    }

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.socketId = user.socketId;

        const userName = document.createElement('div');
        userName.className = 'user-item-name';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = user.username.charAt(0).toUpperCase();
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = user.username;

        userName.appendChild(avatar);
        userName.appendChild(nameSpan);

        const callButtons = document.createElement('div');
        callButtons.className = 'user-call-buttons';

        const audioBtn = document.createElement('button');
        audioBtn.className = 'user-call-btn audio-btn';
        audioBtn.title = 'Voice Call';
        audioBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>';
        audioBtn.onclick = () => initiateCall(user.socketId, user.username, 'audio');

        const videoBtn = document.createElement('button');
        videoBtn.className = 'user-call-btn video-btn';
        videoBtn.title = 'Video Call';
        videoBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
        videoBtn.onclick = () => initiateCall(user.socketId, user.username, 'video');

        callButtons.appendChild(audioBtn);
        callButtons.appendChild(videoBtn);

        userItem.appendChild(userName);
        userItem.appendChild(callButtons);
        usersList.appendChild(userItem);
    });
}

// ==================== CALL INITIATION ====================

/**
 * Initiate a call with another user
 */
async function initiateCall(targetSocketId, targetUsername, callType) {
    try {
        // Request media permissions
        const constraints = {
            audio: true,
            video: callType === 'video' ? true : false
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Store call info
        currentCall = {
            targetSocketId: targetSocketId,
            targetUsername: targetUsername,
            callType: callType,
            isIncoming: false
        };

        // Setup local video IMMEDIATELY
        if (callType === 'video' && localVideo) {
            localVideo.srcObject = localStream;
            localVideo.style.display = 'block';
            localVideo.muted = true; // Mute local video to avoid feedback
        }

        // Show call interface immediately (before call is accepted)
        showCallInterface();

        // Create peer connection
        createPeerConnection(targetSocketId, true);

        // Send call request
        socket.emit('call-user', {
            targetSocketId: targetSocketId,
            callType: callType
        });

        if (callStatusText) {
            callStatusText.textContent = 'Calling...';
            callStatusText.style.color = '#faa61a';
        }

    } catch (error) {
        console.error('Error initiating call:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
        endCall();
    }
}

/**
 * Create WebRTC peer connection
 */
function createPeerConnection(targetSocketId, isCaller) {
    peerConnection = new RTCPeerConnection(rtcConfiguration);

    // Add local stream tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        
        if (currentCall.callType === 'video') {
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
                remoteVideo.style.display = 'block';
            }
            if (remoteAudioIndicator) remoteAudioIndicator.classList.add('hidden');
        } else {
            if (remoteAudio) remoteAudio.srcObject = remoteStream;
            if (remoteAudioIndicator) remoteAudioIndicator.classList.remove('hidden');
            if (remoteUsernameDisplay) remoteUsernameDisplay.textContent = currentCall.targetUsername;
        }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
                targetSocketId: targetSocketId,
                candidate: event.candidate
            });
        }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
            if (callStatusText) {
                callStatusText.textContent = 'Connected';
                callStatusText.style.color = '#23a55a';
            }
            startCallTimer();
            showCallInterface();
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
            endCall();
        }
    };

    // If caller, create offer
    if (isCaller) {
        peerConnection.createOffer()
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                socket.emit('webrtc-offer', {
                    targetSocketId: targetSocketId,
                    offer: peerConnection.localDescription
                });
            })
            .catch(error => {
                console.error('Error creating offer:', error);
                endCall();
            });
    }
}

/**
 * Show call interface
 */
function showCallInterface() {
    if (callInterface) callInterface.classList.remove('hidden');
    if (chatScreen) chatScreen.classList.add('hidden');
}

/**
 * Hide call interface
 */
function hideCallInterface() {
    if (callInterface) callInterface.classList.add('hidden');
    if (chatScreen) chatScreen.classList.remove('hidden');
}

/**
 * Start call timer
 */
function startCallTimer() {
    callStartTime = Date.now();
    callDurationInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        if (callDuration) {
            callDuration.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

/**
 * Stop call timer
 */
function stopCallTimer() {
    if (callDurationInterval) {
        clearInterval(callDurationInterval);
        callDurationInterval = null;
    }
    callStartTime = null;
    if (callDuration) callDuration.textContent = '00:00';
}

/**
 * End the current call
 */
function endCall() {
    // Stop all tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Clear video/audio elements
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) {
        remoteVideo.srcObject = null;
        remoteVideo.style.display = 'none';
    }
    if (remoteAudio) remoteAudio.srcObject = null;
    if (remoteAudioIndicator) remoteAudioIndicator.classList.add('hidden');

    // Stop timer
    stopCallTimer();

    // Notify other party if call was active
    if (currentCall.targetSocketId) {
        socket.emit('end-call', {
            targetSocketId: currentCall.targetSocketId
        });
    }

    // Reset call state
    currentCall = {
        targetSocketId: null,
        targetUsername: null,
        callType: null,
        isIncoming: false
    };

    // Hide call interface
    hideCallInterface();
    if (incomingCallModal) incomingCallModal.classList.add('hidden');
}

// ==================== CALL EVENT LISTENERS ====================

function setupCallEventListeners() {
    if (!acceptCallBtn || !rejectCallBtn || !endCallBtn) return;

    acceptCallBtn.addEventListener('click', async () => {
    try {
        // Request media permissions
        const constraints = {
            audio: true,
            video: currentCall.callType === 'video' ? true : false
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Setup local video IMMEDIATELY so both sides can see it
        if (currentCall.callType === 'video' && localVideo) {
            localVideo.srcObject = localStream;
            localVideo.style.display = 'block';
            localVideo.muted = true; // Mute local video to avoid feedback
        }

        // Show call interface immediately
        showCallInterface();

        // Create peer connection as answerer (before accepting, so stream is ready)
        createPeerConnection(currentCall.targetSocketId, false);

        // Accept call
        socket.emit('accept-call', {
            callerSocketId: currentCall.targetSocketId
        });

        // Hide incoming call modal
        if (incomingCallModal) incomingCallModal.classList.add('hidden');

        if (callStatusText) {
            callStatusText.textContent = 'Connecting...';
            callStatusText.style.color = '#faa61a';
        }

    } catch (error) {
        console.error('Error accepting call:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
        rejectCall();
    }
    });

    rejectCallBtn.addEventListener('click', rejectCall);

    endCallBtn.addEventListener('click', endCall);

    if (toggleMuteBtn) {
        toggleMuteBtn.addEventListener('click', () => {
            if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = !audioTrack.enabled;
                    toggleMuteBtn.classList.toggle('muted', !audioTrack.enabled);
                }
            }
        });
    }

    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', () => {
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.enabled = !videoTrack.enabled;
                    toggleVideoBtn.classList.toggle('active', !videoTrack.enabled);
                    if (localVideo) localVideo.style.opacity = videoTrack.enabled ? '1' : '0.5';
                }
            }
        });
    }

    if (toggleScreenShareBtn) {
        toggleScreenShareBtn.addEventListener('click', async () => {
            try {
                const videoTrack = localStream.getVideoTracks()[0];
                if (!videoTrack) return;

                const settings = videoTrack.getSettings();
                const isScreenSharing = settings.displaySurface === 'monitor' || 
                                       settings.displaySurface === 'window' || 
                                       settings.displaySurface === 'browser';
                
                if (isScreenSharing) {
                    // Currently sharing screen, switch back to camera
                    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const newVideoTrack = cameraStream.getVideoTracks()[0];
                    const oldVideoTrack = localStream.getVideoTracks()[0];
                    
                    localStream.removeTrack(oldVideoTrack);
                    localStream.addTrack(newVideoTrack);
                    if (localVideo) {
                        localVideo.srcObject = localStream;
                        localVideo.style.objectFit = 'cover';
                    }
                    
                    // Adjust container for camera view
                    if (localMediaContainer) {
                        localMediaContainer.style.width = '300px';
                        localMediaContainer.style.height = '225px';
                    }
                    
                    // Replace track in peer connection
                    if (peerConnection) {
                        const sender = peerConnection.getSenders().find(s => 
                            s.track && s.track.kind === 'video'
                        );
                        if (sender) {
                            sender.replaceTrack(newVideoTrack);
                        }
                    }
                    
                    oldVideoTrack.stop();
                    toggleScreenShareBtn.classList.remove('active');
                } else {
                    // Share screen
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                        video: { 
                            cursor: 'always',
                            displaySurface: 'monitor'
                        } 
                    });
                    const newVideoTrack = screenStream.getVideoTracks()[0];
                    const oldVideoTrack = localStream.getVideoTracks()[0];
                    
                    localStream.removeTrack(oldVideoTrack);
                    localStream.addTrack(newVideoTrack);
                    if (localVideo) {
                        localVideo.srcObject = localStream;
                        localVideo.style.objectFit = 'contain';
                    }

                    // Adjust container for screen share (larger)
                    if (localMediaContainer) {
                        localMediaContainer.style.width = '500px';
                        localMediaContainer.style.height = '375px';
                    }
                    
                    // Replace track in peer connection
                    if (peerConnection) {
                        const sender = peerConnection.getSenders().find(s => 
                            s.track && s.track.kind === 'video'
                        );
                        if (sender) {
                            sender.replaceTrack(newVideoTrack);
                        }
                    }

                    // Handle screen share end (when user stops sharing from browser)
                    newVideoTrack.onended = () => {
                        toggleScreenShareBtn.classList.remove('active');
                        // Switch back to camera
                        navigator.mediaDevices.getUserMedia({ video: true }).then(cameraStream => {
                            const cameraTrack = cameraStream.getVideoTracks()[0];
                            localStream.removeTrack(newVideoTrack);
                            localStream.addTrack(cameraTrack);
                            if (localVideo) {
                                localVideo.srcObject = localStream;
                                localVideo.style.objectFit = 'cover';
                            }
                            if (localMediaContainer) {
                                localMediaContainer.style.width = '300px';
                                localMediaContainer.style.height = '225px';
                            }
                            const sender = peerConnection?.getSenders().find(s => 
                                s.track && s.track.kind === 'video'
                            );
                            if (sender) sender.replaceTrack(cameraTrack);
                            oldVideoTrack.stop();
                        });
                    };
                    
                    oldVideoTrack.stop();
                    toggleScreenShareBtn.classList.add('active');
                }
            } catch (error) {
                console.error('Error toggling screen share:', error);
            }
        });
    }

    if (toggleLocalVideoBtn) {
        toggleLocalVideoBtn.addEventListener('click', () => {
            if (localVideo) {
                const isHidden = localVideo.style.display === 'none';
                localVideo.style.display = isHidden ? 'block' : 'none';
            }
        });
    }
}

function rejectCall() {
    socket.emit('reject-call', {
        callerSocketId: currentCall.targetSocketId
    });
    if (incomingCallModal) incomingCallModal.classList.add('hidden');
    currentCall = {
        targetSocketId: null,
        targetUsername: null,
        callType: null,
        isIncoming: false
    };
}


// ==================== SOCKET EVENT HANDLERS FOR CALLING ====================

// Handle room users list update
socket.on('room-users-list', (users) => {
    updateUsersList(users);
});

// Handle incoming call
socket.on('incoming-call', (data) => {
    if (!incomingCallModal) {
        initCallElements();
    }

    currentCall = {
        targetSocketId: data.callerSocketId,
        targetUsername: data.callerUsername,
        callType: data.callType,
        isIncoming: true
    };

    if (incomingCallerName) incomingCallerName.textContent = data.callerUsername;
    if (incomingCallType) incomingCallType.textContent = data.callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call';
    if (incomingCallTypeText) incomingCallTypeText.textContent = data.callType === 'video' ? 'wants to start a video call' : 'wants to start a voice call';
    
    if (incomingCallModal) incomingCallModal.classList.remove('hidden');
});

// Handle call accepted
socket.on('call-accepted', (data) => {
    if (callStatusText) {
        callStatusText.textContent = 'Connecting...';
        callStatusText.style.color = '#faa61a';
    }
});

// Handle call rejected
socket.on('call-rejected', (data) => {
    alert(`${data.answererUsername} rejected your call`);
    endCall();
});

// Handle call ended
socket.on('call-ended', (data) => {
    alert(`${data.fromUsername} ended the call`);
    endCall();
});

// Handle WebRTC offer
socket.on('webrtc-offer', async (data) => {
    if (!peerConnection) {
        createPeerConnection(data.fromSocketId, false);
    }

    try {
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
            targetSocketId: data.fromSocketId,
            answer: peerConnection.localDescription
        });
    } catch (error) {
        console.error('Error handling offer:', error);
        endCall();
    }
});

// Handle WebRTC answer
socket.on('webrtc-answer', async (data) => {
    try {
        await peerConnection.setRemoteDescription(data.answer);
    } catch (error) {
        console.error('Error handling answer:', error);
        endCall();
    }
});

// Handle ICE candidate
socket.on('webrtc-ice-candidate', async (data) => {
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(data.candidate);
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }
});


