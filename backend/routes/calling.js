const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Call statuses
const CALL_STATUS = {
  INITIATED: 'initiated',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected',
  MISSED: 'missed'
};

// Call types
const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
};

// Initiate a call
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const { recipientId, type = CALL_TYPES.AUDIO } = req.body;
    const callerId = req.user.uid;
    const callerName = req.user.name;

    if (!recipientId) {
      return res.status(400).json({
        error: 'Missing recipient',
        message: 'Recipient ID is required'
      });
    }

    if (recipientId === callerId) {
      return res.status(400).json({
        error: 'Invalid recipient',
        message: 'Cannot call yourself'
      });
    }

    // Generate unique call ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const callData = {
      callId,
      callerId,
      callerName,
      recipientId,
      type,
      status: CALL_STATUS.INITIATED,
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      duration: 0,
      metadata: {
        callerDevice: req.headers['user-agent'] || 'Unknown',
        callerIP: req.ip
      }
    };

    // Save call record
    await firebaseHelpers.createDocument('calls', callData, callId);

    // Send call notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${recipientId}`).emit('incoming_call', {
        callId,
        callerId,
        callerName,
        type,
        timestamp: callData.createdAt
      });
    }

    // Create notification
    await firebaseHelpers.createDocument('notifications', {
      userId: recipientId,
      title: 'Incoming Call',
      message: `${callerName} is calling you`,
      type: 'call',
      relatedId: callId,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: {
        callId,
        status: CALL_STATUS.INITIATED,
        type
      }
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      error: 'Failed to initiate call',
      message: error.message
    });
  }
});

// Accept a call
router.post('/accept/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.uid;

    // Get call details
    const call = await firebaseHelpers.getDocument('calls', callId);
    if (!call) {
      return res.status(404).json({
        error: 'Call not found',
        message: 'Call does not exist or has expired'
      });
    }

    if (call.recipientId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not the recipient of this call'
      });
    }

    if (call.status !== CALL_STATUS.INITIATED && call.status !== CALL_STATUS.RINGING) {
      return res.status(400).json({
        error: 'Invalid call state',
        message: 'Call cannot be accepted in current state'
      });
    }

    // Update call status
    await firebaseHelpers.updateDocument('calls', callId, {
      status: CALL_STATUS.CONNECTED,
      startedAt: new Date().toISOString()
    });

    // Notify caller that call was accepted
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${call.callerId}`).emit('call_accepted', {
        callId,
        recipientId: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        callId,
        status: CALL_STATUS.CONNECTED,
        startedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error accepting call:', error);
    res.status(500).json({
      error: 'Failed to accept call',
      message: error.message
    });
  }
});

// Reject a call
router.post('/reject/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body;
    const userId = req.user.uid;

    // Get call details
    const call = await firebaseHelpers.getDocument('calls', callId);
    if (!call) {
      return res.status(404).json({
        error: 'Call not found',
        message: 'Call does not exist or has expired'
      });
    }

    if (call.recipientId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not the recipient of this call'
      });
    }

    // Update call status
    await firebaseHelpers.updateDocument('calls', callId, {
      status: CALL_STATUS.REJECTED,
      endedAt: new Date().toISOString(),
      metadata: {
        ...call.metadata,
        rejectionReason: reason || 'Call rejected'
      }
    });

    // Notify caller that call was rejected
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${call.callerId}`).emit('call_rejected', {
        callId,
        recipientId: userId,
        reason: reason || 'Call rejected',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        callId,
        status: CALL_STATUS.REJECTED,
        reason: reason || 'Call rejected'
      }
    });
  } catch (error) {
    console.error('Error rejecting call:', error);
    res.status(500).json({
      error: 'Failed to reject call',
      message: error.message
    });
  }
});

// End a call
router.post('/end/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.uid;

    // Get call details
    const call = await firebaseHelpers.getDocument('calls', callId);
    if (!call) {
      return res.status(404).json({
        error: 'Call not found',
        message: 'Call does not exist or has expired'
      });
    }

    if (!call.participants || !call.participants.includes(userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a participant in this call'
      });
    }

    const endedAt = new Date().toISOString();
    const duration = call.startedAt ? 
      Math.floor((new Date(endedAt) - new Date(call.startedAt)) / 1000) : 0;

    // Update call status
    await firebaseHelpers.updateDocument('calls', callId, {
      status: CALL_STATUS.ENDED,
      endedAt,
      duration
    });

    // Notify other participants
    const io = req.app.get('io');
    if (io) {
      const otherParticipants = call.participants.filter(id => id !== userId);
      otherParticipants.forEach(participantId => {
        io.to(`user-${participantId}`).emit('call_ended', {
          callId,
          endedBy: userId,
          duration,
          timestamp: endedAt
        });
      });
    }

    res.json({
      success: true,
      data: {
        callId,
        status: CALL_STATUS.ENDED,
        duration
      }
    });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      error: 'Failed to end call',
      message: error.message
    });
  }
});

// Get call history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { page = 1, limit = 20, type, status } = req.query;

    let whereConditions = [
      ['participants', 'array-contains', userId]
    ];

    if (type) {
      whereConditions.push(['type', '==', type]);
    }

    if (status) {
      whereConditions.push(['status', '==', status]);
    }

    const calls = await firebaseHelpers.getCollection('calls', {
      where: whereConditions,
      orderBy: [['createdAt', 'desc']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Get participant details
    const callsWithDetails = await Promise.all(
      calls.map(async (call) => {
        const otherParticipants = call.participants.filter(id => id !== userId);
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
          ...call,
          participants: participantDetails
        };
      })
    );

    res.json({
      success: true,
      data: callsWithDetails
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({
      error: 'Failed to get call history',
      message: error.message
    });
  }
});

// Get WebRTC configuration
router.get('/webrtc-config', verifyToken, async (req, res) => {
  try {
    // This would typically include STUN/TURN server configuration
    const webrtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };

    res.json({
      success: true,
      data: webrtcConfig
    });
  } catch (error) {
    console.error('Error getting WebRTC config:', error);
    res.status(500).json({
      error: 'Failed to get WebRTC configuration',
      message: error.message
    });
  }
});

// Get call statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get call statistics
    const stats = await firebaseHelpers.getCollection('calls', {
      where: [
        ['participants', 'array-contains', userId],
        ['createdAt', '>=', startDate.toISOString()]
      ]
    });

    const totalCalls = stats.length;
    const completedCalls = stats.filter(call => call.status === CALL_STATUS.ENDED).length;
    const missedCalls = stats.filter(call => call.status === CALL_STATUS.MISSED).length;
    const totalDuration = stats
      .filter(call => call.duration)
      .reduce((sum, call) => sum + call.duration, 0);

    res.json({
      success: true,
      data: {
        totalCalls,
        completedCalls,
        missedCalls,
        totalDuration,
        averageDuration: completedCalls > 0 ? Math.floor(totalDuration / completedCalls) : 0,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error getting call stats:', error);
    res.status(500).json({
      error: 'Failed to get call statistics',
      message: error.message
    });
  }
});

module.exports = router;
