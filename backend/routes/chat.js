const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole } = require('../middleware/auth');

// Chat message types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice',
  FILE: 'file',
  SYSTEM: 'system'
};

// Check if users can chat based on their roles
async function checkChatPermissions(currentUserRole, participantRole, currentUserId, participantId) {
  // Don't allow users to chat with themselves
  if (currentUserId === participantId) {
    return {
      allowed: false,
      reason: 'Cannot start a conversation with yourself'
    };
  }

  // Define allowed chat combinations
  const allowedCombinations = [
    // Customers can chat with providers
    { current: 'customer', participant: 'provider' },
    { current: 'customer', participant: 'service_provider' },
    
    // Providers can chat with customers
    { current: 'provider', participant: 'customer' },
    { current: 'service_provider', participant: 'customer' },
    
    // Job seekers can chat with freelancers and vice versa
    { current: 'job_seeker', participant: 'freelancer' },
    { current: 'freelancer', participant: 'job_seeker' },
    
    // Admins can chat with anyone
    { current: 'admin', participant: '*' },
    { current: '*', participant: 'admin' }
  ];

  // Check if the combination is allowed
  const isAllowed = allowedCombinations.some(combo => {
    return (combo.current === currentUserRole || combo.current === '*') &&
           (combo.participant === participantRole || combo.participant === '*');
  });

  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Users with role '${currentUserRole}' cannot chat with users with role '${participantRole}'`
    };
  }

  return {
    allowed: true,
    reason: 'Chat allowed'
  };
}

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

    // Get current user details to check their role
    const currentUser = await firebaseHelpers.getDocument('users', currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        error: 'Current user not found',
        message: 'Your user profile does not exist'
      });
    }

    const currentUserRole = currentUser.role;

    // Get participant details to check their role
    const participant = await firebaseHelpers.getDocument('users', participantId);
    if (!participant) {
      return res.status(404).json({
        error: 'Participant not found',
        message: 'The user you want to chat with does not exist'
      });
    }

    const participantRole = participant.role;

    // Check role-based permissions
    const canChat = await checkChatPermissions(currentUserRole, participantRole, currentUserId, participantId);
    if (!canChat.allowed) {
      return res.status(403).json({
        error: 'Chat not allowed',
        message: canChat.reason
      });
    }

    // Create room ID (sorted to ensure consistency)
    const participants = [currentUserId, participantId].sort();
    const roomId = `room_${participants.join('_')}`;
    
    console.log('Creating chat room:', {
      currentUserId,
      participantId,
      participants,
      roomId
    });

    // Check if room already exists
    const existingRoom = await firebaseHelpers.getDocument('chat_rooms', roomId);
    
    if (existingRoom) {
      return res.json({
        success: true,
        data: {
          id: roomId,
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
      },
      // Add role information for permission tracking
      roles: {
        [currentUserId]: currentUserRole,
        [participantId]: participantRole
      }
    };

    await firebaseHelpers.createDocument('chat_rooms', roomData, roomId);

    res.status(201).json({
      success: true,
      data: {
        id: roomId,
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

// Helper function to check chat permissions
async function checkChatPermissions(currentUserRole, participantRole, currentUserId, participantId) {
  // Admin can chat with anyone
  if (currentUserRole === 'admin') {
    return { allowed: true };
  }

  // Customer can only chat with service providers
  if (currentUserRole === 'customer') {
    if (['event_company', 'caterer', 'transport', 'photographer'].includes(participantRole)) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Customers can only chat with service providers' 
    };
  }

  // Service providers can chat with customers, job seekers and freelancers
  if (['event_company', 'caterer', 'transport', 'photographer'].includes(currentUserRole)) {
    if (['customer', 'job_seeker', 'freelancer'].includes(participantRole)) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Service providers can only chat with customers, job seekers and freelancers' 
    };
  }

  // Job seekers and freelancers can only reply to service providers
  if (['job_seeker', 'freelancer'].includes(currentUserRole)) {
    if (['event_company', 'caterer', 'transport', 'photographer'].includes(participantRole)) {
      // Check if the service provider initiated the conversation
      return await checkIfCanReply(currentUserId, participantId);
    }
    return { 
      allowed: false, 
      reason: 'You can only chat with service providers who have contacted you first' 
    };
  }

  return { 
    allowed: false, 
    reason: 'Chat not allowed between these user types' 
  };
}

// Helper function to check if user can reply (for job seekers/freelancers)
async function checkIfCanReply(currentUserId, participantId) {
  try {
    // Check if there's an existing room where the participant initiated
    const rooms = await firebaseHelpers.getChatRooms(currentUserId, {
      createdBy: participantId
    });

    if (rooms && rooms.length > 0) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: 'You can only reply to messages from service providers who have contacted you first' 
    };
  } catch (error) {
    console.error('Error checking reply permissions:', error);
    return { 
      allowed: false, 
      reason: 'Unable to verify chat permissions' 
    };
  }
}

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
    console.log('Checking room access:', {
      roomId,
      senderId,
      roomExists: !!room,
      roomParticipants: room?.participants,
      isParticipant: room?.participants?.includes(senderId)
    });
    
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
    console.log('Checking room access for messages:', {
      roomId,
      userId,
      roomExists: !!room,
      roomParticipants: room?.participants,
      isParticipant: room?.participants?.includes(userId)
    });
    
    if (!room || !room.participants.includes(userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a participant in this room'
      });
    }

    // Get messages with pagination
    const messages = await firebaseHelpers.getChatMessages(roomId, {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Mark messages as read
    const updatedUnreadCount = { ...room.unreadCount };
    updatedUnreadCount[userId] = 0;
    await firebaseHelpers.updateDocument('chat_rooms', roomId, {
      unreadCount: updatedUnreadCount
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
    const rooms = await firebaseHelpers.getChatRooms(userId, {
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

    // Get the room first to access current unreadCount
    const room = await firebaseHelpers.getDocument('chat_rooms', roomId);
    if (!room || !room.participants.includes(userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a participant in this room'
      });
    }

    // Update unread count
    const updatedUnreadCount = { ...room.unreadCount };
    updatedUnreadCount[userId] = 0;
    await firebaseHelpers.updateDocument('chat_rooms', roomId, {
      unreadCount: updatedUnreadCount
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

// Get available chat partners based on user role
router.get('/available-partners', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const currentUserRole = req.user.role;

    let availablePartners = [];

    if (currentUserRole === 'admin') {
      // Admin can chat with anyone
      const allUsers = await firebaseHelpers.getCollection('users');
      availablePartners = allUsers
        .filter(user => user.uid !== currentUserId)
        .map(user => ({
          id: user.uid,
          name: user.name || user.email,
          email: user.email,
          role: user.role,
          picture: user.picture || null
        }));
    } else if (currentUserRole === 'customer') {
      // Customer can only chat with service providers
      const serviceProviders = await firebaseHelpers.getCollection('users', {
        where: [['role', 'in', ['event_company', 'caterer', 'transport', 'photographer']]]
      });
      availablePartners = serviceProviders.map(provider => ({
        id: provider.uid,
        name: provider.businessName || provider.name || provider.email,
        email: provider.email,
        role: provider.role,
        picture: provider.picture || null,
        businessName: provider.businessName
      }));
    } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(currentUserRole)) {
      // Service providers can chat with customers, job seekers and freelancers
      const customersAndPartners = await firebaseHelpers.getCollection('users', {
        where: [['role', 'in', ['customer', 'jobseeker', 'freelancer']]]
      });
      availablePartners = customersAndPartners.map(user => ({
        id: user.uid,
        name: user.name || user.email,
        email: user.email,
        role: user.role,
        picture: user.picture || null,
        businessName: user.businessName
      }));
    } else if (['jobseeker', 'freelancer'].includes(currentUserRole)) {
      // Job seekers and freelancers can only see service providers who have contacted them
      const existingRooms = await firebaseHelpers.getChatRooms(currentUserId, {
        createdByNot: currentUserId // Rooms created by others
      });

      const contactedByProviders = new Set();
      existingRooms.forEach(room => {
        const otherParticipants = room.participants.filter(id => id !== currentUserId);
        otherParticipants.forEach(participantId => {
          contactedByProviders.add(participantId);
        });
      });

      // Get details of providers who have contacted this user
      const providerDetails = await Promise.all(
        Array.from(contactedByProviders).map(async (providerId) => {
          const provider = await firebaseHelpers.getDocument('users', providerId);
          return provider ? {
            id: provider.uid,
            name: provider.businessName || provider.name || provider.email,
            email: provider.email,
            role: provider.role,
            picture: provider.picture || null,
            businessName: provider.businessName
          } : null;
        })
      );

      availablePartners = providerDetails.filter(provider => provider !== null);
    }

    res.json({
      success: true,
      data: availablePartners
    });
  } catch (error) {
    console.error('Error getting available partners:', error);
    res.status(500).json({
      error: 'Failed to get available partners',
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
