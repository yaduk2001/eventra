const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole, requireAdmin } = require('../middleware/auth');

// User roles
const USER_ROLES = {
  CUSTOMER: 'customer',
  EVENT_COMPANY: 'event_company',
  CATERER: 'caterer',
  TRANSPORT: 'transport',
  PHOTOGRAPHER: 'photographer',
  FREELANCER: 'freelancer',
  JOBSEEKER: 'jobseeker',
  ADMIN: 'admin'
};

// Create user profile during registration (no auth required)
router.post('/register', async (req, res) => {
  try {
    const { uid, email, name, picture, role, profileData } = req.body;

    if (!uid || !email || !role || !Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'uid, email, and role are required'
      });
    }

    const userData = {
      uid,
      email,
      name: name || profileData?.name || '',
      picture: picture || profileData?.picture || '',
      role,
      approved: role === USER_ROLES.CUSTOMER || role === USER_ROLES.JOBSEEKER, // Customers and JobSeekers are auto-approved
      phone: profileData?.phone || '',
      location: profileData?.location || '',
      businessName: profileData?.businessName || '',
      serviceAreas: profileData?.serviceAreas || [],
      categories: profileData?.categories || [],
      skills: profileData?.skills || [],
      specialties: profileData?.specialties || [],
      // Additional comprehensive fields
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      userType: profileData?.userType || role,
      profileComplete: profileData?.profileComplete || false,
      registrationDate: profileData?.registrationDate || new Date().toISOString(),
      lastLogin: profileData?.lastLogin || null,
      isActive: profileData?.isActive !== undefined ? profileData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add role-specific fields
    if (role === USER_ROLES.EVENT_COMPANY) {
      userData.serviceAreas = profileData?.serviceAreas || [];
      userData.categories = profileData?.categories || [];
      userData.businessLicense = profileData?.businessLicense || null;
    } else if (role === USER_ROLES.CATERER) {
      userData.foodPackages = profileData?.foodPackages || [];
      userData.rentalItems = profileData?.rentalItems || [];
    } else if (role === USER_ROLES.TRANSPORT) {
      userData.vehicles = profileData?.vehicles || [];
    } else if (role === USER_ROLES.PHOTOGRAPHER) {
      userData.packages = profileData?.packages || [];
      userData.specialties = profileData?.specialties || [];
    } else if (role === USER_ROLES.FREELANCER) {
      userData.skills = profileData?.skills || [];
      userData.availability = profileData?.availability || {};
    } else if (role === USER_ROLES.JOBSEEKER) {
      userData.skills = profileData?.skills || [];
      userData.experience = profileData?.experience || '';
      userData.resume = profileData?.resume || '';
      userData.preferredJobTypes = profileData?.preferredJobTypes || [];
    }

    await firebaseHelpers.createDocument('users', userData, uid);

    res.status(201).json({
      message: 'Profile created successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({
      error: 'Failed to create profile',
      message: error.message
    });
  }
});

// Create or update user profile (authenticated)
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const { role, profileData } = req.body;
    const { uid, email, name, picture } = req.user;

    if (!role || !Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Please provide a valid user role'
      });
    }

    const userData = {
      uid,
      email,
      name: name || profileData.name,
      picture: picture || profileData.picture,
      role,
      approved: role === USER_ROLES.CUSTOMER || role === USER_ROLES.JOBSEEKER, // Customers and JobSeekers are auto-approved
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...profileData
    };

    // Add role-specific fields
    if (role === USER_ROLES.EVENT_COMPANY) {
      userData.serviceAreas = profileData.serviceAreas || [];
      userData.categories = profileData.categories || [];
      userData.businessLicense = profileData.businessLicense || null;
    } else if (role === USER_ROLES.CATERER) {
      userData.foodPackages = profileData.foodPackages || [];
      userData.rentalItems = profileData.rentalItems || [];
    } else if (role === USER_ROLES.TRANSPORT) {
      userData.vehicles = profileData.vehicles || [];
    } else if (role === USER_ROLES.PHOTOGRAPHER) {
      userData.packages = profileData.packages || [];
      userData.specialties = profileData.specialties || [];
    } else if (role === USER_ROLES.FREELANCER) {
      userData.skills = profileData.skills || [];
      userData.availability = profileData.availability || {};
    } else if (role === USER_ROLES.JOBSEEKER) {
      userData.skills = profileData.skills || [];
      userData.experience = profileData.experience || '';
      userData.resume = profileData.resume || '';
      userData.preferredJobTypes = profileData.preferredJobTypes || [];
    }

    await firebaseHelpers.createDocument('users', userData, uid);

    res.status(201).json({
      message: 'Profile created successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({
      error: 'Failed to create profile',
      message: error.message
    });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const userProfile = await firebaseHelpers.getDocument('users', uid);

    if (!userProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile does not exist'
      });
    }

    // Update lastLogin timestamp
    await firebaseHelpers.updateDocument('users', uid, {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Get updated profile
    const updatedProfile = await firebaseHelpers.getDocument('users', uid);

    res.json({
      message: 'Profile retrieved successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('users', uid, updateData);
    const updatedProfile = await firebaseHelpers.getDocument('users', uid);

    res.json({
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Upload profile picture
router.post('/profile/picture', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // For now, we'll simulate a successful upload
    // In a real implementation, you would handle file upload to Firebase Storage
    // and return the download URL
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock profile picture URL
    const profilePictureUrl = `https://images.unsplash.com/photo-1522204523234-8729aa607dc7?w=200&h=200&fit=crop&crop=face`;
    
    // Update user profile with new picture URL
    const updateData = {
      profilePicture: profilePictureUrl,
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('users', uid, updateData);

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: profilePictureUrl
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      error: 'Failed to upload profile picture',
      message: error.message
    });
  }
});

// Get all users (Admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { role, approved, page = 1, limit = 20 } = req.query;
    
    // Get all users from Realtime Database
    const allUsers = await firebaseHelpers.getCollection('users');
    
    // Filter users based on query parameters
    let filteredUsers = allUsers;
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (approved !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.approved === (approved === 'true'));
    }

    // Sort by creation date (newest first)
    filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      message: 'Users retrieved successfully',
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredUsers.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Approve/Reject service provider (Admin only)
router.patch('/:userId/approval', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved, reason } = req.body;

    const updateData = {
      approved,
      approvalDate: new Date().toISOString(),
      approvalReason: reason || null,
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('users', userId, updateData);
    
    // Create notification for the user
    const notificationData = {
      userId,
      type: approved ? 'account_approved' : 'account_rejected',
      title: approved ? 'Account Approved' : 'Account Rejected',
      message: approved 
        ? 'Your account has been approved. You can now start accepting bookings!'
        : `Your account was rejected. Reason: ${reason || 'No reason provided'}`,
      read: false,
      createdAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('notifications', notificationData);

    res.json({
      message: `User ${approved ? 'approved' : 'rejected'} successfully`,
      data: updateData
    });
  } catch (error) {
    console.error('Error updating user approval:', error);
    res.status(500).json({
      error: 'Failed to update approval status',
      message: error.message
    });
  }
});

// Get users for messaging (role-based access)
router.get('/for-messaging', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const currentUserRole = req.user.role;
    
    // Get all users from Firebase
    const allUsers = await firebaseHelpers.getCollection('users');
    
    // Filter users based on current user role and permissions
    let filteredUsers = [];
    
    if (currentUserRole === 'admin') {
      // Admin can chat with everyone except themselves
      filteredUsers = allUsers.filter(u => u.uid !== currentUserId);
    } else if (currentUserRole === 'customer') {
      // Customers can only chat with approved service providers
      filteredUsers = allUsers.filter(u => 
        ['event_company', 'caterer', 'transport', 'photographer'].includes(u.role) && 
        u.approved &&
        u.uid !== currentUserId
      );
    } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(currentUserRole)) {
      // Service providers can chat with customers, job seekers, and freelancers
      filteredUsers = allUsers.filter(u => 
        ['customer', 'jobseeker', 'freelancer'].includes(u.role) && 
        u.uid !== currentUserId
      );
    } else if (['jobseeker', 'freelancer'].includes(currentUserRole)) {
      // Job seekers and freelancers can only see service providers who have contacted them
      // For now, show all service providers (they can initiate contact)
      filteredUsers = allUsers.filter(u => 
        ['event_company', 'caterer', 'transport', 'photographer'].includes(u.role) && 
        u.approved &&
        u.uid !== currentUserId
      );
    }

    // Format users for frontend
    const formattedUsers = filteredUsers.map(user => ({
      id: user.uid,
      uid: user.uid,
      name: user.name || user.businessName || user.email,
      email: user.email,
      role: user.role,
      picture: user.picture || null,
      businessName: user.businessName,
      approved: user.approved || false,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Get users for messaging error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users for messaging',
      error: error.message
    });
  }
});

// Get user by ID (Admin only)
router.get('/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const userProfile = await firebaseHelpers.getDocument('users', userId);

    if (!userProfile) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile does not exist'
      });
    }

    res.json({
      message: 'User retrieved successfully',
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

module.exports = router;
