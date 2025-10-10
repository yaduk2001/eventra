const { dbHelpers } = require('../config/database');

class NotificationService {
  // Create a new notification
  static async createNotification(userId, title, message, type, relatedId = null) {
    try {
      const notificationId = await dbHelpers.insert(
        `INSERT INTO notifications (user_id, title, message, type, related_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, title, message, type, relatedId]
      );

      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      let whereClause = 'WHERE user_id = ?';
      let params = [userId];

      if (unreadOnly) {
        whereClause += ' AND is_read = 0';
      }

      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM notifications 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const notifications = await dbHelpers.query(query, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
      const countParams = unreadOnly ? [userId] : [userId];
      const [{ total }] = await dbHelpers.query(countQuery, countParams);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const affectedRows = await dbHelpers.update(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
      return affectedRows > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const affectedRows = await dbHelpers.update(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );
      return affectedRows;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const affectedRows = await dbHelpers.delete(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
      return affectedRows > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const [{ count }] = await dbHelpers.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Notification types and templates
  static getNotificationTemplates() {
    return {
      // Booking notifications
      BOOKING_CREATED: {
        title: 'New Booking Request',
        message: 'You have received a new booking request for {service_type} on {date}',
        type: 'booking'
      },
      BOOKING_CONFIRMED: {
        title: 'Booking Confirmed',
        message: 'Your booking for {service_type} on {date} has been confirmed',
        type: 'booking'
      },
      BOOKING_CANCELLED: {
        title: 'Booking Cancelled',
        message: 'Your booking for {service_type} on {date} has been cancelled',
        type: 'booking'
      },

      // Bid notifications
      BID_RECEIVED: {
        title: 'New Bid Received',
        message: 'You have received a new bid for your event request',
        type: 'bid'
      },
      BID_ACCEPTED: {
        title: 'Bid Accepted',
        message: 'Your bid has been accepted for the event on {date}',
        type: 'bid'
      },
      BID_REJECTED: {
        title: 'Bid Rejected',
        message: 'Your bid has been rejected for the event on {date}',
        type: 'bid'
      },

      // Approval notifications
      ACCOUNT_APPROVED: {
        title: 'Account Approved',
        message: 'Your service provider account has been approved. You can now start receiving bookings!',
        type: 'approval'
      },
      ACCOUNT_REJECTED: {
        title: 'Account Rejected',
        message: 'Your service provider account has been rejected. Please contact support for more information.',
        type: 'approval'
      },

      // System notifications
      WELCOME: {
        title: 'Welcome to Eventrra!',
        message: 'Thank you for joining Eventrra. Start exploring amazing event services!',
        type: 'system'
      },
      PROFILE_INCOMPLETE: {
        title: 'Complete Your Profile',
        message: 'Complete your profile to start receiving bookings and bids',
        type: 'system'
      }
    };
  }

  // Send notification with template
  static async sendTemplateNotification(userId, templateKey, variables = {}) {
    try {
      const templates = this.getNotificationTemplates();
      const template = templates[templateKey];
      
      if (!template) {
        throw new Error(`Template ${templateKey} not found`);
      }

      // Replace variables in message
      let message = template.message;
      Object.keys(variables).forEach(key => {
        message = message.replace(`{${key}}`, variables[key]);
      });

      return await this.createNotification(
        userId,
        template.title,
        message,
        template.type
      );
    } catch (error) {
      console.error('Error sending template notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  static async sendBulkNotification(userIds, title, message, type, relatedId = null) {
    try {
      const notifications = [];
      for (const userId of userIds) {
        const notificationId = await this.createNotification(userId, title, message, type, relatedId);
        notifications.push({ userId, notificationId });
      }
      return notifications;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId) {
    try {
      const stats = await dbHelpers.queryOne(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN type = 'booking' THEN 1 ELSE 0 END) as booking_notifications,
          SUM(CASE WHEN type = 'bid' THEN 1 ELSE 0 END) as bid_notifications,
          SUM(CASE WHEN type = 'approval' THEN 1 ELSE 0 END) as approval_notifications,
          SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system_notifications
        FROM notifications 
        WHERE user_id = ?
      `, [userId]);

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
