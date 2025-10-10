const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Chat message types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice',
  FILE: 'file',
  SYSTEM: 'system'
};

// Create or get chat room
router.post('/room', verifyToken, async (req, res) => {
  try {
    const { participantId, type = 'direct' } = req.body;
    const currentUserId = req.user.uid;

    if (!participantId) {
      return res.status(400).json({
        error: 'Missing participant',
        message: 'Participant ID is required'
      });
    }

    // Create room ID (sorted to ensure consistency)
    const participants = [currentUserId, participantId].sort();
    const roomId = `room_${participants.join('_')}`;

    // Check if room already exists
    const existingRoom = await firebaseHelpers.getDocument('chat_rooms', roomId);
    
    if (existingRoom) {
      return res.json({
        success: true,
        data: {
          roomId,
          participants: existingRoom.participants,
          createdAt: existingRoom.createdAt,
          lastMessage: existingRoom.lastMessage
        }
      });
    }

    // Create new room
    const roomData = {
      roomId,
      type,
      participants,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      unreadCount: {
        [currentUserId]: 0,
        [participantId]: 0
      }
    };

    await firebaseHelpers.createDocument('chat_rooms', roomData, roomId);

    res.status(201).json({
      success: true,
      data: {
        roomId,
        participants: roomData.participants,
        createdAt: roomData.createdAt,
        lastMessage: null
      }
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({
      error: 'Failed to create chat room',
      message: error.message
    });
  }
});

// Send message
router.post('/message', verifyToken, async (req, res) => {
  try {
    const { roomId, content, type = MESSAGE_TYPES.TEXT, mediaUrl, metadata } = req.body;
    const senderId = req.user.uid;
    const senderName = req.user.name;

    if (!roomId || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Room ID and content are required'
      });
    }

    // Verify user is participant in room
    const room = await firebaseHelpers.getDocument('chat_rooms', roomId);
    if (!room || !room.participants.includes(senderId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a participant in this room'
      });
    }

    const messageData = {
      roomId,
      senderId,
      senderName,
      content,
      type,
      mediaUrl: mediaUrl || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      readBy: [senderId],
      delivered: true
    };

    // Save message
    const messageId = await firebaseHelpers.createDocument('chat_messages', messageData);

    // Update room with last message
    const lastMessage = {
      content: type === MESSAGE_TYPES.TEXT ? content : `[${type.toUpperCase()}]`,
      senderName,
      timestamp: messageData.timestamp
    };

    await firebaseHelpers.updateDocument('chat_rooms', roomId, {
      lastMessage,
      updatedAt: new Date().toISOString()
    });

    // Increment unread count for other participants
    const otherParticipants = room.participants.filter(id => id !== senderId);
    const unreadCount = { ...room.unreadCount };
    otherParticipants.forEach(participantId => {
      unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
    });

    await firebaseHelpers.updateDocument('chat_rooms', roomId, { unreadCount });

    // Emit real-time message via Socket.IO
    const io = req.app.get('io');
    if (io) {
      otherParticipants.forEach(participantId => {
        io.to(`user-${participantId}`).emit('new_message', {
          roomId,
          message: { ...messageData, id: messageId }
        });
      });
    }

    res.status(201).json({
      success: true,
      data: {
        messageId,
        message: { ...messageData, id: messageId }
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// Get chat history
router.get('/room/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.uid;

    // Verify user is participant
    const room = await firebaseHelpers.getDocument('chat_rooms', roomId);
    if (!room || !room.participants.includes(userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a participant in this room'
      });
    }

    // Get messages with pagination
    const messages = await firebaseHelpers.getCollection('chat_messages', {
      where: [['roomId', '==', roomId]],
      orderBy: [['timestamp', 'desc']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Mark messages as read
    await firebaseHelpers.updateDocument('chat_rooms', roomId, {
      [`unreadCount.${userId}`]: 0
    });

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      error: 'Failed to get messages',
      message: error.message
    });
  }
});

// Get user's chat rooms
router.get('/rooms', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { page = 1, limit = 20 } = req.query;

    // Get rooms where user is participant
    const rooms = await firebaseHelpers.getCollection('chat_rooms', {
      where: [['participants', 'array-contains', userId]],
      orderBy: [['updatedAt', 'desc']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Get participant details for each room
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const otherParticipants = room.participants.filter(id => id !== userId);
        const participantDetails = await Promise.all(
          otherParticipants.map(async (participantId) => {
            const user = await firebaseHelpers.getDocument('users', participantId);
            return {
              id: participantId,
              name: user?.name || 'Unknown',
              picture: user?.picture || null,
              role: user?.role || 'unknown'
            };
          })
        );

        return {
          ...room,
          participants: participantDetails,
          unreadCount: room.unreadCount[userId] || 0
        };
      })
    );

    res.json({
      success: true,
      data: roomsWithDetails
    });
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({
      error: 'Failed to get chat rooms',
      message: error.message
    });
  }
});

// Mark messages as read
router.patch('/room/:roomId/read', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.uid;

    // Update unread count
    await firebaseHelpers.updateDocument('chat_rooms', roomId, {
      [`unreadCount.${userId}`]: 0
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      error: 'Failed to mark messages as read',
      message: error.message
    });
  }
});

// Upload media for chat
router.post('/upload-media', verifyToken, async (req, res) => {
  try {
    // This would integrate with your existing file upload system
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        mediaUrl: 'https://via.placeholder.com/300x200',
        type: 'image'
      }
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({
      error: 'Failed to upload media',
      message: error.message
    });
  }
});

// Get online users
router.get('/online-users', verifyToken, async (req, res) => {
  try {
    const io = req.app.get('io');
    if (!io) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get connected sockets
    const connectedSockets = await io.fetchSockets();
    const onlineUserIds = connectedSockets.map(socket => socket.userId).filter(Boolean);

    // Get user details for online users
    const onlineUsers = await Promise.all(
      onlineUserIds.map(async (userId) => {
        const user = await firebaseHelpers.getDocument('users', userId);
        return {
          id: userId,
          name: user?.name || 'Unknown',
          picture: user?.picture || null,
          role: user?.role || 'unknown',
          lastSeen: new Date().toISOString()
        };
      })
    );

    res.json({
      success: true,
      data: onlineUsers
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      error: 'Failed to get online users',
      message: error.message
    });
  }
});

module.exports = router;
