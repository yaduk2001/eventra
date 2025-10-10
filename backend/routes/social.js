const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Social post types
const POST_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  CAROUSEL: 'carousel',
  STORY: 'story'
};

// Create a social post
router.post('/post', verifyToken, async (req, res) => {
  try {
    const { content, media, type = POST_TYPES.IMAGE, tags = [], location } = req.body;
    const userId = req.user.uid;
    const userName = req.user.name;
    const userPicture = req.user.picture;

    if (!content && (!media || media.length === 0)) {
      return res.status(400).json({
        error: 'Missing content',
        message: 'Post must have content or media'
      });
    }

    const postData = {
      userId,
      userName,
      userPicture,
      content: content || '',
      media: media || [],
      type,
      tags,
      location: location || null,
      likes: [],
      comments: [],
      shares: 0,
      views: 0,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save post
    const postId = await firebaseHelpers.createDocument('social_posts', postData);

    // Update user's post count
    await firebaseHelpers.updateDocument('users', userId, {
      postCount: (await firebaseHelpers.getDocument('users', userId))?.postCount + 1 || 1
    });

    res.status(201).json({
      success: true,
      data: {
        postId,
        post: { ...postData, id: postId }
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      error: 'Failed to create post',
      message: error.message
    });
  }
});

// Get social feed
router.get('/feed', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userId: specificUser } = req.query;
    const currentUserId = req.user.uid;

    let whereConditions = [['isPublic', '==', true]];

    if (specificUser) {
      whereConditions.push(['userId', '==', specificUser]);
    }

    if (type) {
      whereConditions.push(['type', '==', type]);
    }

    const posts = await firebaseHelpers.getCollection('social_posts', {
      where: whereConditions,
      orderBy: [['createdAt', 'desc']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Add user interaction data
    const postsWithInteractions = posts.map(post => ({
      ...post,
      isLiked: post.likes.includes(currentUserId),
      likeCount: post.likes.length,
      commentCount: post.comments.length
    }));

    res.json({
      success: true,
      data: postsWithInteractions
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({
      error: 'Failed to get feed',
      message: error.message
    });
  }
});

// Like/Unlike a post
router.post('/post/:postId/like', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.uid;

    const post = await firebaseHelpers.getDocument('social_posts', postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'Post does not exist'
      });
    }

    const isLiked = post.likes.includes(userId);
    let updatedLikes;

    if (isLiked) {
      // Unlike
      updatedLikes = post.likes.filter(id => id !== userId);
    } else {
      // Like
      updatedLikes = [...post.likes, userId];
    }

    await firebaseHelpers.updateDocument('social_posts', postId, {
      likes: updatedLikes
    });

    // Send real-time notification
    const io = req.app.get('io');
    if (io && !isLiked && post.userId !== userId) {
      io.to(`user-${post.userId}`).emit('post_liked', {
        postId,
        likedBy: userId,
        likedByName: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        isLiked: !isLiked,
        likeCount: updatedLikes.length
      }
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      error: 'Failed to like post',
      message: error.message
    });
  }
});

// Comment on a post
router.post('/post/:postId/comment', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.uid;
    const userName = req.user.name;
    const userPicture = req.user.picture;

    if (!content) {
      return res.status(400).json({
        error: 'Missing content',
        message: 'Comment content is required'
      });
    }

    const post = await firebaseHelpers.getDocument('social_posts', postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'Post does not exist'
      });
    }

    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userPicture,
      content,
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...post.comments, comment];

    await firebaseHelpers.updateDocument('social_posts', postId, {
      comments: updatedComments
    });

    // Send real-time notification
    const io = req.app.get('io');
    if (io && post.userId !== userId) {
      io.to(`user-${post.userId}`).emit('post_commented', {
        postId,
        comment,
        commentedBy: userId,
        commentedByName: userName,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      data: {
        comment,
        commentCount: updatedComments.length
      }
    });
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(500).json({
      error: 'Failed to comment on post',
      message: error.message
    });
  }
});

// Get post comments
router.get('/post/:postId/comments', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const post = await firebaseHelpers.getDocument('social_posts', postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'Post does not exist'
      });
    }

    const comments = post.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      error: 'Failed to get comments',
      message: error.message
    });
  }
});

// Share a post
router.post('/post/:postId/share', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.uid;

    const post = await firebaseHelpers.getDocument('social_posts', postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'Post does not exist'
      });
    }

    // Increment share count
    await firebaseHelpers.updateDocument('social_posts', postId, {
      shares: post.shares + 1
    });

    // Send real-time notification
    const io = req.app.get('io');
    if (io && post.userId !== userId) {
      io.to(`user-${post.userId}`).emit('post_shared', {
        postId,
        sharedBy: userId,
        sharedByName: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        shareCount: post.shares + 1
      }
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({
      error: 'Failed to share post',
      message: error.message
    });
  }
});

// Get user's posts
router.get('/user/:userId/posts', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.uid;

    const posts = await firebaseHelpers.getCollection('social_posts', {
      where: [['userId', '==', userId]],
      orderBy: [['createdAt', 'desc']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Add interaction data
    const postsWithInteractions = posts.map(post => ({
      ...post,
      isLiked: post.likes.includes(currentUserId),
      likeCount: post.likes.length,
      commentCount: post.comments.length
    }));

    res.json({
      success: true,
      data: postsWithInteractions
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({
      error: 'Failed to get user posts',
      message: error.message
    });
  }
});

// Delete a post
router.delete('/post/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.uid;

    const post = await firebaseHelpers.getDocument('social_posts', postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'Post does not exist'
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own posts'
      });
    }

    await firebaseHelpers.deleteDocument('social_posts', postId);

    // Update user's post count
    await firebaseHelpers.updateDocument('users', userId, {
      postCount: (await firebaseHelpers.getDocument('users', userId))?.postCount - 1 || 0
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Failed to delete post',
      message: error.message
    });
  }
});

// Get trending posts
router.get('/trending', verifyToken, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await firebaseHelpers.getCollection('social_posts', {
      where: [
        ['isPublic', '==', true],
        ['createdAt', '>=', startDate.toISOString()]
      ],
      orderBy: [['createdAt', 'desc']]
    });

    // Calculate trending score (likes + comments + shares)
    const trendingPosts = posts
      .map(post => ({
        ...post,
        trendingScore: post.likes.length + post.comments.length + post.shares
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 20);

    res.json({
      success: true,
      data: trendingPosts
    });
  } catch (error) {
    console.error('Error getting trending posts:', error);
    res.status(500).json({
      error: 'Failed to get trending posts',
      message: error.message
    });
  }
});

// Search posts
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, type, tags, page = 1, limit = 20 } = req.query;

    if (!q && !tags) {
      return res.status(400).json({
        error: 'Missing search criteria',
        message: 'Search query or tags are required'
      });
    }

    let whereConditions = [['isPublic', '==', true]];

    if (type) {
      whereConditions.push(['type', '==', type]);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereConditions.push(['tags', 'array-contains-any', tagArray]);
    }

    const posts = await firebaseHelpers.getCollection('social_posts', {
      where: whereConditions,
      orderBy: [['createdAt', 'desc']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Filter by search query if provided
    let filteredPosts = posts;
    if (q) {
      const query = q.toLowerCase();
      filteredPosts = posts.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    res.json({
      success: true,
      data: filteredPosts
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({
      error: 'Failed to search posts',
      message: error.message
    });
  }
});

module.exports = router;
