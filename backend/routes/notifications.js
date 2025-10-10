const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Get user notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.uid;

    // Realtime Database does not support compound queries like Firestore.
    // Fetch, then filter/sort/paginate in memory for now.
    const allNotifications = await firebaseHelpers.getCollection('notifications');
    const filtered = allNotifications
      .filter(n => n.userId === userId && (unreadOnly === 'true' ? n.read === false : true))
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime; // desc
      });

    const pageNum = parseInt(page);
    const perPage = parseInt(limit);
    const start = (pageNum - 1) * perPage;
    const paged = filtered.slice(start, start + perPage);

    res.json({
      message: 'Notifications retrieved successfully',
      data: paged,
      pagination: {
        page: pageNum,
        limit: perPage,
        total: filtered.length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.uid;

    const notification = await firebaseHelpers.getDocument('notifications', notificationId);
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'The specified notification does not exist'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own notifications'
      });
    }

    await firebaseHelpers.updateDocument('notifications', notificationId, {
      read: true,
      readAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: 'Notification marked as read',
      data: { id: notificationId, read: true }
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      error: 'Failed to update notification',
      message: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const updateTime = new Date().toISOString();

    const allNotifications = await firebaseHelpers.getCollection('notifications');
    const toUpdate = allNotifications.filter(n => n.userId === userId && n.read === false);

    await Promise.all(
      toUpdate.map(n =>
        firebaseHelpers.updateDocument('notifications', n.id, {
          read: true,
          readAt: updateTime,
          updatedAt: updateTime
        })
      )
    );

    res.json({
      message: 'All notifications marked as read',
      data: { updatedCount: toUpdate.length }
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      error: 'Failed to update notifications',
      message: error.message
    });
  }
});

// Delete notification
router.delete('/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.uid;

    const notification = await firebaseHelpers.getDocument('notifications', notificationId);
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'The specified notification does not exist'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own notifications'
      });
    }

    await firebaseHelpers.deleteDocument('notifications', notificationId);

    res.json({
      message: 'Notification deleted successfully',
      data: { id: notificationId }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

// Get notification count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const allNotifications = await firebaseHelpers.getCollection('notifications');
    const unreadCount = allNotifications.filter(n => n.userId === userId && n.read === false).length;

    res.json({
      message: 'Notification count retrieved successfully',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      error: 'Failed to fetch notification count',
      message: error.message
    });
  }
});

// Create notification (Admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, type, title, and message are required'
      });
    }

    const notificationData = {
      userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    const notification = await firebaseHelpers.createDocument('notifications', notificationData);

    res.status(201).json({
      message: 'Notification created successfully',
      data: { id: notification.id, ...notificationData }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      message: error.message
    });
  }
});

module.exports = router;
