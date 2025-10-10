const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Create service
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, price, duration, category, features, images, providerId } = req.body;
    const { uid } = req.user;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, description, price, and category are required'
      });
    }

    const serviceData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      duration: duration || '',
      category: category.trim(),
      features: features || [],
      images: images || [],
      providerId: providerId || uid,
      isActive: true,
      bookings: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await firebaseHelpers.createDocument('services', serviceData);
    const serviceId = result.key;

    res.status(201).json({
      message: 'Service created successfully',
      data: { id: serviceId, ...serviceData }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      error: 'Failed to create service',
      message: error.message
    });
  }
});

// Get services
router.get('/', async (req, res) => {
  try {
    const { providerId, category, limit = 20, page = 1 } = req.query;
    
    let allServices = [];
    let allUsers = [];
    
    try {
      // Get services and users from Firebase
      allServices = await firebaseHelpers.getCollection('services');
      allUsers = await firebaseHelpers.getCollection('users');
    } catch (firebaseError) {
      console.warn('Firebase error, using mock data:', firebaseError.message);
      
      // Fallback to mock data if Firebase is not working
      allServices = [
        {
          id: 'mock-service-1',
          name: 'Premium Wedding Planning',
          description: 'Complete wedding planning and coordination services with premium decorations',
          category: 'wedding',
          price: 75000,
          duration: '1 day',
          location: 'Mumbai, Maharashtra',
          isActive: true,
          features: ['Venue Selection', 'Premium Decoration', 'Photography', 'Catering Coordination'],
          images: ['https://via.placeholder.com/400x300'],
          providerId: 'mock-provider-1',
          bookings: 0,
          rating: 4.8,
          reviews: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-service-2',
          name: 'Corporate Event Management',
          description: 'Professional corporate event planning and execution with AV setup',
          category: 'corporate',
          price: 45000,
          duration: '1 day',
          location: 'Mumbai, Maharashtra',
          isActive: true,
          features: ['Event Planning', 'Audio/Visual Setup', 'Catering', 'Stage Setup'],
          images: ['https://via.placeholder.com/400x300'],
          providerId: 'mock-provider-1',
          bookings: 0,
          rating: 4.6,
          reviews: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-service-3',
          name: 'Birthday Party Celebration',
          description: 'Fun and memorable birthday party planning with themes',
          category: 'birthday',
          price: 20000,
          duration: '4 hours',
          location: 'Mumbai, Maharashtra',
          isActive: true,
          features: ['Theme Decoration', 'Entertainment', 'Cake & Catering', 'Photography'],
          images: ['https://via.placeholder.com/400x300'],
          providerId: 'mock-provider-1',
          bookings: 0,
          rating: 4.9,
          reviews: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      allUsers = [
        {
          uid: 'mock-provider-1',
          role: 'event_company',
          approved: true
        }
      ];
    }
    
    // Filter services to only include those from approved providers
    const approvedProviderIds = allUsers
      .filter(user => user.approved === true && (user.role === 'event_company' || user.role === 'freelancer' || user.role === 'service_provider'))
      .map(user => user.uid);
    
    allServices = allServices.filter(service => 
      approvedProviderIds.includes(service.providerId) && service.isActive === true
    );
    
    // Apply additional filters
    if (providerId) {
      allServices = allServices.filter(service => service.providerId === providerId);
    }
    
    if (category) {
      allServices = allServices.filter(service => service.category === category);
    }
    
    // Sort by createdAt (desc)
    allServices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedServices = allServices.slice(startIndex, endIndex);

    res.json({
      message: 'Services retrieved successfully',
      data: paginatedServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allServices.length
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      error: 'Failed to fetch services',
      message: error.message
    });
  }
});

// Get my services (authenticated user) - MUST be before /:serviceId route
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get all services from Realtime Database
    const allServices = await firebaseHelpers.getCollection('services');
    
    // Filter services by providerId and sort by createdAt (desc)
    const userServices = allServices
      .filter(service => service.providerId === uid)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      message: 'User services retrieved successfully',
      services: userServices
    });
  } catch (error) {
    console.error('Error fetching user services:', error);
    res.status(500).json({
      error: 'Failed to fetch user services',
      message: error.message
    });
  }
});

// Get service categories - MUST be before /:serviceId route
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'Wedding Planning',
      'Corporate Events',
      'Photography',
      'Catering',
      'Transportation',
      'Entertainment',
      'Decoration',
      'Venue Management',
      'Audio/Visual',
      'Security',
      'Other'
    ];

    res.json({
      message: 'Service categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({
      error: 'Failed to fetch service categories',
      message: error.message
    });
  }
});

// Public: Get service schedule (pending/confirmed/in_progress) by serviceId
// This endpoint returns only non-sensitive fields for customers to avoid collisions
router.get('/:serviceId/schedule', async (req, res) => {
  try {
    const { serviceId } = req.params;
    // Try to fetch service to get providerId (may not exist if using mock data)
    const service = await firebaseHelpers.getDocument('services', serviceId).catch(() => null);
    const providerId = service?.providerId;
    const allBookings = await firebaseHelpers.getCollection('bookings');

    // Filter bookings by serviceId or providerId and by active statuses
    const activeStatuses = new Set(['pending', 'confirmed', 'in_progress']);
    const schedule = (allBookings || [])
      .filter(b => (
        // Match exact serviceId or providerId if available
        b.serviceId === serviceId || (providerId && b.providerId === providerId)
      ) && activeStatuses.has(b.status))
      .map(b => ({
        id: b.id,
        status: b.status,
        eventDate: b.eventDate || b.date || null,
        eventTime: b.eventTime || b.time || null,
        location: b.location || null,
        guestCount: b.guestCount || null,
        budget: b.budget || null,
        eventName: b.eventName || b.eventType || null,
        createdAt: b.createdAt || null
      }));

    // Sort by date/time asc
    schedule.sort((a, b) => {
      const da = new Date(`${a.eventDate || ''}T${a.eventTime || '00:00'}`);
      const db = new Date(`${b.eventDate || ''}T${b.eventTime || '00:00'}`);
      return da - db;
    });

    res.json({ message: 'Schedule retrieved successfully', data: schedule });
  } catch (error) {
    console.error('Error fetching service schedule:', error);
    res.status(500).json({ error: 'Failed to fetch service schedule', message: error.message });
  }
});

// Alternate path to avoid conflicts with dynamic routes in some proxies
router.get('/schedule/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await firebaseHelpers.getDocument('services', serviceId).catch(() => null);
    const providerId = service?.providerId;
    const allBookings = await firebaseHelpers.getCollection('bookings');
    const activeStatuses = new Set(['pending', 'confirmed', 'in_progress']);
    const schedule = (allBookings || [])
      .filter(b => (b.serviceId === serviceId || (providerId && b.providerId === providerId)) && activeStatuses.has(b.status))
      .map(b => ({
        id: b.id,
        status: b.status,
        eventDate: b.eventDate || b.date || null,
        eventTime: b.eventTime || b.time || null,
        location: b.location || null,
        guestCount: b.guestCount || null,
        budget: b.budget || null,
        eventName: b.eventName || b.eventType || null,
        createdAt: b.createdAt || null
      }))
      .sort((a, b) => new Date(`${a.eventDate || ''}T${a.eventTime || '00:00'}`) - new Date(`${b.eventDate || ''}T${b.eventTime || '00:00'}`));
    res.json({ message: 'Schedule retrieved successfully', data: schedule });
  } catch (error) {
    console.error('Error fetching service schedule (alt):', error);
    res.status(500).json({ error: 'Failed to fetch service schedule', message: error.message });
  }
});

// Get single service
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await firebaseHelpers.getDocument('services', serviceId);

    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        message: 'Service does not exist'
      });
    }

    res.json({
      message: 'Service retrieved successfully',
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      error: 'Failed to fetch service',
      message: error.message
    });
  }
});

// Update service
router.put('/:serviceId', verifyToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { uid } = req.user;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Check if service exists and belongs to user
    const service = await firebaseHelpers.getDocument('services', serviceId);
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        message: 'Service does not exist'
      });
    }

    if (service.providerId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own services'
      });
    }

    await firebaseHelpers.updateDocument('services', serviceId, updateData);
    const updatedService = await firebaseHelpers.getDocument('services', serviceId);

    res.json({
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      error: 'Failed to update service',
      message: error.message
    });
  }
});

// Delete service
router.delete('/:serviceId', verifyToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { uid } = req.user;

    // Check if service exists and belongs to user
    const service = await firebaseHelpers.getDocument('services', serviceId);
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        message: 'Service does not exist'
      });
    }

    if (service.providerId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own services'
      });
    }

    await firebaseHelpers.deleteDocument('services', serviceId);

    res.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      error: 'Failed to delete service',
      message: error.message
    });
  }
});

// Toggle service status (active/inactive)
router.patch('/:serviceId/status', verifyToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { isActive } = req.body;
    const { uid } = req.user;

    // Check if service exists and belongs to user
    const service = await firebaseHelpers.getDocument('services', serviceId);
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        message: 'Service does not exist'
      });
    }

    if (service.providerId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own services'
      });
    }

    const updateData = {
      isActive: isActive,
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.updateDocument('services', serviceId, updateData);
    const updatedService = await firebaseHelpers.getDocument('services', serviceId);

    res.json({
      message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({
      error: 'Failed to update service status',
      message: error.message
    });
  }
});

// Get all providers with their services (for customer dashboard)
router.get('/providers/all', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    console.log('🔍 Fetching providers from Firebase Realtime Database...');
    
    let allServices = [];
    let allUsers = [];
    
    try {
      // Get data from Firebase Realtime Database
      allServices = await firebaseHelpers.getCollection('services');
      allUsers = await firebaseHelpers.getCollection('users');
      
      console.log(`📊 Found ${allUsers.length} total users in database`);
      console.log(`📊 Found ${allServices.length} total services in database`);
      
      // Filter for service providers (event_company role) - show only approved and active providers
      const serviceProviders = allUsers.filter(user => 
        user.role === 'event_company' && user.isActive !== false && user.approved === true
      );
      
      console.log(`🏢 Found ${serviceProviders.length} approved and active service providers`);
      
      // If we have real providers, use them; otherwise fall back to mock data
      if (serviceProviders.length === 0) {
        console.log('⚠️ No active service providers found, using mock data');
        throw new Error('No service providers found in database');
      }
      
      allUsers = serviceProviders;
      
    } catch (firebaseError) {
      console.warn('Firebase error or no providers found, using mock data:', firebaseError.message);
      
      // Fallback to mock data
      allServices = [
        {
          id: 'mock-service-1',
          name: 'Premium Wedding Planning',
          description: 'Complete wedding planning and coordination services with premium decorations',
          category: 'wedding',
          price: 75000,
          duration: '1 day',
          location: 'Mumbai, Maharashtra',
          isActive: true,
          features: ['Venue Selection', 'Premium Decoration', 'Photography', 'Catering Coordination'],
          images: ['https://via.placeholder.com/400x300'],
          providerId: 'mock-provider-1',
          bookings: 5,
          rating: 4.8,
          reviews: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-service-2',
          name: 'Corporate Event Management',
          description: 'Professional corporate event planning and execution with AV setup',
          category: 'corporate',
          price: 45000,
          duration: '1 day',
          location: 'Mumbai, Maharashtra',
          isActive: true,
          features: ['Event Planning', 'Audio/Visual Setup', 'Catering', 'Stage Setup'],
          images: ['https://via.placeholder.com/400x300'],
          providerId: 'mock-provider-1',
          bookings: 3,
          rating: 4.6,
          reviews: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-service-3',
          name: 'Birthday Party Celebration',
          description: 'Fun and memorable birthday party planning with themes',
          category: 'birthday',
          price: 20000,
          duration: '4 hours',
          location: 'Mumbai, Maharashtra',
          isActive: true,
          features: ['Theme Decoration', 'Entertainment', 'Cake & Catering', 'Photography'],
          images: ['https://via.placeholder.com/400x300'],
          providerId: 'mock-provider-1',
          bookings: 8,
          rating: 4.9,
          reviews: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      allUsers = [
        {
          uid: 'mock-provider-1',
          id: 'mock-provider-1',
          email: 'provider@test.com',
          name: 'Amazing Events Co.',
          businessName: 'Amazing Events Co.',
          picture: 'https://via.placeholder.com/150',
          phone: '+91 9876543210',
          role: 'event_company',
          approved: true,
          location: 'Mumbai, Maharashtra',
          serviceAreas: ['Mumbai', 'Pune', 'Thane'],
          categories: ['wedding', 'corporate', 'birthday'],
          specialties: ['Event Planning', 'Decoration', 'Catering'],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ];
    }
    
    const activeServices = allServices.filter(service => service.isActive === true);
    
    // Group services by provider AND include all approved providers even without services
    const providersMap = new Map();
    
    // First, add all approved service providers to the map
    allUsers.forEach(user => {
      if (user.role === 'event_company' && user.approved === true && user.isActive !== false) {
        providersMap.set(user.uid, {
          id: user.uid,
          uid: user.uid,
          name: user.name || user.businessName || `Provider ${user.uid.substring(0, 8)}`,
          businessName: user.businessName || user.name || `Provider ${user.uid.substring(0, 8)}`,
          email: user.email || '',
          phone: user.phone || '',
          location: user.location || '',
          picture: user.picture || user.profilePicture || '',
          role: user.role || 'service_provider',
          serviceAreas: user.serviceAreas || [],
          categories: user.categories || [],
          specialties: user.specialties || [],
          rating: 0,
          totalServices: 0,
          totalBookings: 0,
          services: [],
          createdAt: user.createdAt || new Date().toISOString(),
          lastLogin: user.lastLogin
        });
      }
    });
    
    // Then, add services to existing providers
    activeServices.forEach(service => {
      const providerId = service.providerId;
      
      if (providersMap.has(providerId)) {
        const providerData = providersMap.get(providerId);
        providerData.services.push(service);
        providerData.totalServices = providerData.services.length;
        providerData.totalBookings += service.bookings || 0;
        
        // Calculate average rating from services
        const totalRating = providerData.services.reduce((sum, s) => sum + (s.rating || 0), 0);
        providerData.rating = providerData.services.length > 0 ? totalRating / providerData.services.length : 0;
      }
    });
    
    // Convert map to array and sort by total services (providers with services first, then by name)
    let providers = Array.from(providersMap.values());
    providers.sort((a, b) => {
      if (a.totalServices !== b.totalServices) {
        return b.totalServices - a.totalServices; // Sort by service count first
      }
      return a.name.localeCompare(b.name); // Then by name alphabetically
    });
    
    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProviders = providers.slice(startIndex, endIndex);

    res.json({
      message: 'Providers retrieved successfully',
      data: paginatedProviders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: providers.length
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      error: 'Failed to fetch providers',
      message: error.message
    });
  }
});

// Get single provider with their services
router.get('/providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // Get provider information
    const provider = await firebaseHelpers.getDocument('users', providerId);
    if (!provider) {
      return res.status(404).json({
        error: 'Provider not found',
        message: 'Provider does not exist'
      });
    }

    if (!provider.approved) {
      return res.status(404).json({
        error: 'Provider not available',
        message: 'Provider is not approved'
      });
    }
    
    // Get provider's active services
    const allServices = await firebaseHelpers.getCollection('services');
    const providerServices = allServices
      .filter(service => service.providerId === providerId && service.isActive === true)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Calculate provider stats
    const totalBookings = providerServices.reduce((sum, service) => sum + (service.bookings || 0), 0);
    const totalRating = providerServices.reduce((sum, service) => sum + (service.rating || 0), 0);
    const averageRating = providerServices.length > 0 ? totalRating / providerServices.length : 0;
    
    const providerData = {
      id: provider.uid,
      uid: provider.uid,
      name: provider.name || provider.businessName || 'Unknown Provider',
      businessName: provider.businessName || provider.name,
      email: provider.email,
      phone: provider.phone || '',
      location: provider.location || '',
      picture: provider.picture || provider.profilePicture || '',
      role: provider.role,
      serviceAreas: provider.serviceAreas || [],
      categories: provider.categories || [],
      specialties: provider.specialties || [],
      rating: averageRating,
      totalServices: providerServices.length,
      totalBookings: totalBookings,
      services: providerServices,
      createdAt: provider.createdAt,
      lastLogin: provider.lastLogin
    };

    res.json({
      message: 'Provider retrieved successfully',
      data: providerData
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({
      error: 'Failed to fetch provider',
      message: error.message
    });
  }
});

module.exports = router;
