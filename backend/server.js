const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize Firebase
const { firebaseApp, database, auth, firebaseHelpers } = require('./config/firebase');

// Firebase-only setup (no MySQL required)

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001"
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const portfolioRoutes = require('./routes/portfolio');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const callingRoutes = require('./routes/calling');
const socialRoutes = require('./routes/social');
const testimonialRoutes = require('./routes/testimonials');
const serviceRoutes = require('./routes/services');
const freelancerRoutes = require('./routes/freelancer');
const providerFreelancerRoutes = require('./routes/provider-freelancer');
const staffJobsRoutes = require('./routes/staff-jobs');
// const searchRoutes = require('./routes/search'); // MySQL routes - disabled

// Firebase helpers already imported above

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Eventrra Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'User Authentication & Role Management',
      'Real-time Bidding & Booking System',
      'Portfolio Management (Instagram-like)',
      'Real-time Notifications',
      'Admin Dashboard',
      'Firebase Integration'
    ]
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Server is healthy',
    uptime: process.uptime(),
    firebase: !!firebaseApp
  });
});

// Mount route handlers
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calling', callingRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/provider-freelancer', providerFreelancerRoutes);
app.use('/api/staff-jobs', staffJobsRoutes);
// app.use('/api/search', searchRoutes); // MySQL routes - disabled

// Firebase-powered API endpoints

// Get all events from Firestore
app.get('/api/events', async (req, res) => {
  try {
    const events = await firebaseHelpers.getCollection('events');
    res.json({
      message: 'Events retrieved successfully',
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Create a new event
app.post('/api/events', async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title and date are required'
      });
    }

    const eventData = {
      title,
      description: description || '',
      date,
      location: location || '',
      category: category || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await firebaseHelpers.createDocument('events', eventData);
    res.status(201).json({
      message: 'Event created successfully',
      data: { id: docRef.id, ...eventData }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// Get a specific event
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await firebaseHelpers.getDocument('events', id);
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `Event with ID ${id} does not exist`
      });
    }

    res.json({
      message: 'Event retrieved successfully',
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

// Update an event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('events', id, updateData);
    const updatedEvent = await firebaseHelpers.getDocument('events', id);
    
    res.json({
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      error: 'Failed to update event',
      message: error.message
    });
  }
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await firebaseHelpers.deleteDocument('events', id);
    
    res.json({
      message: 'Event deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// Firebase status endpoint
app.get('/api/firebase/status', (req, res) => {
  res.json({
    message: 'Firebase connection status',
    connected: !!firebaseApp,
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check actual database contents
app.get('/api/debug/users', async (req, res) => {
  try {
    const allUsers = await firebaseHelpers.getCollection('users');
    
    const userSummary = allUsers.map(user => ({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      approved: user.approved,
      businessName: user.businessName,
      registrationDate: user.registrationDate
    }));
    
    const roleStats = {};
    allUsers.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    
    res.json({
      message: 'Database users debug info',
      totalUsers: allUsers.length,
      roleStats,
      users: userSummary
    });
  } catch (error) {
    console.error('Error fetching debug users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Enhanced Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Store user ID for this socket
  let userId = null;

  // Join user to their personal room
  socket.on('join-user-room', (userData) => {
    userId = userData.uid;
    socket.userId = userId;
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
    
    // Notify others that user is online
    socket.broadcast.emit('user-online', {
      userId,
      name: userData.name,
      timestamp: new Date().toISOString()
    });
  });

  // Chat functionality
  socket.on('join-chat-room', (roomId) => {
    socket.join(`chat-${roomId}`);
    console.log(`User ${userId} joined chat room ${roomId}`);
  });

  socket.on('leave-chat-room', (roomId) => {
    socket.leave(`chat-${roomId}`);
    console.log(`User ${userId} left chat room ${roomId}`);
  });

  // Typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`chat-${data.roomId}`).emit('user-typing', {
      userId,
      roomId: data.roomId,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`chat-${data.roomId}`).emit('user-typing', {
      userId,
      roomId: data.roomId,
      isTyping: false
    });
  });

  // Call functionality
  socket.on('call-initiated', (data) => {
    socket.to(`user-${data.recipientId}`).emit('incoming-call', {
      callId: data.callId,
      callerId: data.callerId,
      callerName: data.callerName,
      type: data.type,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('call-accepted', (data) => {
    socket.to(`user-${data.callerId}`).emit('call-accepted', {
      callId: data.callId,
      recipientId: data.recipientId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('call-rejected', (data) => {
    socket.to(`user-${data.callerId}`).emit('call-rejected', {
      callId: data.callId,
      recipientId: data.recipientId,
      reason: data.reason,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('call-ended', (data) => {
    socket.to(`user-${data.otherParticipantId}`).emit('call-ended', {
      callId: data.callId,
      endedBy: data.endedBy,
      duration: data.duration,
      timestamp: new Date().toISOString()
    });
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    socket.to(`user-${data.recipientId}`).emit('webrtc-offer', {
      offer: data.offer,
      callerId: data.callerId,
      callId: data.callId
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(`user-${data.callerId}`).emit('webrtc-answer', {
      answer: data.answer,
      recipientId: data.recipientId,
      callId: data.callId
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(`user-${data.recipientId}`).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderId: data.senderId,
      callId: data.callId
    });
  });

  // Bid request notifications
  socket.on('subscribe-bid-requests', (providerId) => {
    socket.join(`provider-${providerId}`);
    console.log(`Provider ${providerId} subscribed to bid requests`);
  });

  // Handle booking updates
  socket.on('subscribe-bookings', (userId) => {
    socket.join(`bookings-${userId}`);
    console.log(`User ${userId} subscribed to booking updates`);
  });

  // Handle portfolio interactions
  socket.on('subscribe-portfolio', (providerId) => {
    socket.join(`portfolio-${providerId}`);
    console.log(`Provider ${providerId} subscribed to portfolio updates`);
  });

  // Social feed notifications
  socket.on('subscribe-social-feed', (userId) => {
    socket.join(`social-${userId}`);
    console.log(`User ${userId} subscribed to social feed`);
  });

  // Notification system
  socket.on('mark-notification-read', (notificationId) => {
    // This would update the notification in the database
    console.log(`User ${userId} marked notification ${notificationId} as read`);
  });

  // Presence system
  socket.on('update-presence', (status) => {
    socket.broadcast.emit('user-presence-updated', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (userId) {
      // Notify others that user is offline
      socket.broadcast.emit('user-offline', {
        userId,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Make io available to routes
app.set('io', io);

// Admin user creation removed - create manually using scripts or Firebase Console

// Start server with Firebase
server.listen(PORT, () => {
  console.log(`🚀 Eventrra Backend Server is running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`🔌 Socket.IO enabled for real-time features`);
  console.log(`📝 To create admin user, use: node scripts/createAdmin.js`);
});
