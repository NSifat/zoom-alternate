/**
 * WebRTC Video Conference - Application Logic
 * Handles WebRTC peer connections, signaling, and UI interactions
 */

// ============ CONFIGURATION ============
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

// ============ STATE MANAGEMENT ============
const state = {
    socket: null,
    localStream: null,
    screenStream: null,
    peerConnections: new Map(), // socketId -> RTCPeerConnection
    dataChannels: new Map(),    // socketId -> RTCDataChannel
    roomId: null,
    mainRoomId: null,
    userId: null,
    userName: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isScreenPinned: false,
    activeScreenShareId: null,
    isHost: false,
    coHosts: new Set(),
    peers: new Map(), // socketId -> { userName, isAudioOn, isVideoOn }
    bannedUsers: new Set(), // Set of banned user IDs
    breakoutRooms: [], // [{ id, name }]
    settings: {
        joinMuted: false,
        showBreakoutRooms: true,
        autoMuteNewUsers: false,
        enableChat: true
    }
};

// ============ DOM ELEMENTS ============
const dom = {
    joinModal: document.getElementById('joinModal'),
    joinForm: document.getElementById('joinForm'),
    userName: document.getElementById('userName'),
    roomId: document.getElementById('roomId'),
    conferenceContainer: document.getElementById('conferenceContainer'),
    videoGrid: document.getElementById('videoGrid'),
    roomBadge: document.getElementById('roomBadge'),
    
    // Controls
    toggleAudioBtn: document.getElementById('toggleAudioBtn'),
    toggleVideoBtn: document.getElementById('toggleVideoBtn'),
    toggleScreenShareBtn: document.getElementById('toggleScreenShareBtn'),
    toggleChatBtn: document.getElementById('toggleChatBtn'),
    hostPanelBtn: document.getElementById('hostPanelBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    hangUpBtn: document.getElementById('hangUpBtn'),
    
    // Chat
    chatSidebar: document.getElementById('chatSidebar'),
    chatMessages: document.getElementById('chatMessages'),
    chatForm: document.getElementById('chatForm'),
    chatInput: document.getElementById('chatInput'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    
    // Breakout rooms
    breakoutModal: document.getElementById('breakoutModal'),
    breakoutRoomsBtn: document.getElementById('breakoutRoomsBtn'),
    closeBreakoutBtn: document.getElementById('closeBreakoutBtn'),
    breakoutRoomsList: document.getElementById('breakoutRoomsList'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    breakoutCount: document.getElementById('breakoutCount'),
    returnMainBtn: document.getElementById('returnMainBtn'),
    
    // Other
    shareCodeBtn: document.getElementById('shareCodeBtn'),
    screenShareOverlay: document.getElementById('screenShareOverlay'),
    remoteScreenVideo: document.getElementById('remoteScreenVideo'),
    screenShareThumbnails: document.getElementById('screenShareThumbnails'),
    pinScreenBtn: document.getElementById('pinScreenBtn'),
    fullscreenScreenBtn: document.getElementById('fullscreenScreenBtn'),
    toastContainer: document.getElementById('toastContainer'),
    
    // Settings
    enableChatCheckbox: document.getElementById('enableChat')
};

// ============ INITIALIZATION ============

/**
 * Initialize Socket.IO connection
 */
function initializeSocket() {
    try {
        // Connect to backend server
        // For GitHub Pages: use deployed backend URL
        // For localhost: use localhost:3000
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://zoom-alternate-backend.onrender.com';
        
        console.log('[Socket] Connecting to:', serverUrl);
        state.socket = io(serverUrl);

        state.socket.on('connect', () => {
            console.log('✓ Connected to signaling server');
            ensureLocalTile();
        });

        state.socket.on('connect_error', (error) => {
            console.error('[Socket Error] Connection failed:', error);
            showToast('Connection failed. Retrying...', 'error');
        });

        state.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected from server');
        });
    } catch (error) {
        console.error('[Socket Init Error]', error);
        showToast('Failed to initialize socket connection', 'error');
        throw error;
    }

    /**
     * Handle new user joined
     */
    state.socket.on('user-joined', async (data) => {
        console.log(`[Event] User joined: ${data.userName} (${data.socketId})`);
        
        state.peers.set(data.socketId, {
            userName: data.userName,
            isAudioOn: true,
            isVideoOn: true
        });

        // Determine initiator: user with smaller socket ID should initiate
        const shouldInitiate = state.socket.id < data.socketId;
        console.log(`[Event] Initiator: ${shouldInitiate ? 'us' : 'peer'} (comparing ${state.socket.id} vs ${data.socketId})`);

        // Create peer connection for new user
        await createPeerConnection(data.socketId, shouldInitiate);

        // Add local video tile
        addVideoTile(data.socketId, data.userName, false);
        
        showToast(`${data.userName} joined`, 'info');
    });

    /**
     * Handle existing users list
     */
    state.socket.on('existing-users', async (data) => {
        console.log(`[Event] Existing users: ${data.users.length}`);
        
        if (data.users.length === 0) {
            console.log('[Event] Room is empty - waiting for peers to join');
        } else {
            console.log(`[Event] Creating ${data.users.length} peer connections...`);
        }
        
        for (const user of data.users) {
            state.peers.set(user.socketId, {
                userName: user.userName,
                isAudioOn: true,
                isVideoOn: true
            });

            // Determine initiator: user with smaller socket ID should initiate
            const shouldInitiate = state.socket.id < user.socketId;
            console.log(`[Event] Initiator for ${user.userName}: ${shouldInitiate ? 'us' : 'peer'} (comparing ${state.socket.id} vs ${user.socketId})`);
            
            // Create peer connection for each existing user
            await createPeerConnection(user.socketId, shouldInitiate);
            
            // Add video tile
            addVideoTile(user.socketId, user.userName, false);
        }

        // Ensure local tile is visible after room switch
        ensureLocalTile();
    });

    /**
     * Host status
     */
    state.socket.on('host-status', (data) => {
        state.isHost = !!data?.isHost;
        updateHostUI();
    });

    /**
     * Host list update (cohosts)
     */
    state.socket.on('host-list', (data) => {
        state.coHosts = new Set(data?.coHosts || []);
        updateParticipantsList();
    });

    /**
     * Participants state
     */
    state.socket.on('participants-state', (data) => {
        state.participantsState = Array.isArray(data?.participants) ? data.participants : [];
        updateParticipantsList();
    });

    /**
     * Handle room settings from server
     */
    state.socket.on('room-settings', (data) => {
        if (data?.settings) {
            state.settings = { ...state.settings, ...data.settings };
            applySettingsVisibility();
        }
    });

    /**
     * Handle WebRTC offer from peer
     */
    state.socket.on('offer', async (data) => {
        console.log(`[WebRTC] Received offer from ${data.from}`);
        
        try {
            let peerConnection = state.peerConnections.get(data.from);
            
            if (!peerConnection) {
                console.log('[WebRTC] Peer connection not found, creating new one...');
                peerConnection = await createPeerConnection(data.from, false);
            }

            console.log(`[WebRTC] Peer connection state: ${peerConnection.signalingState}`);

            // Set remote description only if not already set and connection not closed
            if (peerConnection.remoteDescription === null && peerConnection.signalingState !== 'closed') {
                try {
                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription(data.offer)
                    );
                    console.log('[WebRTC] Remote offer description set successfully');
                } catch (setRemoteError) {
                    console.error('[WebRTC] Failed to set remote description:', setRemoteError.message);
                    console.log('Current signaling state:', peerConnection.signalingState);
                    return;
                }
            } else {
                console.log('[WebRTC] Cannot set offer - remote already set or connection closed');
                console.log('remoteDescription:', peerConnection.remoteDescription ? 'set' : 'null');
                console.log('signalingState:', peerConnection.signalingState);
                return;
            }

            // Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            state.socket.emit('answer', {
                to: data.from,
                answer: answer
            });

            console.log(`[WebRTC] Sent answer to ${data.from}`);
        } catch (error) {
            console.error('[WebRTC Offer Error]', error.message);
            showToast('Connection error - offer failed', 'error');
        }
    });

    /**
     * Handle WebRTC answer from peer
     */
    state.socket.on('answer', async (data) => {
        console.log(`[WebRTC] Received answer from ${data.from}`);
        
        try {
            const peerConnection = state.peerConnections.get(data.from);
            
            if (!peerConnection) {
                console.warn('[WebRTC] Peer connection not found for answer');
                return;
            }

            console.log(`[WebRTC] Peer connection state before answer: ${peerConnection.signalingState}`);

            // Only set remote description if we have a local description and it hasn't been set yet
            if (peerConnection.localDescription && peerConnection.remoteDescription === null && peerConnection.signalingState !== 'closed') {
                try {
                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription(data.answer)
                    );
                    console.log(`[WebRTC] Answer set successfully from ${data.from}`);
                } catch (setRemoteError) {
                    console.error('[WebRTC] Failed to set answer:', setRemoteError.message);
                    console.log('Current signaling state:', peerConnection.signalingState);
                    return;
                }
            } else {
                console.log('[WebRTC] Cannot set answer - conditions not met');
                console.log('Has local description:', !!peerConnection.localDescription);
                console.log('Remote is null:', peerConnection.remoteDescription === null);
                console.log('Signaling state:', peerConnection.signalingState);
            }
        } catch (error) {
            console.error('[WebRTC Answer Error]', error.message);
        }
    });

    /**
     * Handle ICE candidate exchange
     */
    state.socket.on('ice-candidate', async (data) => {
        try {
            const peerConnection = state.peerConnections.get(data.from);
            
            if (!peerConnection) {
                console.warn(`[ICE] Peer connection not found for ${data.from}, skipping candidate`);
                return;
            }

            // Only add ICE candidates if connection is in appropriate state
            if (peerConnection.signalingState === 'closed') {
                console.warn('[ICE] Connection closed, ignoring candidate');
                return;
            }

            if (data.candidate) {
                try {
                    await peerConnection.addIceCandidate(
                        new RTCIceCandidate(data.candidate)
                    );
                    console.log(`[ICE] Candidate added for ${data.from}`);
                } catch (addCandidateError) {
                    // Don't treat all errors as fatal - some candidates may fail but others will work
                    if (addCandidateError.name !== 'OperationError') {
                        console.warn('[ICE] Non-fatal error adding candidate:', addCandidateError.message);
                    }
                }
            }
        } catch (error) {
            console.error('[ICE Error]', error.message);
        }
    });

    /**
     * Handle user disconnect
     */
    state.socket.on('user-left', (data) => {
        console.log(`[Event] User left: ${data.userName}${data.reason ? ' (' + data.reason + ')' : ''}`);
        
        removeUser(data.socketId);
        if (data.reason === 'banned') {
            showToast(`${data.userName} was removed from the meeting`, 'info');
        } else {
            showToast(`${data.userName} left`, 'info');
        }
    });

    /**
     * Handle chat message
     */
    state.socket.on('chat-message', (data) => {
        displayChatMessage(data.userName, data.message, data.timestamp, false);
    });

    /**
     * Handle being banned
     */
    state.socket.on('banned', (data) => {
        console.log('[Ban] You have been banned');
        showToast(data.message, 'error');
        setTimeout(() => {
            leaveMeeting();
        }, 2000);
    });

    /**
     * Handle force mute
     */
    state.socket.on('force-mute', () => {
        console.log('[Host] Forcing mute');
        if (state.isAudioEnabled) {
            toggleAudio();
        }
        showToast('Host muted your microphone', 'info');
    });

    /**
     * Handle force disable camera
     */
    state.socket.on('force-disable-camera', () => {
        console.log('[Host] Forcing camera off');
        if (state.isVideoEnabled) {
            toggleVideo();
        }
        showToast('Host turned off your camera', 'info');
    });

    /**
     * Handle settings update
     */
    state.socket.on('settings-updated', (data) => {
        console.log('[Settings] Updated by:', data.by);
        state.settings = data.settings;
        showToast(`Settings updated by ${data.by}`, 'info');
        applySettingsVisibility();
    });

    /**
     * Handle breakout rooms updates
     */
    state.socket.on('breakout-rooms-updated', (data) => {
        if (data?.mainRoomId) {
            state.mainRoomId = data.mainRoomId;
        }
        state.breakoutRooms = Array.isArray(data?.rooms) ? data.rooms : [];
        renderBreakoutRoomsList();
        showToast('Breakout rooms updated', 'info');
    });

    /**
     * Handle forced return to main meeting
     */
    state.socket.on('return-to-main', (data) => {
        console.log('[Breakout] Returning to main room');
        if (data?.mainRoomId) {
            state.mainRoomId = data.mainRoomId;
        }
        if (state.mainRoomId) {
            switchRoom(state.mainRoomId, { silent: true });
            showToast('Returned to main meeting', 'info');
        }
    });

    /**
     * Handle screen share start
     */
    state.socket.on('screen-share-started', (data) => {
        console.log(`[ScreenShare] Started by ${data.userName}`);
        showScreenShareOverlay(data.socketId, data.userName);
        showToast(`${data.userName} is sharing screen`, 'info');
    });

    /**
     * Handle screen share stop
     */
    state.socket.on('screen-share-stopped', (data) => {
        console.log(`[ScreenShare] Stopped by ${data.userName}`);
        hideScreenShareOverlay();
        showToast(`${data.userName} stopped sharing screen`, 'info');
    });

    state.socket.on('disconnect', () => {
        console.log('✗ Disconnected from signaling server');
        showToast('Connection lost', 'error');
    });
}

/**
 * Create RTCPeerConnection with local stream
 * @param {string} peerId - Socket ID of the peer
 * @param {boolean} initiator - Whether this peer should initiate the offer
 */
async function createPeerConnection(peerId, initiator) {
    console.log(`[PeerConnection] Creating for ${peerId} (initiator: ${initiator})`);

    try {
        // Create peer connection
        const peerConnection = new RTCPeerConnection({
            iceServers: config.iceServers
        });

        // Add local stream tracks
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, state.localStream);
            });
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                state.socket.emit('ice-candidate', {
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log(`[Stream] Received remote track from ${peerId}`);
            updateVideoTile(peerId, event.streams[0]);
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`[PeerConnection] State for ${peerId}: ${peerConnection.connectionState}`);
            
            if (peerConnection.connectionState === 'failed') {
                showToast('Connection failed, attempting to reconnect...', 'error');
            } else if (peerConnection.connectionState === 'disconnected') {
                console.log(`Peer ${peerId} disconnected`);
            }
        };

        // Store peer connection
        state.peerConnections.set(peerId, peerConnection);

        // If initiator, create and send offer
        if (initiator) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            state.socket.emit('offer', {
                to: peerId,
                offer: offer
            });

            console.log(`[WebRTC] Sent offer to ${peerId}`);
        }

        return peerConnection;
    } catch (error) {
        console.error('Error creating peer connection:', error);
        showToast('Error creating peer connection', 'error');
    }
}

/**
 * Remove user and clean up resources
 * @param {string} socketId - Socket ID of user to remove
 */
function removeUser(socketId) {
    // Close peer connection
    const peerConnection = state.peerConnections.get(socketId);
    if (peerConnection) {
        peerConnection.close();
        state.peerConnections.delete(socketId);
    }

    // Remove from peers list
    state.peers.delete(socketId);

    // Remove video tile
    const videoTile = document.getElementById(`video-${socketId}`);
    if (videoTile) {
        videoTile.remove();
    }

    // Update grid layout
    updateGridLayout();
}

/**
 * Ensure local video tile exists and is bound to local stream
 */
function ensureLocalTile() {
    if (!state.localStream || !state.socket?.id) return;

    if (!document.getElementById(`video-${state.socket.id}`)) {
        addVideoTile(state.socket.id, `${state.userName} (You)`, true);
    }
    updateVideoTile(state.socket.id, state.localStream);
}

// ============ VIDEO/AUDIO MANAGEMENT ============

/**
 * Initialize local media (camera and microphone)
 */
async function initializeLocalMedia() {
    try {
        console.log('[Media] Requesting camera and microphone access...');
        
        state.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });

        console.log('[Media] ✓ Local media initialized');
        console.log('[Media] Stream ID:', state.localStream.id);
        console.log('[Media] Audio tracks:', state.localStream.getAudioTracks().length);
        console.log('[Media] Video tracks:', state.localStream.getVideoTracks().length);
        
        // Log track states
        state.localStream.getAudioTracks().forEach((track, i) => {
            console.log(`[Media] Audio track ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
        });
        state.localStream.getVideoTracks().forEach((track, i) => {
            console.log(`[Media] Video track ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
        });

        // Add local video tile
        if (state.socket?.id) {
            console.log('[Media] Adding video tile for local user');
            const localVideoTile = addVideoTile(state.socket.id, `${state.userName} (You)`, true);
            updateVideoTile(state.socket.id, state.localStream);
        } else {
            console.warn('[Media] Socket not ready, will add video tile later');
        }

        // Apply join-muted setting
        if (state.settings?.joinMuted && state.isAudioEnabled) {
            toggleAudio();
        }

        return true;
    } catch (error) {
        console.error('[Media Error]', error.name, ':', error.message);
        
        let errorMsg = error.message;
        if (error.name === 'NotAllowedError') {
            errorMsg = 'Camera/Microphone permission denied. Please allow access in browser settings.';
        } else if (error.name === 'NotFoundError') {
            errorMsg = 'No camera or microphone found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMsg = 'Camera/Microphone is being used by another application.';
        }
        
        showToast(errorMsg, 'error');
        return false;
    }
}

/**
 * Toggle audio (mute/unmute microphone)
 */
let audioToggleTimeout = null;
function toggleAudio() {
    // Debounce to prevent double-firing
    if (audioToggleTimeout) {
        console.log('[toggleAudio] Debounced - skipping duplicate call');
        return;
    }
    
    audioToggleTimeout = setTimeout(() => {
        audioToggleTimeout = null;
    }, 300);
    
    console.log('[toggleAudio] Function called');
    console.log('[toggleAudio] localStream:', state.localStream);
    
    if (!state.localStream) {
        console.error('[toggleAudio] No local stream available!');
        showToast('Microphone not initialized', 'error');
        return;
    }

    const audioTracks = state.localStream.getAudioTracks();
    console.log('[toggleAudio] Audio tracks found:', audioTracks.length);
    
    if (audioTracks.length === 0) {
        console.error('[toggleAudio] No audio tracks in stream!');
        showToast('No microphone track found', 'error');
        return;
    }

    state.isAudioEnabled = !state.isAudioEnabled;
    console.log('[toggleAudio] Setting audio to:', state.isAudioEnabled);

    audioTracks.forEach(track => {
        track.enabled = state.isAudioEnabled;
        console.log('[toggleAudio] Track enabled:', track.enabled);
    });

    // Update button UI
    const btn = document.getElementById('toggleAudioBtn');
    if (btn) {
        updateControlButton(btn, state.isAudioEnabled);
        const labelElement = btn.querySelector('.control-label');
        if (labelElement) {
            const label = state.isAudioEnabled ? 'Mute' : 'Unmute';
            labelElement.textContent = label;
        }
    }

    console.log(`[Audio] Microphone ${state.isAudioEnabled ? 'ON' : 'OFF'}`);
    showToast(`Microphone ${state.isAudioEnabled ? 'ON' : 'OFF'}`, 'info');

    emitMediaState();
}

/**
 * Toggle video (camera on/off)
 */
let videoToggleTimeout = null;
function toggleVideo() {
    // Debounce to prevent double-firing
    if (videoToggleTimeout) {
        console.log('[toggleVideo] Debounced - skipping duplicate call');
        return;
    }
    
    videoToggleTimeout = setTimeout(() => {
        videoToggleTimeout = null;
    }, 300);
    
    console.log('[toggleVideo] Function called');
    console.log('[toggleVideo] localStream:', state.localStream);
    
    if (!state.localStream) {
        console.error('[toggleVideo] No local stream available!');
        showToast('Camera not initialized', 'error');
        return;
    }

    const videoTracks = state.localStream.getVideoTracks();
    console.log('[toggleVideo] Video tracks found:', videoTracks.length);
    
    if (videoTracks.length === 0) {
        console.error('[toggleVideo] No video tracks in stream!');
        showToast('No camera track found', 'error');
        return;
    }

    state.isVideoEnabled = !state.isVideoEnabled;
    console.log('[toggleVideo] Setting video to:', state.isVideoEnabled);

    videoTracks.forEach(track => {
        track.enabled = state.isVideoEnabled;
        console.log('[toggleVideo] Track enabled:', track.enabled);
    });

    // Update button UI
    const btn = document.getElementById('toggleVideoBtn');
    if (btn) {
        updateControlButton(btn, state.isVideoEnabled);
        const labelElement = btn.querySelector('.control-label');
        if (labelElement) {
            const label = state.isVideoEnabled ? 'Stop Video' : 'Start Video';
            labelElement.textContent = label;
        }
    }

    console.log(`[Video] Camera ${state.isVideoEnabled ? 'ON' : 'OFF'}`);
    showToast(`Camera ${state.isVideoEnabled ? 'ON' : 'OFF'}`, 'info');

    emitMediaState();
}

/**
 * Toggle screen sharing
 */
async function toggleScreenShare() {
    console.log('[ScreenShare] Toggle called, current state:', state.isScreenSharing);
    
    try {
        if (!state.isScreenSharing) {
            // Start screen sharing
            console.log('[ScreenShare] Requesting screen selection...');
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                console.error('[ScreenShare] getDisplayMedia not supported');
                showToast('Screen sharing not supported in this browser', 'error');
                return;
            }
            
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: false
            });

            console.log('[ScreenShare] Screen stream obtained:', screenStream);
            state.screenStream = screenStream;
            state.isScreenSharing = true;

            // Replace video track in peer connections
            const screenTrack = screenStream.getVideoTracks()[0];
            console.log('[ScreenShare] Screen track:', screenTrack);
            
            if (state.localStream) {
                const videoTrack = state.localStream.getVideoTracks()[0];
                console.log('[ScreenShare] Original video track:', videoTrack);

                console.log('[ScreenShare] Replacing tracks in', state.peerConnections.size, 'peer connections');
                for (const [peerId, peerConnection] of state.peerConnections.entries()) {
                    const sender = peerConnection.getSenders()
                        .find(s => s.track?.kind === 'video');
                    
                    if (sender) {
                        await sender.replaceTrack(screenTrack);
                        console.log('[ScreenShare] Replaced track for peer:', peerId);
                    }
                }
            }

            // Update local video tile to show screen
            if (state.socket?.id) {
                updateVideoTile(state.socket.id, screenStream);
            }

            // Notify others
            if (state.socket) {
                state.socket.emit('screen-share-start');
                console.log('[ScreenShare] Notified peers of screen share start');
            }
            
            // Handle screen share stop
            screenTrack.onended = () => {
                console.log('[ScreenShare] Screen share stopped by user');
                stopScreenShare();
            };

            const btn = document.getElementById('toggleScreenShareBtn');
            if (btn) updateControlButton(btn, true);
            showToast('Screen sharing started', 'success');
            console.log('[ScreenShare] ✓ Screen share started successfully');
        } else {
            // Stop screen sharing
            stopScreenShare();
        }
    } catch (error) {
        if (error.name !== 'NotAllowedError') {
            console.error('[ScreenShare Error]', error);
            showToast(`Screen share error: ${error.message}`, 'error');
        } else {
            console.log('[ScreenShare] User cancelled screen selection');
        }
    }
}

/**
 * Stop screen sharing
 */
async function stopScreenShare() {
    try {
        console.log('[ScreenShare] Stopping screen share...');

        // Stop screen stream
        if (state.screenStream) {
            state.screenStream.getTracks().forEach(track => track.stop());
            state.screenStream = null;
        }

        state.isScreenSharing = false;

        // Replace screen track back with camera track
        const videoTrack = state.localStream.getVideoTracks()[0];

        for (const peerConnection of state.peerConnections.values()) {
            const sender = peerConnection.getSenders()
                .find(s => s.track?.kind === 'video');
            
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
        }

        // Update local video tile to show camera
        updateVideoTile(state.socket.id, state.localStream);

        // Notify others
        state.socket.emit('screen-share-stop');

        updateControlButton(dom.toggleScreenShareBtn, false);
        hideScreenShareOverlay();
        showToast('Screen sharing stopped', 'info');
    } catch (error) {
        console.error('Error stopping screen share:', error);
    }
}

// ============ VIDEO TILE MANAGEMENT ============

/**
 * Add a video tile to the grid
 * @param {string} socketId - Socket ID of the peer
 * @param {string} userName - Display name
 * @param {boolean} isLocal - Whether this is the local user
 * @returns {HTMLElement} The video tile element
 */
function addVideoTile(socketId, userName, isLocal) {
    // Check if tile already exists
    if (document.getElementById(`video-${socketId}`)) {
        return document.getElementById(`video-${socketId}`);
    }

    console.log(`[Video] Adding tile for ${userName} (${isLocal ? 'local' : 'remote'})`);

    const tile = document.createElement('div');
    tile.className = `video-tile ${isLocal ? 'local' : ''} no-video`;
    tile.id = `video-${socketId}`;
    tile.innerHTML = `
        <video 
            id="video-stream-${socketId}" 
            autoplay 
            playsinline 
            ${isLocal ? 'muted' : ''}
        ></video>
        <div class="video-tile-overlay">
            <div class="video-tile-header">
                <div class="video-tile-name">${userName}</div>
                <div class="video-tile-status">
                    <span class="status-indicator audio-on" title="Audio"></span>
                    <span class="status-indicator video-on" title="Video"></span>
                </div>
            </div>
        </div>
    `;

    dom.videoGrid.appendChild(tile);
    updateGridLayout();

    return tile;
}

/**
 * Update video tile with stream
 * @param {string} socketId - Socket ID
 * @param {MediaStream} stream - Media stream to display
 */
function updateVideoTile(socketId, stream) {
    const videoElement = document.getElementById(`video-stream-${socketId}`);
    const tile = document.getElementById(`video-${socketId}`);

    if (videoElement && stream) {
        console.log(`[Video] Updating stream for tile: ${socketId}`);
        videoElement.srcObject = stream;
        
        // Remove no-video class when video is playing
        videoElement.onloadedmetadata = () => {
            tile?.classList.remove('no-video');
        };
    }
}

/**
 * Update grid layout based on number of videos
 */
function updateGridLayout() {
    const tileCount = dom.videoGrid.querySelectorAll('.video-tile').length;
    
    // Adjust grid for single video (maximize)
    if (tileCount === 1) {
        dom.videoGrid.classList.add('single-video');
    } else {
        dom.videoGrid.classList.remove('single-video');
    }
}

// ============ SCREEN SHARING UI ============

/**
 * Show screen share overlay
 * @param {string} socketId - Socket ID of screen sharer
 * @param {string} userName - Name of person sharing
 */
function showScreenShareOverlay(socketId, userName) {
    dom.screenShareOverlay.classList.remove('hidden');
    document.getElementById('screenShareUserName').textContent = `${userName} is sharing`;
    state.activeScreenShareId = socketId;

    const sourceVideo = document.getElementById(`video-stream-${socketId}`);
    if (sourceVideo?.srcObject) {
        dom.remoteScreenVideo.srcObject = sourceVideo.srcObject;
    }
}

/**
 * Hide screen share overlay
 */
function hideScreenShareOverlay() {
    if (state.isScreenPinned) {
        return;
    }
    dom.screenShareOverlay.classList.add('hidden');
    dom.remoteScreenVideo.srcObject = null;
    state.activeScreenShareId = null;
}

/**
 * Toggle pin for screen share overlay
 */
function togglePinScreen() {
    state.isScreenPinned = !state.isScreenPinned;
    dom.screenShareOverlay.classList.toggle('pinned', state.isScreenPinned);
    const label = state.isScreenPinned ? 'Pinned' : 'Pin';
    if (dom.pinScreenBtn) {
        dom.pinScreenBtn.innerHTML = `<i class="fas fa-thumbtack"></i> ${label}`;
    }
    if (!state.isScreenPinned && !state.activeScreenShareId) {
        hideScreenShareOverlay();
    }
}

/**
 * Toggle fullscreen for screen share overlay
 */
function toggleScreenFullscreen() {
    const target = dom.screenShareOverlay;
    if (!document.fullscreenElement) {
        target?.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
}

// ============ CHAT FUNCTIONALITY ============

/**
 * Send chat message
 */
function sendChatMessage(message) {
    if (!message.trim()) return;

    console.log(`[Chat] Sent: "${message}"`);

    // Display locally
    displayChatMessage(state.userName, message, Date.now(), true);

    // Send to others
    state.socket.emit('chat-message', {
        message: message
    });

    dom.chatInput.value = '';
}

/**
 * Display chat message
 * @param {string} author - Message author
 * @param {string} message - Message text
 * @param {number} timestamp - Message timestamp
 * @param {boolean} isOwn - Whether message is from current user
 */
function displayChatMessage(author, message, timestamp, isOwn) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isOwn ? 'own' : ''}`;
    
    const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageEl.innerHTML = `
        <div class="chat-message-author">${author}</div>
        <div class="chat-message-text">${escapeHtml(message)}</div>
        <div class="chat-message-time">${time}</div>
    `;

    dom.chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

// ============ BREAKOUT ROOMS ============

/**
 * Switch to different room
 * @param {string} newRoomId - Room ID to switch to
 * @param {object} options - { silent?: boolean }
 */
function switchRoom(newRoomId, options = {}) {
    console.log(`[Room] Switching to ${newRoomId}`);

    // Close existing peer connections
    for (const [peerId, peerConnection] of state.peerConnections) {
        peerConnection.close();
    }
    state.peerConnections.clear();
    state.peers.clear();

    // Clear video grid
    dom.videoGrid.innerHTML = '';

    // Re-add local tile immediately to avoid dark screen
    ensureLocalTile();

    // Switch room via socket
    state.socket.emit('switch-room', {
        newRoomId: newRoomId
    });

    emitMediaState();

    // Update room badge
    state.roomId = newRoomId;
    const badgeLabel = newRoomId === state.mainRoomId ? `${newRoomId} (Main)` : newRoomId;
    dom.roomBadge.textContent = `Room: ${badgeLabel}`;

    // Close modal
    dom.breakoutModal.classList.add('hidden');
    renderBreakoutRoomsList();
    if (!options.silent) {
        showToast(`Switched to room: ${newRoomId}`, 'info');
    }
}

/**
 * Create breakout rooms in bulk (does not auto-join)
 * @param {number} count - Number of rooms to create
 */
function createBreakoutRooms(count) {
    const roomCount = Math.max(1, Math.min(50, Number(count || 0)));
    if (!roomCount) return;

    const baseId = state.mainRoomId || state.roomId;
    state.breakoutRooms = Array.from({ length: roomCount }, (_, idx) => {
        const number = idx + 1;
        return {
            id: `${baseId}::breakout::${number}`,
            name: `Room ${number}`
        };
    });

    renderBreakoutRoomsList();
    broadcastBreakoutRooms();
    showToast(`Created ${roomCount} breakout rooms`, 'success');
}

/**
 * Broadcast breakout rooms list to other participants
 */
function broadcastBreakoutRooms() {
    if (state.socket) {
        state.socket.emit('breakout-rooms-update', {
            rooms: state.breakoutRooms,
            mainRoomId: state.mainRoomId
        });
    }
}

/**
 * Render breakout rooms list
 */
function renderBreakoutRoomsList() {
    if (!dom.breakoutRoomsList) return;

    if (state.settings?.showBreakoutRooms === false) {
        dom.breakoutRoomsList.innerHTML = '<p class="muted">Breakout rooms are hidden by the host.</p>';
        return;
    }

    if (!state.breakoutRooms.length) {
        dom.breakoutRoomsList.innerHTML = '<p class="muted">No breakout rooms created yet.</p>';
        return;
    }

    dom.breakoutRoomsList.innerHTML = '';
    state.breakoutRooms.forEach((room) => {
        const isCurrent = state.roomId === room.id;
        const actionLabel = isCurrent ? 'Leave' : 'Join';
        const item = document.createElement('div');
        item.className = 'breakout-room-item';
        item.innerHTML = `
            <div class="breakout-room-info">
                <div class="breakout-room-name" contenteditable="true" data-room-id="${room.id}">${room.name}</div>
                <p>${room.id}</p>
            </div>
            <div class="breakout-room-actions">
                <button class="breakout-room-btn" data-join-room="${room.id}">
                    ${actionLabel}
                </button>
            </div>
        `;
        dom.breakoutRoomsList.appendChild(item);
    });

    // Attach handlers
    dom.breakoutRoomsList.querySelectorAll('[data-join-room]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const roomId = e.currentTarget.getAttribute('data-join-room');
            if (roomId) joinBreakoutRoom(roomId);
        });
    });

    dom.breakoutRoomsList.querySelectorAll('.breakout-room-name').forEach((nameEl) => {
        nameEl.addEventListener('blur', (e) => {
            const id = e.currentTarget.getAttribute('data-room-id');
            const newName = e.currentTarget.textContent.trim() || 'Room';
            const room = state.breakoutRooms.find(r => r.id === id);
            if (room) {
                room.name = newName;
                broadcastBreakoutRooms();
            }
        });
    });
}

/**
 * Join a breakout room
 */
function joinBreakoutRoom(roomId) {
    if (!roomId) return;
    if (state.roomId === roomId) {
        returnToMainMeeting();
    } else {
        switchRoom(roomId);
    }
}

/**
 * Return to main meeting
 */
function returnToMainMeeting() {
    if (!state.mainRoomId) return;
    switchRoom(state.mainRoomId);
}

/**
 * Close all breakout rooms and return everyone to main
 */
function closeAllBreakoutRooms() {
    if (!state.mainRoomId) return;
    if (!confirm('Close all breakout rooms and return everyone to main meeting?')) return;

    if (state.socket) {
        state.socket.emit('close-breakouts', { mainRoomId: state.mainRoomId });
    }
    if (state.roomId !== state.mainRoomId) {
        switchRoom(state.mainRoomId, { silent: true });
    }
    showToast('Closing breakout rooms...', 'info');
}

// ============ UI INTERACTION HANDLERS ============

/**
 * Update control button active state
 * @param {HTMLElement} button - Button element
 * @param {boolean} isActive - Whether button is active
 */
function updateControlButton(button, isActive) {
    if (isActive) {
        button.classList.remove('active');
    } else {
        button.classList.add('active');
    }
}

/**
 * Toggle chat sidebar
 */
function toggleChat() {
    const isHidden = dom.chatSidebar.classList.toggle('hidden');
    console.log(`[Chat] Chat sidebar ${isHidden ? 'hidden' : 'shown'}`);
}

/**
 * Open settings dialog
 */
function openSettings() {
    console.log('[Settings] Settings button clicked');
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        loadSettingsValues();
    }
}

/**
 * Close settings dialog
 */
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Logout user
 */
function logout() {
    if (confirm('Are you sure you want to leave the meeting?')) {
        // Disconnect and cleanup
        if (state.socket) {
            state.socket.disconnect();
        }
        
        // Stop all media streams
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
        }
        if (state.screenStream) {
            state.screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Clear settings
        localStorage.removeItem('conferenceSettings');
        
        // Reload page to join modal
        window.location.reload();
    }
}

/**
 * Load current settings values into the modal
 */
function loadSettingsValues() {
    const joinMutedCheckbox = document.getElementById('joinMuted');
    const showBreakoutCheckbox = document.getElementById('showBreakout');
    const enableChatCheckbox = document.getElementById('enableChat');
    
    if (joinMutedCheckbox) joinMutedCheckbox.checked = state.settings?.joinMuted || false;
    if (showBreakoutCheckbox) showBreakoutCheckbox.checked = state.settings?.showBreakoutRooms !== false;
    if (enableChatCheckbox) enableChatCheckbox.checked = state.settings?.enableChat !== false;
    
    // Update participants list
    updateParticipantsList();
}

/**
 * Save settings
 */
function saveSettings() {
    const joinMuted = document.getElementById('joinMuted')?.checked || false;
    const showBreakout = document.getElementById('showBreakout')?.checked || false;
    const enableChat = document.getElementById('enableChat')?.checked !== false;
    
    state.settings = {
        joinMuted,
        showBreakoutRooms: showBreakout,
        enableChat
    };
    
    // Save to localStorage
    localStorage.setItem('conferenceSettings', JSON.stringify(state.settings));
    
    // Notify server of settings change
    if (state.socket) {
        state.socket.emit('update-settings', state.settings);
    }

    applySettingsVisibility();
    
    showToast('Settings saved', 'success');
    closeSettings();
}

/**
 * Apply UI visibility based on settings
 */
function applySettingsVisibility() {
    const showBreakout = state.settings?.showBreakoutRooms !== false;
    if (dom.breakoutRoomsBtn) {
        dom.breakoutRoomsBtn.style.display = showBreakout ? 'inline-flex' : 'none';
    }
    
    const enableChat = state.settings?.enableChat !== false;
    if (dom.chatSidebar) {
        if (!enableChat) {
            dom.chatSidebar.style.display = 'none';
        } else {
            dom.chatSidebar.style.display = 'flex';
            // Keep chat hidden by default even if enabled, user must click toggle
            if (!dom.chatSidebar.classList.contains('hidden')) {
                dom.chatSidebar.classList.add('hidden');
            }
        }
    }
    if (dom.toggleChatBtn) {
        dom.toggleChatBtn.style.display = enableChat ? 'inline-flex' : 'none';
    }
    
    renderBreakoutRoomsList();
}

/**
 * Emit local media state to server
 */
function emitMediaState() {
    if (!state.socket) return;
    state.socket.emit('media-state', {
        isAudioOn: state.isAudioEnabled,
        isVideoOn: state.isVideoEnabled,
        currentRoom: state.roomId,
        mainRoomId: state.mainRoomId
    });
}

/**
 * Update host-only UI
 */
function updateHostUI() {
    const isHostOrCoHost = state.isHost || state.coHosts?.has?.(state.socket?.id);
    if (dom.hostPanelBtn) {
        dom.hostPanelBtn.style.display = isHostOrCoHost ? 'inline-flex' : 'none';
    }
}

/**
 * Grant host access
 */
function grantHostAccess(socketId) {
    if (!state.socket || !socketId) return;
    state.socket.emit('grant-host', { socketId });
}

/**
 * Revoke host access
 */
function revokeHostAccess(socketId) {
    if (!state.socket || !socketId) return;
    state.socket.emit('revoke-host', { socketId });
}

/**
 * Mute all participants
 */
function muteAllParticipants() {
    if (!confirm('Mute all participants?')) return;
    
    console.log('[Settings] Muting all participants');
    if (state.socket) {
        state.socket.emit('mute-all');
        showToast('Muted all participants', 'success');
    }
}

/**
 * Turn off all cameras
 */
function disableAllCameras() {
    if (!confirm('Turn off all cameras?')) return;
    
    console.log('[Settings] Disabling all cameras');
    if (state.socket) {
        state.socket.emit('disable-all-cameras');
        showToast('Disabled all cameras', 'success');
    }
}

/**
 * Ban a participant
 */
function banParticipant(socketId, userName) {
    if (!confirm(`Ban ${userName} from the meeting?`)) return;
    
    console.log('[Settings] Banning participant:', socketId);
    if (state.socket) {
        state.socket.emit('ban-participant', { socketId, userName });
        showToast(`${userName} has been banned`, 'info');
    }
}

/**
 * Update participants list in settings modal
 */
function updateParticipantsList() {
    const participantsList = document.getElementById('participantsList');
    if (!participantsList) return;
    
    participantsList.innerHTML = '';

    const participants = state.participantsState && state.participantsState.length
        ? state.participantsState
        : [{
            socketId: state.socket?.id,
            userName: `${state.userName} (You)`,
            isAudioOn: state.isAudioEnabled,
            isVideoOn: state.isVideoEnabled,
            currentRoom: state.roomId,
            isHost: state.isHost
        }];

    participants.forEach((p) => {
        const isSelf = p.socketId === state.socket?.id;
        const roomLabel = p.currentRoom === state.mainRoomId ? 'Main' : p.currentRoom;
        const hostBadge = p.isHost ? ' • Host' : (state.coHosts?.has?.(p.socketId) ? ' • Co‑host' : '');

        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <div class="participant-info">
                <div class="participant-name">${p.userName}${isSelf ? ' (You)' : ''}${hostBadge}</div>
                <div class="participant-status">
                    <span>${p.isAudioOn ? '🎤' : '🔇'}</span>
                    <span>${p.isVideoOn ? '📹' : '📷'}</span>
                    <span>📍 ${roomLabel}</span>
                </div>
            </div>
            <div class="participant-actions">
                ${(!isSelf && (state.isHost || state.coHosts?.has?.(state.socket?.id))) ? `
                    <button class="btn-ban" onclick="banParticipant('${p.socketId}', '${p.userName}')">
                        <i class="fas fa-ban"></i> Ban
                    </button>
                    <button class="btn-ban" onclick="grantHostAccess('${p.socketId}')">
                        <i class="fas fa-user-shield"></i> Grant Host
                    </button>
                ` : ''}
            </div>
        `;
        participantsList.appendChild(item);
    });
}

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - 'info', 'success', 'error'
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    dom.toastContainer.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/**
 * Copy room code to clipboard
 */
function shareRoomCode() {
    const code = state.roomId;
    const url = `${window.location.origin}?room=${code}`;

    console.log(`[Share] Copying meeting link: ${url}`);
    
    navigator.clipboard.writeText(url).then(() => {
        console.log('[Share] Meeting link copied to clipboard');
        showToast('Meeting link copied!', 'success');
    }).catch(error => {
        console.error('[Share Error] Copy failed:', error);
        showToast('Failed to copy', 'error');
    });
}

/**
 * Leave meeting
 */
function leaveMeeting() {
    console.log('[leaveMeeting] FUNCTION CALLED - LEAVE BUTTON PRESSED!!!');
    console.log('[Meeting] Leaving meeting...');
    
    // Stop all media
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        console.log('[Media] Stopped local media');
    }

    if (state.screenStream) {
        state.screenStream.getTracks().forEach(track => track.stop());
        console.log('[ScreenShare] Stopped screen share');
    }

    // Close all peer connections
    const connectionCount = state.peerConnections.size;
    for (const peerConnection of state.peerConnections.values()) {
        peerConnection.close();
    }
    state.peerConnections.clear();
    state.peers.clear();
    console.log(`[Meeting] Closed ${connectionCount} peer connections`);

    // Disconnect socket
    if (state.socket) {
        state.socket.disconnect();
        console.log('[Socket] Disconnected from server');
    }

    // Show join screen
    dom.conferenceContainer.classList.add('hidden');
    dom.joinModal.classList.remove('hidden');
    
    // Reset form
    dom.joinForm.reset();
    
    console.log('[Meeting] Back to join screen');
    showToast('Left meeting', 'info');
}

// ============ UTILITY FUNCTIONS ============

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Get room ID from URL or generate one
 * @returns {string} Room ID
 */
function getRoomIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || `room-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Set room ID in URL without reload
 * @param {string} roomId - Room ID
 */
function setRoomIdInUrl(roomId) {
    const url = `${window.location.origin}?room=${roomId}`;
    window.history.replaceState({}, '', url);
}

// ============ EVENT LISTENERS ============

/**
 * Initialize join form with user data
 */
function initializeJoinForm() {
    const userName = localStorage.getItem('userName');
    if (userName && dom.userName) {
        dom.userName.value = userName;
    }
    
    // Generate a default room ID if not provided
    const urlParams = new URLSearchParams(window.location.search);
    const roomCodeParam = urlParams.get('room');
    if (roomCodeParam && dom.roomId) {
        dom.roomId.value = roomCodeParam;
    }
}

/**
 * Join room form submission
 */
dom.joinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        let userName = dom.userName.value.trim();
        let roomId = dom.roomId.value.trim();

        if (!userName) {
            showToast('Please enter your name', 'error');
            return;
        }

        // If no room ID provided, generate one
        if (!roomId) {
            roomId = `room-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            dom.roomId.value = roomId;
        }

        console.log('[Join] Attempting to join room...');

        // Store state
        state.userName = userName;
        state.roomId = roomId;
        state.mainRoomId = roomId;
        state.userId = `user-${Math.random().toString(36).substr(2, 9)}`;

        // Hide join modal, show conference
        console.log('[Join] Hiding join modal...');
        dom.joinModal.classList.add('hidden');
        dom.joinModal.classList.remove('active');
        console.log('[Join] Join modal classes:', dom.joinModal.className);
        
        console.log('[Join] Showing conference container...');
        dom.conferenceContainer.classList.remove('hidden');
        console.log('[Join] Conference container classes:', dom.conferenceContainer.className);
        
        // Ensure breakout modal is hidden
        const breakoutModal = document.getElementById('breakoutModal');
        if (breakoutModal) {
            breakoutModal.classList.add('hidden');
            console.log('[Join] Breakout modal classes:', breakoutModal.className);
        }

        // Update UI
        dom.roomBadge.textContent = `Room: ${roomId}`;
        setRoomIdInUrl(roomId);
        
        // Reinitialize button listeners after showing conference container
        console.log('[Join] Reinitializing button listeners...');
        initializeButtonListeners();

        // Initialize socket first and wait for connection
        console.log('[Socket] Initializing...');
        initializeSocket();

        // Wait for socket to connect and get its ID
        console.log('[Socket] Waiting for connection...');
        let attempts = 0;
        while (!state.socket?.id && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!state.socket?.id) {
            console.error('[Socket] Failed to connect');
            showToast('Failed to connect to server', 'error');
            leaveMeeting();
            return;
        }
        
        console.log('[Socket] Connected with ID:', state.socket.id);

        // Initialize media
        console.log('[Media] Requesting camera/mic...');
        const mediaOk = await initializeLocalMedia();
        if (!mediaOk) {
            console.error('[Error] Failed to initialize media');
            leaveMeeting();
            return;
        }

        emitMediaState();

        console.log('[Socket] Emitting join-room event');
        // Join room
        state.socket.emit('join-room', {
            roomId: roomId,
            userName: userName,
            userId: state.userId
        });

        showToast(`Joined as ${userName}`, 'success');
    } catch (error) {
        console.error('[Join Error]', error);
        showToast(`Error joining meeting: ${error.message}`, 'error');
        leaveMeeting();
    }
});

// ============ CONTROL BUTTON LISTENERS ============
// Initialize all button listeners with robust error handling and logging
function initializeButtonListeners() {
    console.log('[Buttons] Initializing button listeners...');
    
    // Helper to safely add event listener
    const addButtonListener = (id, handler, name) => {
        const element = document.getElementById(id);
        if (element) {
            // Remove existing listener if any
            const newHandler = function(e) {
                console.log(`[Button Click] ${name} button clicked!`);
                console.log(`[Button State] localStream exists: ${!!state.localStream}`);
                console.log(`[Button State] isAudioEnabled: ${state.isAudioEnabled}, isVideoEnabled: ${state.isVideoEnabled}`);
                e.stopPropagation();
                try {
                    handler(e);
                } catch (error) {
                    console.error(`[Button Error] ${name} failed:`, error);
                    showToast(`Error: ${name} failed`, 'error');
                }
            };
            
            // Store handler reference for potential cleanup
            element._clickHandler = newHandler;
            element.removeEventListener('click', element._clickHandler);
            element.addEventListener('click', newHandler);
            
            console.log(`[Buttons] ✓ ${name} listener attached to ${id}`);
            return true;
        } else {
            console.warn(`[Buttons] ✗ ${name} button not found (${id})`);
            return false;
        }
    };

    // Control bar buttons
    addButtonListener('toggleAudioBtn', toggleAudio, 'Audio Toggle');
    addButtonListener('toggleVideoBtn', toggleVideo, 'Video Toggle');
    addButtonListener('toggleScreenShareBtn', toggleScreenShare, 'Screen Share');
    addButtonListener('toggleChatBtn', toggleChat, 'Chat Toggle');
    addButtonListener('hostPanelBtn', openSettings, 'Host Panel');
    addButtonListener('settingsBtn', openSettings, 'Settings');
    addButtonListener('hangUpBtn', leaveMeeting, 'Hang Up');
    addButtonListener('shareCodeBtn', shareRoomCode, 'Share Code');
    addButtonListener('closeChatBtn', toggleChat, 'Close Chat');
    addButtonListener('closeSettingsBtn', closeSettings, 'Close Settings');
    addButtonListener('returnMainBtn', returnToMainMeeting, 'Return Main');
    addButtonListener('pinScreenBtn', togglePinScreen, 'Pin Screen');
    addButtonListener('fullscreenScreenBtn', toggleScreenFullscreen, 'Fullscreen Screen');
    
    addButtonListener('breakoutRoomsBtn', () => {
        console.log('[Breakout] Opening breakout rooms modal');
        const modal = document.getElementById('breakoutModal');
        if (modal) modal.classList.remove('hidden');
        renderBreakoutRoomsList();
    }, 'Breakout Rooms');
    
    addButtonListener('closeBreakoutBtn', () => {
        console.log('[Breakout] Closing breakout rooms modal');
        const modal = document.getElementById('breakoutModal');
        if (modal) modal.classList.add('hidden');
    }, 'Close Breakout');

    addButtonListener('createRoomBtn', () => {
        const count = document.getElementById('breakoutCount')?.value;
        createBreakoutRooms(count);
    }, 'Create Rooms');

    // Chat form submit
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.removeEventListener('submit', chatForm._submitHandler);
        chatForm._submitHandler = (e) => {
            e.preventDefault();
            console.log('[Chat] Form submitted');
            const input = document.getElementById('chatInput');
            const message = input?.value.trim();
            if (message) {
                sendChatMessage(message);
            }
        };
        chatForm.addEventListener('submit', chatForm._submitHandler);
        console.log('[Buttons] ✓ Chat form listener attached');
    }

    console.log('[Buttons] All button listeners initialized!');
    updateHostUI();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'm':
                e.preventDefault();
                toggleAudio();
                break;
            case 'v':
                e.preventDefault();
                toggleVideo();
                break;
        }
    }
});

// Try to load room from URL
window.addEventListener('load', () => {
    // Initialize join form with user data
    initializeJoinForm();
    
    const roomFromUrl = getRoomIdFromUrl();
    if (roomFromUrl && roomFromUrl !== 'room-undefined') {
        dom.roomId.value = roomFromUrl;
    }
    
    // Initialize button listeners when DOM is ready
    console.log('[Init] DOM loaded, initializing buttons...');
    initializeButtonListeners();

    // Load settings from localStorage
    const storedSettings = localStorage.getItem('conferenceSettings');
    if (storedSettings) {
        try {
            state.settings = { ...state.settings, ...JSON.parse(storedSettings) };
        } catch (e) {
            console.warn('[Settings] Failed to parse stored settings');
        }
    }
    applySettingsVisibility();
});

console.log('✓ WebRTC Conference App loaded');
