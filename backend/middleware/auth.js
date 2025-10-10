const { auth } = require('../config/firebase');

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

// Middleware to check user role
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      // Get user role from Realtime Database
      const { firebaseHelpers } = require('../config/firebase');
      console.log('Getting user document for UID:', req.user.uid);
      const userDoc = await firebaseHelpers.getDocument('users', req.user.uid);
      console.log('User document:', userDoc);
      
      if (!userDoc) {
        console.log('User document not found');
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      const userRole = userDoc.role;
      console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
      
      if (!allowedRoles.includes(userRole)) {
        console.log('Role check failed');
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      console.log('Role check passed');

      req.userRole = userRole;
      req.userProfile = userDoc;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify user role'
      });
    }
  };
};

// Middleware to check if user is approved (for service providers)
const checkApproval = async (req, res, next) => {
  try {
    if (!req.userProfile) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User profile not found'
      });
    }

    // Check if user is a service provider and if they're approved
    const serviceProviderRoles = ['event_company', 'caterer', 'transport', 'photographer', 'freelancer'];
    
    if (serviceProviderRoles.includes(req.userRole)) {
      if (!req.userProfile.approved) {
        return res.status(403).json({
          error: 'Account not approved',
          message: 'Your account is pending admin approval'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Approval check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify account approval'
    });
  }
};

// Middleware to check admin role
const requireAdmin = checkRole(['admin']);

// Middleware to check service provider roles
const requireServiceProvider = checkRole(['event_company', 'caterer', 'transport', 'photographer', 'freelancer']);

// Middleware to check customer role
const requireCustomer = (req, res, next) => {
  console.log('Checking customer role...');
  console.log('User:', req.user);
  return checkRole(['customer'])(req, res, next);
};

module.exports = {
  verifyToken,
  checkRole,
  checkApproval,
  requireAdmin,
  requireServiceProvider,
  requireCustomer
};
