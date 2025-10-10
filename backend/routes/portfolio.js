const express = require('express');
const router = express.Router();
const multer = require('multer');
const { firebaseHelpers, storage: firebaseStorage } = require('../config/firebase');
const { verifyToken, requireServiceProvider } = require('../middleware/auth');

// Configure multer for file uploads (in memory for Firebase Storage)
const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Upload portfolio media
router.post('/upload', verifyToken, requireServiceProvider, upload.array('media', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    const { caption, tags, category } = req.body;
    const providerId = req.user.uid;
    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of req.files) {
      const fileName = `${providerId}/${Date.now()}-${file.originalname}`;
      
      // Upload to Firebase Storage
      const bucket = firebaseHelpers.admin.storage().bucket();
      const fileUpload = bucket.file(fileName);
      
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            providerId,
            originalName: file.originalname
          }
        }
      });

      // Get download URL
      const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Long expiration for portfolio images
      });

      uploadedFiles.push({
        fileName,
        originalName: file.originalname,
        url,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        size: file.size
      });
    }

    // Create portfolio entry
    const portfolioData = {
      providerId,
      providerName: req.user.name,
      providerRole: req.userRole,
      media: uploadedFiles,
      caption: caption || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      category: category || 'general',
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const portfolioEntry = await firebaseHelpers.createDocument('portfolio', portfolioData);

    res.status(201).json({
      message: 'Portfolio uploaded successfully',
      data: { id: portfolioEntry.id, ...portfolioData }
    });
  } catch (error) {
    console.error('Error uploading portfolio:', error);
    res.status(500).json({
      error: 'Failed to upload portfolio',
      message: error.message
    });
  }
});

// Get portfolio entries
router.get('/', async (req, res) => {
  try {
    const { providerId, category, page = 1, limit = 20 } = req.query;
    
    let query = firebaseHelpers.firestore.collection('portfolio')
      .orderBy('createdAt', 'desc');

    if (providerId) {
      query = query.where('providerId', '==', providerId);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();

    const portfolioEntries = [];
    snapshot.forEach(doc => {
      portfolioEntries.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      message: 'Portfolio retrieved successfully',
      data: portfolioEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: portfolioEntries.length
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio',
      message: error.message
    });
  }
});

// Get provider's portfolio
router.get('/my-portfolio', verifyToken, requireServiceProvider, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const providerId = req.user.uid;

    const snapshot = await firebaseHelpers.firestore.collection('portfolio')
      .where('providerId', '==', providerId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();

    const portfolioEntries = [];
    snapshot.forEach(doc => {
      portfolioEntries.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      message: 'Portfolio retrieved successfully',
      data: portfolioEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: portfolioEntries.length
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio',
      message: error.message
    });
  }
});

// Like/Unlike portfolio entry
router.post('/:portfolioId/like', verifyToken, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user.uid;

    const portfolioEntry = await firebaseHelpers.getDocument('portfolio', portfolioId);
    if (!portfolioEntry) {
      return res.status(404).json({
        error: 'Portfolio entry not found',
        message: 'The specified portfolio entry does not exist'
      });
    }

    const likes = portfolioEntry.likes || [];
    const isLiked = likes.includes(userId);

    let updatedLikes;
    if (isLiked) {
      // Unlike
      updatedLikes = likes.filter(id => id !== userId);
    } else {
      // Like
      updatedLikes = [...likes, userId];
    }

    await firebaseHelpers.updateDocument('portfolio', portfolioId, {
      likes: updatedLikes,
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: `Portfolio entry ${isLiked ? 'unliked' : 'liked'} successfully`,
      data: {
        liked: !isLiked,
        likesCount: updatedLikes.length
      }
    });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({
      error: 'Failed to update like',
      message: error.message
    });
  }
});

// Add comment to portfolio entry
router.post('/:portfolioId/comment', verifyToken, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment required',
        message: 'Please provide a comment'
      });
    }

    const portfolioEntry = await firebaseHelpers.getDocument('portfolio', portfolioId);
    if (!portfolioEntry) {
      return res.status(404).json({
        error: 'Portfolio entry not found',
        message: 'The specified portfolio entry does not exist'
      });
    }

    const commentData = {
      id: Date.now().toString(),
      userId: req.user.uid,
      userName: req.user.name,
      userPicture: req.user.picture,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    const comments = portfolioEntry.comments || [];
    comments.push(commentData);

    await firebaseHelpers.updateDocument('portfolio', portfolioId, {
      comments,
      updatedAt: new Date().toISOString()
    });

    // Notify portfolio owner about new comment
    if (portfolioEntry.providerId !== req.user.uid) {
      await createNotification(portfolioEntry.providerId, {
        type: 'portfolio_comment',
        title: 'New Comment on Portfolio',
        message: `${req.user.name} commented on your portfolio`,
        data: { portfolioId, commentId: commentData.id }
      });
    }

    res.status(201).json({
      message: 'Comment added successfully',
      data: commentData
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
});

// Delete portfolio entry
router.delete('/:portfolioId', verifyToken, requireServiceProvider, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const providerId = req.user.uid;

    const portfolioEntry = await firebaseHelpers.getDocument('portfolio', portfolioId);
    if (!portfolioEntry) {
      return res.status(404).json({
        error: 'Portfolio entry not found',
        message: 'The specified portfolio entry does not exist'
      });
    }

    if (portfolioEntry.providerId !== providerId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own portfolio entries'
      });
    }

    // Delete files from Firebase Storage
    const bucket = firebaseHelpers.admin.storage().bucket();
    for (const media of portfolioEntry.media) {
      try {
        await bucket.file(media.fileName).delete();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete portfolio entry from Firestore
    await firebaseHelpers.deleteDocument('portfolio', portfolioId);

    res.json({
      message: 'Portfolio entry deleted successfully',
      data: { id: portfolioId }
    });
  } catch (error) {
    console.error('Error deleting portfolio entry:', error);
    res.status(500).json({
      error: 'Failed to delete portfolio entry',
      message: error.message
    });
  }
});

// Get portfolio statistics
router.get('/:providerId/stats', async (req, res) => {
  try {
    const { providerId } = req.params;

    const snapshot = await firebaseHelpers.firestore.collection('portfolio')
      .where('providerId', '==', providerId)
      .get();

    let totalLikes = 0;
    let totalComments = 0;
    const categories = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      totalLikes += (data.likes || []).length;
      totalComments += (data.comments || []).length;
      
      const category = data.category || 'general';
      categories[category] = (categories[category] || 0) + 1;
    });

    res.json({
      message: 'Portfolio statistics retrieved successfully',
      data: {
        totalPosts: snapshot.size,
        totalLikes,
        totalComments,
        categories
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio stats:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio statistics',
      message: error.message
    });
  }
});

// Helper function to create notification
async function createNotification(userId, notificationData) {
  try {
    const notification = {
      userId,
      read: false,
      createdAt: new Date().toISOString(),
      ...notificationData
    };

    await firebaseHelpers.createDocument('notifications', notification);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

module.exports = router;
