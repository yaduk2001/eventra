const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get admin dashboard statistics
router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Get all users from Firebase
    const allUsers = await firebaseHelpers.getCollection('users');
    
    // Calculate user statistics
    const userStats = {};
    const roleCounts = {};
    let totalCustomers = 0;
    let totalProviders = 0;
    let pendingApprovals = 0;

    allUsers.forEach(user => {
      const role = user.role || 'customer';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
      
      if (role === 'customer') {
        totalCustomers++;
      } else if (role !== 'admin') {
        totalProviders++;
        if (!user.approved) {
          pendingApprovals++;
        }
      }
    });

    // Get pending approvals (users not approved)
    const pendingUsers = allUsers.filter(user => 
      user.role && 
      user.role !== 'customer' && 
      user.role !== 'admin' && 
      !user.approved
    );

    // Get recent bookings
    const allBookings = await firebaseHelpers.getCollection('bookings') || [];
    const recentBookings = allBookings
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);

    // Get platform statistics
    const platformStats = {
      total_customers: totalCustomers,
      total_providers: totalProviders,
      total_bookings: allBookings.length,
      pending_approvals: pendingApprovals,
      total_revenue: allBookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + (parseFloat(booking.amount) || 0), 0)
    };

    res.json({
      success: true,
      data: {
        userStats: Object.entries(roleCounts).map(([role, count]) => ({
          role,
          count,
          approved_count: role === 'customer' ? count : 
            allUsers.filter(u => u.role === role && u.approved).length
        })),
        pendingApprovals: pendingUsers,
        recentBookings,
        platformStats
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard data',
      error: error.message
    });
  }
});

// Get pending approvals
router.get('/pending-approvals', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    
    // Get all users from Firebase
    const allUsers = await firebaseHelpers.getCollection('users');
    
    // Filter for pending approvals
    let pendingUsers = allUsers.filter(user => 
      user.role && 
      user.role !== 'customer' && 
      user.role !== 'admin' && 
      !user.approved
    );

    // Filter by role if specified
    if (role) {
      pendingUsers = pendingUsers.filter(user => user.role === role);
    }

    // Sort by creation date (newest first)
    pendingUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const total = pendingUsers.length;
    const paginatedUsers = pendingUsers.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending approvals',
      error: error.message
    });
  }
});

// Approve user
router.patch('/approve-user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, notes } = req.body;

    // Get user data
    const user = await firebaseHelpers.getDocument('users', userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user approval status
    await firebaseHelpers.updateDocument('users', userId, {
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.uid,
      approvalReason: reason || 'Account approved by admin',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'User approved successfully'
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
      error: error.message
    });
  }
});

// Reject user
router.patch('/reject-user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Get user data
    const user = await firebaseHelpers.getDocument('users', userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user approval status
    await firebaseHelpers.updateDocument('users', userId, {
      approved: false,
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user.uid,
      rejectionReason: reason,
      notes: notes || '',
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user',
      error: error.message
    });
  }
});

// Get all users with filters
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      approved, 
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    // Get all users from Firebase
    let allUsers = await firebaseHelpers.getCollection('users');

    // Apply filters
    if (role) {
      allUsers = allUsers.filter(user => user.role === role);
    }

    if (approved !== undefined) {
      const isApproved = approved === 'true';
      allUsers = allUsers.filter(user => !!user.approved === isApproved);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      allUsers = allUsers.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm))
      );
    }

    // Sort users
    allUsers.sort((a, b) => {
      const aValue = a[sort_by] || '';
      const bValue = b[sort_by] || '';
      
      if (sort_order === 'DESC') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const total = allUsers.length;
    const paginatedUsers = allUsers.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Get all bookings
router.get('/bookings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      service_type,
      date_from,
      date_to
    } = req.query;

    // Get all bookings from Firebase
    let allBookings = await firebaseHelpers.getCollection('bookings') || [];
    const allUsers = await firebaseHelpers.getCollection('users');

    // Create user lookup map
    const userMap = {};
    allUsers.forEach(user => {
      userMap[user.uid] = user;
    });

    // Enrich bookings with user data
    allBookings = allBookings.map(booking => ({
      ...booking,
      customer_name: userMap[booking.userId]?.name || 'Unknown',
      customer_email: userMap[booking.userId]?.email || 'Unknown',
      provider_name: userMap[booking.providerId]?.name || 'Unknown',
      provider_email: userMap[booking.providerId]?.email || 'Unknown',
      business_name: userMap[booking.providerId]?.businessName || ''
    }));

    // Apply filters
    if (status) {
      allBookings = allBookings.filter(booking => booking.status === status);
    }

    if (service_type) {
      allBookings = allBookings.filter(booking => booking.serviceType === service_type);
    }

    if (date_from) {
      allBookings = allBookings.filter(booking => 
        booking.eventDate && new Date(booking.eventDate) >= new Date(date_from)
      );
    }

    if (date_to) {
      allBookings = allBookings.filter(booking => 
        booking.eventDate && new Date(booking.eventDate) <= new Date(date_to)
      );
    }

    // Sort by creation date (newest first)
    allBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const total = allBookings.length;
    const paginatedBookings = allBookings.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
});

// Get all bid requests
router.get('/bid-requests', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      event_type,
      date_from,
      date_to
    } = req.query;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('br.status = ?');
      params.push(status);
    }

    if (event_type) {
      whereConditions.push('br.event_type = ?');
      params.push(event_type);
    }

    if (date_from) {
      whereConditions.push('br.event_date >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('br.event_date <= ?');
      params.push(date_to);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        br.*,
        u.name as user_name,
        u.email as user_email,
        COUNT(b.id) as bid_count
      FROM bid_requests br
      JOIN users u ON br.user_id = u.id
      LEFT JOIN bids b ON br.id = b.bid_request_id
      ${whereClause}
      GROUP BY br.id
      ORDER BY br.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const bidRequests = await dbHelpers.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bid_requests br
      JOIN users u ON br.user_id = u.id
      ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const [{ total }] = await dbHelpers.query(countQuery, countParams);

    res.json({
      success: true,
      data: bidRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bid requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bid requests',
      error: error.message
    });
  }
});

// Get platform analytics
router.get('/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // User registration trends
    const userTrends = await dbHelpers.query(`
      SELECT 
        DATE(created_at) as date,
        role,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at), role
      ORDER BY date DESC
    `, [days]);

    // Booking trends
    const bookingTrends = await dbHelpers.query(`
      SELECT 
        DATE(created_at) as date,
        service_type,
        COUNT(*) as count,
        SUM(amount) as revenue
      FROM bookings 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at), service_type
      ORDER BY date DESC
    `, [days]);

    // Revenue analytics
    const revenueStats = await dbHelpers.queryOne(`
      SELECT 
        SUM(amount) as total_revenue,
        AVG(amount) as average_booking_value,
        COUNT(*) as total_bookings
      FROM bookings 
      WHERE status = 'completed' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    // Top service providers
    const topProviders = await dbHelpers.query(`
      SELECT 
        u.id,
        u.name,
        u.business_name,
        sp.rating,
        sp.review_count,
        COUNT(b.id) as booking_count,
        SUM(b.amount) as total_revenue
      FROM users u
      JOIN service_providers sp ON u.id = sp.user_id
      LEFT JOIN bookings b ON u.id = b.provider_id
      WHERE u.approved = 1 AND u.role != 'customer'
      GROUP BY u.id
      ORDER BY booking_count DESC, total_revenue DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        userTrends,
        bookingTrends,
        revenueStats,
        topProviders
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

module.exports = router;