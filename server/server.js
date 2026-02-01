/**
 * WebRTC Video Conference Server
 * Handles Socket.IO signaling for WebRTC peer connections
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Store active rooms and their users
const rooms = new Map();
// Store participant state across breakouts
const participants = new Map();

function broadcastParticipants(mainRoomId) {
  if (!mainRoomId) return;
  const list = [];
  participants.forEach((p) => {
    if (p.mainRoomId === mainRoomId) {
      list.push({
        socketId: p.socketId,
        userName: p.userName,
        isAudioOn: p.isAudioOn,
        isVideoOn: p.isVideoOn,
        currentRoom: p.currentRoom,
        isHost: p.isHost
      });
    }
  });

  io.sockets.sockets.forEach((s) => {
    if (s.mainRoom === mainRoomId) {
      s.emit('participants-state', { participants: list });
    }
  });
}

/**
 * Get or create a room
 * @param {string} roomId - The room ID
 * @returns {Object} Room object with users array
 */
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      users: new Map(),
      createdAt: Date.now(),
      settings: {
        joinMuted: false,
        showBreakoutRooms: true
      }
    });
  }
  return rooms.get(roomId);
}

/**
 * Socket.IO connection handler
 */
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  /**
   * User joins a room
   * Event data: { roomId, userName, userId }
   */
  socket.on('join-room', (data) => {
    const { roomId, userName, userId } = data;
    console.log(`[Join] ${userName} (${userId}) joining room: ${roomId}`);

    // Get or create the room
    const room = getOrCreateRoom(roomId);

    // Add user to room
    room.users.set(socket.id, {
      socketId: socket.id,
      userId: userId,
      userName: userName,
      joinedAt: Date.now()
    });

    // Assign host if none
    if (!room.hostId) {
      room.hostId = socket.id;
      room.cohosts = new Set();
    }

    // Join socket to room
    socket.join(roomId);
    socket.currentRoom = roomId;
    socket.mainRoom = roomId;
    socket.userName = userName;
    socket.userId = userId;

    // Notify existing users that a new user joined
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId: userId,
      userName: userName,
      existingUsers: Array.from(room.users.values()).filter(u => u.socketId !== socket.id)
    });

    // Send existing users to the new user
    socket.emit('existing-users', {
      users: Array.from(room.users.values()).filter(u => u.socketId !== socket.id)
    });

    // Send room settings to the new user
    socket.emit('room-settings', {
      settings: room.settings
    });

    // Track participant state
    participants.set(socket.id, {
      socketId: socket.id,
      userName,
      mainRoomId: roomId,
      currentRoom: roomId,
      isAudioOn: true,
      isVideoOn: true,
      isHost: room.hostId === socket.id
    });

    // Send host status to this user
    socket.emit('host-status', { isHost: room.hostId === socket.id });

    // Send cohost list to all
    io.to(roomId).emit('host-list', { coHosts: Array.from(room.cohosts || []) });

    // Broadcast participants state
    broadcastParticipants(roomId);

    // Log room status
    console.log(`[Room] ${roomId} now has ${room.users.size} users`);
  });

  /**
   * WebRTC offer from one peer to another
   * Event data: { to, from, offer }
   */
  socket.on('offer', (data) => {
    const { to, offer } = data;
    console.log(`[Offer] ${socket.id} -> ${to}`);
    io.to(to).emit('offer', {
      from: socket.id,
      userName: socket.userName,
      offer: offer
    });
  });

  /**
   * WebRTC answer from one peer to another
   * Event data: { to, from, answer }
   */
  socket.on('answer', (data) => {
    const { to, answer } = data;
    console.log(`[Answer] ${socket.id} -> ${to}`);
    io.to(to).emit('answer', {
      from: socket.id,
      userName: socket.userName,
      answer: answer
    });
  });

  /**
   * ICE candidate exchange for NAT traversal
   * Event data: { to, candidate }
   */
  socket.on('ice-candidate', (data) => {
    const { to, candidate } = data;
    io.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate: candidate
    });
  });

  /**
   * Chat message from user
   * Event data: { message, timestamp }
   */
  socket.on('chat-message', (data) => {
    const { message } = data;
    console.log(`[Chat] ${socket.userName}: ${message}`);
    
    io.to(socket.currentRoom).emit('chat-message', {
      userName: socket.userName,
      userId: socket.userId,
      message: message,
      timestamp: Date.now(),
      fromMe: false
    });
  });

  /**
   * Screen share started
   * Event data: { screenStream }
   */
  socket.on('screen-share-start', (data) => {
    console.log(`[ScreenShare] ${socket.userName} started screen share`);
    socket.to(socket.currentRoom).emit('screen-share-started', {
      userId: socket.userId,
      userName: socket.userName,
      socketId: socket.id
    });
  });

  /**
   * Screen share stopped
   */
  socket.on('screen-share-stop', (data) => {
    console.log(`[ScreenShare] ${socket.userName} stopped screen share`);
    socket.to(socket.currentRoom).emit('screen-share-stopped', {
      userId: socket.userId,
      userName: socket.userName,
      socketId: socket.id
    });
  });

  /**
   * Switch to different room (breakout rooms feature)
   * Event data: { newRoomId }
   */
  socket.on('switch-room', (data) => {
    const { newRoomId } = data;
    const currentRoomId = socket.currentRoom;

    console.log(`[Switch] ${socket.userName} switching from ${currentRoomId} to ${newRoomId}`);

    // Remove user from current room
    const currentRoom = rooms.get(currentRoomId);
    if (currentRoom) {
      currentRoom.users.delete(socket.id);
      socket.to(currentRoomId).emit('user-left', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName
      });

      // Delete room if empty
      if (currentRoom.users.size === 0) {
        rooms.delete(currentRoomId);
        console.log(`[Room] Deleted empty room: ${currentRoomId}`);
      }
    }

    // Leave current socket room
    socket.leave(currentRoomId);

    // Add user to new room
    const newRoom = getOrCreateRoom(newRoomId);
    newRoom.users.set(socket.id, {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      joinedAt: Date.now()
    });

    // Join socket to new room
    socket.join(newRoomId);
    socket.currentRoom = newRoomId;

    // Update participant state
    const participant = participants.get(socket.id);
    if (participant) {
      participant.currentRoom = newRoomId;
    }

    // Notify existing users in new room
    socket.to(newRoomId).emit('user-joined', {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      existingUsers: Array.from(newRoom.users.values()).filter(u => u.socketId !== socket.id)
    });

    // Send existing users in new room to the user
    socket.emit('existing-users', {
      users: Array.from(newRoom.users.values()).filter(u => u.socketId !== socket.id)
    });

    console.log(`[Room] ${newRoomId} now has ${newRoom.users.size} users`);

    // Broadcast participants state
    broadcastParticipants(socket.mainRoom);
  });

  /**
   * Media state updates
   */
  socket.on('media-state', (data) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isAudioOn = !!data?.isAudioOn;
      participant.isVideoOn = !!data?.isVideoOn;
      participant.currentRoom = data?.currentRoom || participant.currentRoom;
    }
    broadcastParticipants(socket.mainRoom);
  });

  /**
   * Grant host access
   */
  socket.on('grant-host', ({ socketId }) => {
    const room = rooms.get(socket.mainRoom);
    if (!room) return;
    const isHostOrCohost = room.hostId === socket.id || room.cohosts?.has(socket.id);
    if (!isHostOrCohost) return;

    room.cohosts.add(socketId);
    io.to(socketId).emit('host-status', { isHost: true });
    io.to(socket.mainRoom).emit('host-list', { coHosts: Array.from(room.cohosts) });
    const p = participants.get(socketId);
    if (p) p.isHost = true;
    broadcastParticipants(socket.mainRoom);
  });

  /**
   * Revoke host access
   */
  socket.on('revoke-host', ({ socketId }) => {
    const room = rooms.get(socket.mainRoom);
    if (!room) return;
    const isHostOrCohost = room.hostId === socket.id || room.cohosts?.has(socket.id);
    if (!isHostOrCohost) return;

    room.cohosts.delete(socketId);
    io.to(socketId).emit('host-status', { isHost: false });
    io.to(socket.mainRoom).emit('host-list', { coHosts: Array.from(room.cohosts) });
    const p = participants.get(socketId);
    if (p) p.isHost = false;
    broadcastParticipants(socket.mainRoom);
  });

  /**
   * Close all breakout rooms and return users to main
   */
  socket.on('close-breakouts', (data) => {
    const mainRoomId = data?.mainRoomId || socket.mainRoom;
    if (!mainRoomId) return;

    console.log(`[Breakout] Closing breakout rooms for main: ${mainRoomId}`);

    io.sockets.sockets.forEach((s) => {
      if (s.mainRoom === mainRoomId && s.currentRoom !== mainRoomId) {
        s.emit('return-to-main', { mainRoomId });
      }
    });
  });

  /**
   * User disconnects
   */
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);

    if (socket.currentRoom) {
      const room = rooms.get(socket.currentRoom);
      if (room) {
        room.users.delete(socket.id);
        
        // Notify other users
        io.to(socket.currentRoom).emit('user-left', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName
        });

        // Delete room if empty
        if (room.users.size === 0) {
          rooms.delete(socket.currentRoom);
          console.log(`[Room] Deleted empty room: ${socket.currentRoom}`);
        }

        console.log(`[Room] ${socket.currentRoom} now has ${room.users.size} users`);
      }
    }

    participants.delete(socket.id);
    broadcastParticipants(socket.mainRoom);
  });

  /**
   * Get room status (for debugging)
   */
  socket.on('get-room-status', () => {
    const roomsStatus = {};
    rooms.forEach((room, roomId) => {
      roomsStatus[roomId] = {
        users: room.users.size,
        createdAt: room.createdAt
      };
    });
    socket.emit('room-status', roomsStatus);
  });

  /**
   * Mute all participants in room
   */
  socket.on('mute-all', () => {
    console.log(`[Host] ${socket.userName} muting all participants`);
    socket.to(socket.currentRoom).emit('force-mute');
  });

  /**
   * Disable all cameras in room
   */
  socket.on('disable-all-cameras', () => {
    console.log(`[Host] ${socket.userName} disabling all cameras`);
    socket.to(socket.currentRoom).emit('force-disable-camera');
  });

  /**
   * Breakout rooms list update
   */
  socket.on('breakout-rooms-update', (data) => {
    const mainRoomId = data?.mainRoomId || socket.mainRoom;
    if (!mainRoomId) return;

    io.sockets.sockets.forEach((s) => {
      if (s.mainRoom === mainRoomId) {
        s.emit('breakout-rooms-updated', {
          rooms: data?.rooms || [],
          mainRoomId
        });
      }
    });
  });

  /**
   * Ban a participant
   */
  socket.on('ban-participant', (data) => {
    const { socketId, userName } = data;
    console.log(`[Ban] ${socket.userName} banning ${userName} (${socketId})`);
    
    // Force disconnect the banned user
    io.to(socketId).emit('banned', {
      message: 'You have been removed from the meeting by the host'
    });
    
    // Forcefully disconnect them
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.disconnect(true);
    }

    participants.delete(socketId);
    broadcastParticipants(socket.mainRoom);
    
    // Notify others
    socket.to(socket.currentRoom).emit('user-left', {
      socketId: socketId,
      userName: userName,
      reason: 'banned'
    });
  });

  /**
   * Update room settings
   */
  socket.on('update-settings', (settings) => {
    console.log(`[Settings] ${socket.userName} updated settings:`, settings);
    const room = rooms.get(socket.currentRoom);
    if (room) {
      room.settings = { ...room.settings, ...settings };
    }
    // Broadcast settings to all users in room
    io.to(socket.currentRoom).emit('settings-updated', {
      settings: room?.settings || settings,
      by: socket.userName
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎥 WebRTC Video Conference Server running on http://localhost:${PORT}\n`);
  console.log('To join a meeting, visit:');
  console.log(`  http://localhost:${PORT}?room=room-code`);
  console.log('\nMeeting controls:');
  console.log('  • Share meeting code: http://localhost:3000?room=your-code');
  console.log('  • Toggle video: Click camera icon or press V');
  console.log('  • Toggle audio: Click microphone icon or press M');
  console.log('  • Share screen: Click share icon');
  console.log('  • Send message: Type in chat box\n');
});
