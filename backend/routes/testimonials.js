const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Create testimonial
router.post('/', verifyToken, async (req, res) => {
  try {
    const { rating, comment, serviceProviderId, bookingId } = req.body;
    const { uid, name, email } = req.user;

    if (!rating || !comment) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Rating and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    const testimonialData = {
      userId: uid,
      userName: name,
      userEmail: email,
      rating: parseInt(rating),
      comment: comment.trim(),
      serviceProviderId: serviceProviderId || null,
      bookingId: bookingId || null,
      approved: false, // Admin approval required
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const testimonialId = await firebaseHelpers.createDocument('testimonials', testimonialData);

    res.status(201).json({
      message: 'Testimonial submitted successfully',
      data: { id: testimonialId, ...testimonialData }
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({
      error: 'Failed to create testimonial',
      message: error.message
    });
  }
});

// Get all approved testimonials
router.get('/', async (req, res) => {
  try {
    const { limit = 10, featured = false } = req.query;
    
    // Try to get testimonials from Firestore
    try {
      let query = firebaseHelpers.firestore
        .collection('testimonials')
        .where('approved', '==', true);
      
      if (featured === 'true') {
        query = query.where('featured', '==', true);
      }
      
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      const testimonials = [];
      snapshot.forEach(doc => {
        testimonials.push({ id: doc.id, ...doc.data() });
      });

      // If we have testimonials, return them
      if (testimonials.length > 0) {
        return res.json({
          message: 'Testimonials retrieved successfully',
          data: testimonials
        });
      }
    } catch (firestoreError) {
      console.log('Firestore not available, returning dummy testimonials');
    }

    // Fallback to dummy testimonials if Firestore is not available or no testimonials exist
    const dummyTestimonials = [
      {
        id: 'dummy_1',
        userName: 'Sarah Johnson',
        userEmail: 'sarah@example.com',
        rating: 5,
        comment: 'Eventrra made our wedding absolutely perfect! The team was professional, creative, and handled everything seamlessly. Highly recommended!',
        serviceProviderId: null,
        bookingId: null,
        approved: true,
        featured: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy_2',
        userName: 'Michael Chen',
        userEmail: 'michael@example.com',
        rating: 5,
        comment: 'Outstanding service for our corporate event. The attention to detail and professionalism exceeded our expectations. Will definitely use again!',
        serviceProviderId: null,
        bookingId: null,
        approved: true,
        featured: true,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy_3',
        userName: 'Emily Rodriguez',
        userEmail: 'emily@example.com',
        rating: 4,
        comment: 'Great platform for finding reliable event services. The booking process was smooth and the service providers were excellent.',
        serviceProviderId: null,
        bookingId: null,
        approved: true,
        featured: false,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      message: 'Dummy testimonials retrieved successfully',
      data: dummyTestimonials.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      error: 'Failed to fetch testimonials',
      message: error.message
    });
  }
});

// Get user's testimonials
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    const snapshot = await firebaseHelpers.firestore
      .collection('testimonials')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const testimonials = [];
    snapshot.forEach(doc => {
      testimonials.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      message: 'User testimonials retrieved successfully',
      data: testimonials
    });
  } catch (error) {
    console.error('Error fetching user testimonials:', error);
    res.status(500).json({
      error: 'Failed to fetch user testimonials',
      message: error.message
    });
  }
});

// Update testimonial (user can only update their own)
router.put('/:testimonialId', verifyToken, async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const { rating, comment } = req.body;
    const { uid } = req.user;

    // Check if testimonial exists and belongs to user
    const testimonial = await firebaseHelpers.getDocument('testimonials', testimonialId);
    if (!testimonial) {
      return res.status(404).json({
        error: 'Testimonial not found',
        message: 'Testimonial does not exist'
      });
    }

    if (testimonial.userId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own testimonials'
      });
    }

    if (testimonial.approved) {
      return res.status(400).json({
        error: 'Cannot update approved testimonial',
        message: 'Approved testimonials cannot be modified'
      });
    }

    const updateData = {
      rating: rating ? parseInt(rating) : testimonial.rating,
      comment: comment ? comment.trim() : testimonial.comment,
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('testimonials', testimonialId, updateData);
    const updatedTestimonial = await firebaseHelpers.getDocument('testimonials', testimonialId);

    res.json({
      message: 'Testimonial updated successfully',
      data: updatedTestimonial
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({
      error: 'Failed to update testimonial',
      message: error.message
    });
  }
});

// Delete testimonial (user can only delete their own)
router.delete('/:testimonialId', verifyToken, async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const { uid } = req.user;

    // Check if testimonial exists and belongs to user
    const testimonial = await firebaseHelpers.getDocument('testimonials', testimonialId);
    if (!testimonial) {
      return res.status(404).json({
        error: 'Testimonial not found',
        message: 'Testimonial does not exist'
      });
    }

    if (testimonial.userId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own testimonials'
      });
    }

    await firebaseHelpers.deleteDocument('testimonials', testimonialId);

    res.json({
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({
      error: 'Failed to delete testimonial',
      message: error.message
    });
  }
});

// Admin: Approve/Reject testimonial
router.patch('/:testimonialId/approval', verifyToken, async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const { approved, featured = false } = req.body;
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only admins can approve testimonials'
      });
    }

    const updateData = {
      approved: approved,
      featured: featured,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('testimonials', testimonialId, updateData);
    const updatedTestimonial = await firebaseHelpers.getDocument('testimonials', testimonialId);

    res.json({
      message: `Testimonial ${approved ? 'approved' : 'rejected'} successfully`,
      data: updatedTestimonial
    });
  } catch (error) {
    console.error('Error updating testimonial approval:', error);
    res.status(500).json({
      error: 'Failed to update testimonial approval',
      message: error.message
    });
  }
});

// Admin: Get all testimonials (including pending)
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    const { role } = req.user;
    const { status = 'all', limit = 20, page = 1 } = req.query;

    if (role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only admins can access this endpoint'
      });
    }

    let query = firebaseHelpers.firestore.collection('testimonials');
    
    if (status === 'pending') {
      query = query.where('approved', '==', false);
    } else if (status === 'approved') {
      query = query.where('approved', '==', true);
    } else if (status === 'featured') {
      query = query.where('featured', '==', true);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();

    const testimonials = [];
    snapshot.forEach(doc => {
      testimonials.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      message: 'All testimonials retrieved successfully',
      data: testimonials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: testimonials.length
      }
    });
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    res.status(500).json({
      error: 'Failed to fetch testimonials',
      message: error.message
    });
  }
});

module.exports = router;
