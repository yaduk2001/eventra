const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole, requireCustomer, requireServiceProvider } = require('../middleware/auth');

// Create a direct booking (Customer only)
router.post('/book-now', verifyToken, requireCustomer, async (req, res) => {
  try {
    console.log('Direct booking creation started');
    console.log('User:', req.user);
    console.log('Request body:', req.body);

    const {
      serviceId,
      providerId,
      eventDate,
      location,
      budget,
      guestCount,
      requirements,
      eventName,
      eventType
    } = req.body;

    if (!serviceId || !providerId || !eventDate || !location || !budget) {
      console.log('Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Service ID, provider ID, event date, location, and budget are required'
      });
    }

    // Get service details to include in booking
    let serviceDetails = {};
    try {
      const service = await firebaseHelpers.getDocument('services', serviceId);
      if (service) {
        serviceDetails = {
          serviceName: service.name,
          serviceDescription: service.description,
          serviceCategory: service.category
        };
      }
    } catch (serviceError) {
      console.warn('Could not fetch service details:', serviceError);
    }

    // Get provider details
    let providerDetails = {};
    try {
      const provider = await firebaseHelpers.getDocument('users', providerId);
      if (provider) {
        providerDetails = {
          providerName: provider.name,
          providerRole: provider.role
        };
      }
    } catch (providerError) {
      console.warn('Could not fetch provider details:', providerError);
    }

    // Collision validation: forbid if another active booking exists same date/time for this service/provider
    try {
      const allBookings = await firebaseHelpers.getCollection('bookings');
      const normalizeTime = (t) => (t && t.length >= 4 ? t.slice(0, 5) : '');
      const desiredDate = eventDate;
      const desiredTime = normalizeTime(req.body.eventTime || '');
      const active = new Set(['pending', 'confirmed', 'in_progress']);
      const conflict = (allBookings || []).some(b => {
        if (!active.has(b.status)) return false;
        const sameService = b.serviceId === serviceId || b.providerId === providerId;
        if (!sameService) return false;
        const bDate = b.eventDate || b.date;
        const bTime = normalizeTime(b.eventTime || b.time || '');
        if (!bDate) return false;
        if (!desiredTime && !bTime) return bDate === desiredDate; // whole-day collision
        return bDate === desiredDate && bTime === desiredTime;
      });
      if (conflict) {
        return res.status(409).json({
          error: 'CONFLICT',
          message: 'Selected date/time is already booked or pending for this service/provider.'
        });
      }
    } catch (vErr) {
      console.warn('Collision validation failed open-loop:', vErr);
      // Continue, but server will still create booking if cannot validate; alternatively, fail safe
    }

    const bookingData = {
      customerId: req.user.uid,
      customerName: req.user.name,
      providerId,
      serviceId,
      eventName: eventName || serviceDetails.serviceName || 'Event',
      eventType: eventType || serviceDetails.serviceCategory || 'Other',
      eventDate,
      eventTime: req.body.eventTime || null,
      location,
      budget: parseFloat(budget),
      guestCount: parseInt(guestCount) || 0,
      requirements: requirements || '',
      price: parseFloat(budget), // For direct booking, price = budget
      status: 'pending', // Direct bookings start as pending, require provider acceptance
      ...serviceDetails,
      ...providerDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating direct booking document...');
    const booking = await firebaseHelpers.createDocument('bookings', bookingData);
    console.log('Direct booking created:', booking);

    // Notify provider about the new pending booking
    await createNotification(providerId, {
      type: 'new_booking_request',
      title: 'New Booking Request!',
      message: `${req.user.name} wants to book your service for ${bookingData.eventDate}. Please accept or decline.`,
      data: { bookingId: booking.id, serviceId, customerId: req.user.uid }
    });

    console.log('Sending success response');
    res.status(201).json({
      message: 'Booking request sent successfully. Waiting for provider confirmation.',
      data: { id: booking.id, ...bookingData }
    });
  } catch (error) {
    console.error('Error creating direct booking:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// Accept/Decline a pending booking (Service Providers only)
router.patch('/bookings/:bookingId/status', verifyToken, requireServiceProvider, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body; // status: 'accepted' or 'declined'

    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be either "accepted" or "declined"'
      });
    }

    // Get the booking
    const booking = await firebaseHelpers.getDocument('bookings', bookingId);
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The requested booking does not exist'
      });
    }

    // Verify this booking belongs to the current provider
    if (booking.providerId !== req.user.uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only manage your own bookings'
      });
    }

    // Verify booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid booking status',
        message: 'Only pending bookings can be accepted or declined'
      });
    }

    // Update booking status
    const updateData = {
      status: status === 'accepted' ? 'confirmed' : 'declined',
      updatedAt: new Date().toISOString()
    };

    if (notes) {
      updateData.providerNotes = notes;
    }

    await firebaseHelpers.updateDocument('bookings', bookingId, updateData);

    // Notify customer about the decision
    await createNotification(booking.customerId, {
      type: status === 'accepted' ? 'booking_accepted' : 'booking_declined',
      title: status === 'accepted' ? 'Booking Confirmed!' : 'Booking Declined',
      message: status === 'accepted'
        ? `Your booking for ${booking.eventName} has been confirmed by the provider.`
        : `Your booking for ${booking.eventName} has been declined by the provider.`,
      data: { bookingId, providerId: req.user.uid }
    });

    res.json({
      message: `Booking ${status} successfully`,
      data: { bookingId, status: updateData.status }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      error: 'Failed to update booking status',
      message: error.message
    });
  }
});

// Create a bid request (Customer only)
router.post('/bid-request', verifyToken, requireCustomer, async (req, res) => {
  try {
    console.log('Bid request creation started');
    console.log('User:', req.user);
    console.log('User role:', req.userRole);
    console.log('Request body:', req.body);

    const {
      eventName,
      eventType,
      eventDate,
      location,
      budget,
      guestCount,
      requirements,
      servicesNeeded,
      preferredCategories,
      needWholeTeam
    } = req.body;

    if (!eventName || !eventType || !eventDate || !location) {
      console.log('Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Event name, type, date, and location are required'
      });
    }

    const bidRequestData = {
      customerId: req.user.uid,
      customerName: req.user.name,
      eventName,
      eventType,
      eventDate,
      location,
      budget: budget ? parseFloat(budget) : null,
      guestCount: parseInt(guestCount) || 0,
      requirements: requirements || '',
      servicesNeeded: servicesNeeded || [],
      preferredCategories: preferredCategories || [],
      needWholeTeam: needWholeTeam || false,
      status: 'open', // open, closed, awarded
      bids: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating bid request document...');
    const bidRequest = await firebaseHelpers.createDocument('bidRequests', bidRequestData);
    console.log('Bid request created:', bidRequest);

    // Notify relevant service providers
    console.log('Notifying relevant providers...');
    await notifyRelevantProviders(bidRequestData, bidRequest.id);
    console.log('Providers notified');

    // If this event is targeted to freelancers, also create a freelancer-visible job posting
    try {
      if (!bidRequestData.needWholeTeam) {
        const jobData = {
          providerId: req.user.uid, // customer posting the opportunity; no specific provider yet
          title: bidRequestData.eventName || `${bidRequestData.eventType} Event`,
          description: bidRequestData.requirements || `${bidRequestData.eventType} event on ${bidRequestData.eventDate}`,
          category: bidRequestData.eventType || 'other',
          location: bidRequestData.location,
          hourlyRate: null,
          duration: 'Per event',
          requirements: [],
          startDate: bidRequestData.eventDate,
          endDate: null,
          status: 'active',
          // Link back to the bid request so we can correlate
          bidRequestId: bidRequest.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await firebaseHelpers.createDocument('job_postings', jobData);
        console.log('Created freelancer job_postings entry linked to bid request:', bidRequest.id);
      }
    } catch (jobErr) {
      console.error('Failed to create freelancer job posting from bid request:', jobErr);
      // Do not fail the main request for this non-critical path
    }

    console.log('Sending success response');
    res.status(201).json({
      message: 'Bid request created successfully',
      data: { id: bidRequest.id, ...bidRequestData }
    });
  } catch (error) {
    console.error('Error creating bid request:', error);
    res.status(500).json({
      error: 'Failed to create bid request',
      message: error.message
    });
  }
});

// Submit a bid (Service Providers only)
router.post('/bid-request/:requestId/bid', verifyToken, requireServiceProvider, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { price, description, estimatedTime, additionalServices } = req.body;

    if (!price || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Price and description are required'
      });
    }

    // Get the bid request
    const bidRequest = await firebaseHelpers.getDocument('bidRequests', requestId);
    if (!bidRequest) {
      return res.status(404).json({
        error: 'Bid request not found',
        message: 'The requested bid does not exist'
      });
    }

    if (bidRequest.status !== 'open') {
      return res.status(400).json({
        error: 'Bid request closed',
        message: 'This bid request is no longer accepting bids'
      });
    }

    // Check if provider already submitted a bid
    const existingBid = (bidRequest.bids || []).find(bid => bid.providerId === req.user.uid);
    if (existingBid) {
      return res.status(400).json({
        error: 'Bid already submitted',
        message: 'You have already submitted a bid for this request'
      });
    }

    const bidData = {
      bidId: `${req.user.uid}-${Date.now()}`,
      providerId: req.user.uid,
      providerName: req.user.name,
      providerRole: req.userRole,
      price: parseFloat(price),
      description,
      estimatedTime: estimatedTime || '',
      additionalServices: additionalServices || [],
      status: 'pending', // pending, accepted, rejected
      submittedAt: new Date().toISOString()
    };

    // Add bid to the request
    const updatedBids = [...(bidRequest.bids || []), bidData];
    await firebaseHelpers.updateDocument('bidRequests', requestId, {
      bids: updatedBids,
      updatedAt: new Date().toISOString()
    });

    // Notify customer about new bid
    await createNotification(bidRequest.customerId, {
      type: 'new_bid',
      title: 'New Bid Received',
      message: `${req.user.name} submitted a bid for your ${bidRequest.eventType} event`,
      data: { bidRequestId: requestId, bidId: bidData.bidId, providerId: bidData.providerId }
    });

    res.status(201).json({
      message: 'Bid submitted successfully',
      data: bidData
    });
  } catch (error) {
    console.error('Error submitting bid:', error);
    res.status(500).json({
      error: 'Failed to submit bid',
      message: error.message
    });
  }
});

// Accept/Reject a bid (Customer only)
router.patch('/bid-request/:requestId/bid/:bidId', verifyToken, requireCustomer, async (req, res) => {
  try {
    const { requestId, bidId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Action must be either "accept" or "reject"'
      });
    }

    const bidRequest = await firebaseHelpers.getDocument('bidRequests', requestId);
    if (!bidRequest) {
      return res.status(404).json({
        error: 'Bid request not found',
        message: 'The requested bid does not exist'
      });
    }

    if (bidRequest.customerId !== req.user.uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only manage your own bid requests'
      });
    }

    const bidIndex = (bidRequest.bids || []).findIndex(bid => bid.bidId === bidId || bid.providerId === bidId);
    if (bidIndex === -1) {
      return res.status(404).json({
        error: 'Bid not found',
        message: 'The specified bid does not exist'
      });
    }

    // Update bid status
    const updatedBids = [...bidRequest.bids];
    updatedBids[bidIndex].status = action === 'accept' ? 'accepted' : 'rejected';
    updatedBids[bidIndex].updatedAt = new Date().toISOString();

    // If accepting, reject all other bids and close the request
    if (action === 'accept') {
      updatedBids.forEach((bid, index) => {
        if (index !== bidIndex && bid.status === 'pending') {
          bid.status = 'rejected';
          bid.updatedAt = new Date().toISOString();
        }
      });

      // Create booking
      const bookingData = {
        customerId: bidRequest.customerId,
        providerId: updatedBids[bidIndex].providerId,
        bidRequestId: requestId,
        eventType: bidRequest.eventType,
        eventDate: bidRequest.eventDate,
        location: bidRequest.location,
        budget: bidRequest.budget,
        guestCount: bidRequest.guestCount,
        requirements: bidRequest.requirements,
        price: updatedBids[bidIndex].price,
        status: 'confirmed', // confirmed, in_progress, completed, cancelled
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseHelpers.createDocument('bookings', bookingData);

      // Notify provider about acceptance
      await createNotification(updatedBids[bidIndex].providerId, {
        type: 'bid_accepted',
        title: 'Bid Accepted!',
        message: `Your bid for ${bidRequest.eventType} event has been accepted`,
        data: { bookingId: bookingData.id, bidRequestId: requestId, bidId: updatedBids[bidIndex].bidId }
      });
    } else {
      // Notify provider about rejection
      await createNotification(updatedBids[bidIndex].providerId, {
        type: 'bid_rejected',
        title: 'Bid Rejected',
        message: `Your bid for ${bidRequest.eventType} event was not selected`,
        data: { bidRequestId: requestId, bidId: updatedBids[bidIndex].bidId }
      });
    }

    // Update bid request
    await firebaseHelpers.updateDocument('bidRequests', requestId, {
      bids: updatedBids,
      status: action === 'accept' ? 'awarded' : bidRequest.status,
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: `Bid ${action}ed successfully`,
      data: updatedBids[bidIndex]
    });
  } catch (error) {
    console.error('Error updating bid:', error);
    res.status(500).json({
      error: 'Failed to update bid',
      message: error.message
    });
  }
});

// Get bid requests (Service Providers)
router.get('/bid-requests', verifyToken, requireServiceProvider, async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;

    // Get all bid requests and filter
    const allBidRequests = await firebaseHelpers.getCollection('bidRequests');

    let bidRequests = allBidRequests.filter(request => {
      if (status && request.status !== status) return false;
      return true;
    });

    // Sort by createdAt desc
    bidRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRequests = bidRequests.slice(startIndex, startIndex + parseInt(limit));

    // Remove bids from response to avoid data leakage
    const sanitizedRequests = paginatedRequests.map(request => {
      const { bids, ...sanitized } = request;
      return sanitized;
    });

    res.json({
      message: 'Bid requests retrieved successfully',
      data: sanitizedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: bidRequests.length
      }
    });
  } catch (error) {
    console.error('Error fetching bid requests:', error);
    res.status(500).json({
      error: 'Failed to fetch bid requests',
      message: error.message
    });
  }
});

// Get provider's bid requests (for provider dashboard)
router.get('/provider-bid-requests', verifyToken, requireServiceProvider, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Get all bid requests
    const allBidRequests = await firebaseHelpers.getCollection('bidRequests');

    // Filter bid requests that are relevant to this provider or have bids from this provider
    let bidRequests = allBidRequests.filter(request => {
      // Include all open requests (potential opportunities)
      if (request.status === 'open') return true;

      // Include requests where this provider has submitted a bid
      const providerBid = request.bids?.find(bid => bid.providerId === req.user.uid);
      if (providerBid) return true;

      return false;
    });

    // Filter by status if provided
    if (status) {
      bidRequests = bidRequests.filter(request => request.status === status);
    }

    // Sort by createdAt desc
    bidRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRequests = bidRequests.slice(startIndex, startIndex + parseInt(limit));

    // Add provider-specific information to each request
    const enrichedRequests = paginatedRequests.map(request => {
      const providerBid = request.bids?.find(bid => bid.providerId === req.user.uid);
      return {
        ...request,
        providerBid: providerBid || null,
        hasProviderBid: !!providerBid,
        bidCount: request.bids?.length || 0
      };
    });

    res.json({
      message: 'Provider bid requests retrieved successfully',
      data: enrichedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: bidRequests.length
      }
    });
  } catch (error) {
    console.error('Error fetching provider bid requests:', error);
    res.status(500).json({
      error: 'Failed to fetch provider bid requests',
      message: error.message
    });
  }
});

// Get customer's bid requests
router.get('/my-bid-requests', verifyToken, requireCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Get all bid requests and filter by customer
    const allBidRequests = await firebaseHelpers.getCollection('bidRequests');

    let bidRequests = allBidRequests.filter(request => {
      if (request.customerId !== req.user.uid) return false;
      if (status && request.status !== status) return false;
      return true;
    });

    // Sort by createdAt desc
    bidRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRequests = bidRequests.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      message: 'Bid requests retrieved successfully',
      data: paginatedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: bidRequests.length
      }
    });
  } catch (error) {
    console.error('Error fetching bid requests:', error);
    res.status(500).json({
      error: 'Failed to fetch bid requests',
      message: error.message
    });
  }
});

// Get bookings
router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { uid, role } = req.user;

    // Get all bookings and filter
    const allBookings = await firebaseHelpers.getCollection('bookings');

    let bookings = allBookings.filter(booking => {
      // Filter by user role
      if (role === 'customer' && booking.customerId !== uid) return false;
      if (role !== 'customer' && booking.providerId !== uid) return false;

      // Filter by status if provided
      if (status && booking.status !== status) return false;

      return true;
    });

    // Sort by createdAt desc
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBookings = bookings.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      message: 'Bookings retrieved successfully',
      data: paginatedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: bookings.length
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// Update booking status
router.patch('/bookings/:bookingId/status', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await firebaseHelpers.getDocument('bookings', bookingId);
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      });
    }

    // Check if user is authorized to update this booking
    const { uid, role } = req.user;
    if (role === 'customer' && booking.customerId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own bookings'
      });
    }
    if (role !== 'customer' && booking.providerId !== uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own bookings'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    await firebaseHelpers.updateDocument('bookings', bookingId, updateData);

    // Notify the other party about status change
    const notifyUserId = role === 'customer' ? booking.providerId : booking.customerId;
    await createNotification(notifyUserId, {
      type: 'booking_status_update',
      title: 'Booking Status Updated',
      message: `Booking status changed to ${status}`,
      data: { bookingId, status }
    });

    res.json({
      message: 'Booking status updated successfully',
      data: { ...booking, ...updateData }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      error: 'Failed to update booking status',
      message: error.message
    });
  }
});

// Delete a bid request (Customer only)
router.delete('/bid-request/:requestId', verifyToken, requireCustomer, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get the bid request
    const bidRequest = await firebaseHelpers.getDocument('bidRequests', requestId);
    if (!bidRequest) {
      return res.status(404).json({
        error: 'Bid request not found',
        message: 'The requested bid does not exist'
      });
    }

    // Check if user owns this bid request
    if (bidRequest.customerId !== req.user.uid) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own bid requests'
      });
    }

    // Check if bid request has any bids
    const hasBids = bidRequest.bids && bidRequest.bids.length > 0;

    // If there are bids, check if any are accepted
    const hasAcceptedBids = hasBids && bidRequest.bids.some(bid => bid.status === 'accepted');

    if (hasAcceptedBids) {
      return res.status(400).json({
        error: 'Cannot delete bid request',
        message: 'Cannot delete a bid request with accepted bids. Please contact support if you need to cancel.'
      });
    }

    // Delete the bid request
    await firebaseHelpers.deleteDocument('bidRequests', requestId);

    // If there were pending bids, notify providers about deletion
    if (hasBids) {
      const pendingBids = bidRequest.bids.filter(bid => bid.status === 'pending');
      for (const bid of pendingBids) {
        await createNotification(bid.providerId, {
          type: 'bid_request_deleted',
          title: 'Event Request Cancelled',
          message: `The ${bidRequest.eventType} event request you bid on has been cancelled by the customer`,
          data: { bidRequestId: requestId }
        });
      }
    }

    res.json({
      message: 'Bid request deleted successfully',
      data: { id: requestId }
    });
  } catch (error) {
    console.error('Error deleting bid request:', error);
    res.status(500).json({
      error: 'Failed to delete bid request',
      message: error.message
    });
  }
});

// Helper function to notify relevant service providers
async function notifyRelevantProviders(bidRequestData, requestId) {
  try {
    const { eventType, preferredCategories, servicesNeeded, needWholeTeam } = bidRequestData;

    // Determine which provider types to notify based on needWholeTeam flag
    let targetRoles;
    if (needWholeTeam) {
      // Notify service providers (companies)
      targetRoles = ['event_company', 'caterer', 'transport', 'photographer'];
    } else {
      // Notify freelancers only
      targetRoles = ['freelancer'];
    }

    // Get service providers that match the criteria
    let query = firebaseHelpers.firestore.collection('users')
      .where('approved', '==', true)
      .where('role', 'in', targetRoles);

    const snapshot = await query.get();
    const providers = [];

    snapshot.forEach(doc => {
      const provider = { id: doc.id, ...doc.data() };

      // Check if provider matches the criteria
      if (needWholeTeam) {
        // For service providers, check if they handle this event type
        if (provider.role === 'event_company') {
          if (provider.categories && provider.categories.includes(eventType)) {
            providers.push(provider);
          }
        } else if (servicesNeeded.includes(provider.role)) {
          providers.push(provider);
        } else {
          // Include all service providers for whole team requests
          providers.push(provider);
        }
      } else {
        // For freelancers, include all approved freelancers
        if (provider.role === 'freelancer') {
          providers.push(provider);
        }
      }
    });

    // Create notifications for matching providers
    const notificationType = needWholeTeam ? 'service providers' : 'freelancers';
    const notifications = providers.map(provider => ({
      userId: provider.id,
      type: 'new_bid_request',
      title: 'New Event Request Available',
      message: `New ${eventType} event request available for ${notificationType}`,
      data: { bidRequestId: requestId },
      read: false,
      createdAt: new Date().toISOString()
    }));

    // Batch create notifications
    const batch = firebaseHelpers.firestore.batch();
    notifications.forEach(notification => {
      const docRef = firebaseHelpers.firestore.collection('notifications').doc();
      batch.set(docRef, notification);
    });

    await batch.commit();

    console.log(`Notified ${providers.length} ${notificationType} about new event request`);
  } catch (error) {
    console.error('Error notifying providers:', error);
  }
}



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
