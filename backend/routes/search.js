const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Advanced search for service providers
router.get('/providers', async (req, res) => {
  try {
    const {
      category,
      location,
      service_type,
      min_rating,
      max_price,
      is_verified,
      is_featured,
      search,
      page = 1,
      limit = 20,
      sort_by = 'rating',
      sort_order = 'DESC'
    } = req.query;

    let whereConditions = ['u.approved = 1', 'u.role != "customer"'];
    let params = [];

    // Category filter
    if (category) {
      whereConditions.push('JSON_CONTAINS(u.categories, ?)');
      params.push(`"${category}"`);
    }

    // Location filter
    if (location) {
      whereConditions.push('(u.location LIKE ? OR JSON_CONTAINS(u.service_areas, ?))');
      params.push(`%${location}%`, `"${location}"`);
    }

    // Service type filter
    if (service_type) {
      whereConditions.push('u.role = ?');
      params.push(service_type);
    }

    // Rating filter
    if (min_rating) {
      whereConditions.push('sp.rating >= ?');
      params.push(parseFloat(min_rating));
    }

    // Price filter (if we have pricing data)
    if (max_price) {
      whereConditions.push('(sp.base_price IS NULL OR sp.base_price <= ?)');
      params.push(parseFloat(max_price));
    }

    // Verification filter
    if (is_verified === 'true') {
      whereConditions.push('sp.is_verified = 1');
    }

    // Featured filter
    if (is_featured === 'true') {
      whereConditions.push('sp.is_featured = 1');
    }

    // Search text
    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.business_name LIKE ? OR sp.description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build the query
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.picture,
        u.role,
        u.business_name,
        u.location,
        u.service_areas,
        u.categories,
        sp.description,
        sp.rating,
        sp.review_count,
        sp.is_verified,
        sp.is_featured,
        COUNT(p.id) as portfolio_count
      FROM users u
      LEFT JOIN service_providers sp ON u.id = sp.user_id
      LEFT JOIN portfolio p ON u.id = p.provider_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY ${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const providers = await dbHelpers.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN service_providers sp ON u.id = sp.user_id
      ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // Remove limit and offset
    const [{ total }] = await dbHelpers.query(countQuery, countParams);

    res.json({
      success: true,
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search providers',
      error: error.message
    });
  }
});

// Search events
router.get('/events', async (req, res) => {
  try {
    const {
      event_type,
      location,
      date_from,
      date_to,
      min_guests,
      max_guests,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions = ['e.status = "published"'];
    let params = [];

    // Event type filter
    if (event_type) {
      whereConditions.push('e.event_type = ?');
      params.push(event_type);
    }

    // Location filter
    if (location) {
      whereConditions.push('e.location LIKE ?');
      params.push(`%${location}%`);
    }

    // Date range filter
    if (date_from) {
      whereConditions.push('e.event_date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      whereConditions.push('e.event_date <= ?');
      params.push(date_to);
    }

    // Guest count filter
    if (min_guests) {
      whereConditions.push('e.guest_count >= ?');
      params.push(parseInt(min_guests));
    }
    if (max_guests) {
      whereConditions.push('e.guest_count <= ?');
      params.push(parseInt(max_guests));
    }

    // Search text
    if (search) {
      whereConditions.push('(e.title LIKE ? OR e.description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        e.*,
        u.name as user_name,
        u.picture as user_picture
      FROM events e
      JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.event_date ASC
      LIMIT ? OFFSET ?
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const events = await dbHelpers.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      JOIN users u ON e.user_id = u.id
      ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const [{ total }] = await dbHelpers.query(countQuery, countParams);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search events',
      error: error.message
    });
  }
});

// Search bid requests
router.get('/bid-requests', verifyToken, async (req, res) => {
  try {
    const {
      event_type,
      location,
      date_from,
      date_to,
      min_budget,
      max_budget,
      status = 'open',
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions = ['br.status = ?'];
    let params = [status];

    // Event type filter
    if (event_type) {
      whereConditions.push('br.event_type = ?');
      params.push(event_type);
    }

    // Location filter
    if (location) {
      whereConditions.push('br.location LIKE ?');
      params.push(`%${location}%`);
    }

    // Date range filter
    if (date_from) {
      whereConditions.push('br.event_date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      whereConditions.push('br.event_date <= ?');
      params.push(date_to);
    }

    // Budget filter
    if (min_budget) {
      whereConditions.push('br.budget >= ?');
      params.push(parseFloat(min_budget));
    }
    if (max_budget) {
      whereConditions.push('br.budget <= ?');
      params.push(parseFloat(max_budget));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        br.*,
        u.name as user_name,
        u.picture as user_picture,
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
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search bid requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search bid requests',
      error: error.message
    });
  }
});

// Get search filters and options
router.get('/filters', async (req, res) => {
  try {
    // Get categories
    const categories = await dbHelpers.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY name');
    
    // Get service areas
    const serviceAreas = await dbHelpers.query('SELECT * FROM service_areas WHERE is_active = 1 ORDER BY name');
    
    // Get event types
    const eventTypes = [
      { value: 'wedding', label: 'Wedding' },
      { value: 'birthday', label: 'Birthday' },
      { value: 'corporate', label: 'Corporate' },
      { value: 'anniversary', label: 'Anniversary' },
      { value: 'graduation', label: 'Graduation' },
      { value: 'other', label: 'Other' }
    ];

    // Get service types
    const serviceTypes = [
      { value: 'event_company', label: 'Event Management' },
      { value: 'caterer', label: 'Catering' },
      { value: 'transport', label: 'Transportation' },
      { value: 'photographer', label: 'Photography' },
      { value: 'freelancer', label: 'Freelancer' }
    ];

    res.json({
      success: true,
      data: {
        categories,
        serviceAreas,
        eventTypes,
        serviceTypes
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search filters',
      error: error.message
    });
  }
});

module.exports = router;
