// API utility functions for connecting to the backend
import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get Firebase ID token for authentication (unless skipAuth is true)
    let authHeader = {};
    if (!options.skipAuth && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        authHeader = { Authorization: `Bearer ${token}` };
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }

    // Remove skipAuth from options before sending request
    const { skipAuth, ...requestOptions } = options;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...requestOptions.headers,
      },
      ...requestOptions,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please make sure the backend is running on http://localhost:5000');
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// API functions
export const api = {
  // Health check
  health: () => apiClient.get('/health'),
  
  // Firebase status
  firebaseStatus: () => apiClient.get('/firebase/status'),
  
  // User management
  createUserProfile: (role, profileData, uid, email, name, picture) => apiClient.post('/users/register', { uid, email, name, picture, role, profileData }),
  getUserProfile: () => apiClient.get('/users/profile'),
  updateUserProfile: (profileData) => apiClient.put('/users/profile', profileData),
  uploadProfilePicture: (formData) => apiClient.post('/users/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Bid requests and bookings
  createBidRequest: (bidData) => apiClient.post('/bookings/bid-request', bidData),
  getBidRequests: (params) => apiClient.get('/bookings/bid-requests', { params }),
  getProviderBidRequests: (params) => apiClient.get('/bookings/provider-bid-requests', { params }),
  getMyBidRequests: (params) => apiClient.get('/bookings/my-bid-requests', { params }),
  deleteBidRequest: (requestId) => apiClient.delete(`/bookings/bid-request/${requestId}`),
  submitBid: (requestId, bidData) => apiClient.post(`/bookings/bid-request/${requestId}/bid`, bidData),
  acceptBid: (requestId, bidId) => apiClient.patch(`/bookings/bid-request/${requestId}/bid/${bidId}`, { action: 'accept' }),
  rejectBid: (requestId, bidId) => apiClient.patch(`/bookings/bid-request/${requestId}/bid/${bidId}`, { action: 'reject' }),
  getBookings: (params) => apiClient.get('/bookings/bookings', { params }),
  updateBookingStatus: (bookingId, status, notes) => apiClient.patch(`/bookings/bookings/${bookingId}/status`, { status, notes }),
  bookNow: (bookingData) => apiClient.post('/bookings/book-now', bookingData),
  acceptBooking: (bookingId, notes) => apiClient.patch(`/bookings/bookings/${bookingId}/status`, { status: 'accepted', notes }),
  declineBooking: (bookingId, notes) => apiClient.patch(`/bookings/bookings/${bookingId}/status`, { status: 'declined', notes }),
  
  // Portfolio management
  uploadPortfolio: (formData) => apiClient.post('/portfolio/upload', formData),
  getPortfolio: (params) => apiClient.get('/portfolio', { params }),
  getMyPortfolio: (params) => apiClient.get('/portfolio/my-portfolio', { params }),
  likePortfolio: (portfolioId) => apiClient.post(`/portfolio/${portfolioId}/like`),
  commentPortfolio: (portfolioId, comment) => apiClient.post(`/portfolio/${portfolioId}/comment`, { comment }),
  deletePortfolio: (portfolioId) => apiClient.delete(`/portfolio/${portfolioId}`),
  getPortfolioStats: (providerId) => apiClient.get(`/portfolio/${providerId}/stats`),
  
  // Notifications
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markNotificationRead: (notificationId) => apiClient.patch(`/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => apiClient.patch('/notifications/mark-all-read'),
  deleteNotification: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
  getNotificationCount: () => apiClient.get('/notifications/count'),
  
  // Admin functions
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getPendingApprovals: (params) => apiClient.get('/admin/pending-approvals', { params }),
  getAdminUsers: (params) => apiClient.get('/admin/users', { params }),
  getAdminUserById: (userId) => apiClient.get(`/users/${userId}`),
  approveUser: (userId, reason) => apiClient.patch(`/users/${userId}/approval`, { approved: true, reason }),
  rejectUser: (userId, reason) => apiClient.patch(`/users/${userId}/approval`, { approved: false, reason }),
  getAdminBookings: (params) => apiClient.get('/admin/bookings', { params }),
  getAdminBidRequests: (params) => apiClient.get('/admin/bid-requests', { params }),
  getReportedContent: (params) => apiClient.get('/admin/reported-content', { params }),
  handleReport: (reportId, action, reason) => apiClient.patch(`/admin/reports/${reportId}`, { action, reason }),
  getAnalytics: (period) => apiClient.get('/admin/analytics', { params: { period } }),
  
  // Chat functionality
  createChatRoom: (participantId, type) => apiClient.post('/chat/room', { participantId, type }),
  sendMessage: (roomId, content, type, mediaUrl) => apiClient.post('/chat/message', { roomId, content, type, mediaUrl }),
  getChatHistory: (roomId, page, limit) => apiClient.get(`/chat/room/${roomId}/messages`, { params: { page, limit } }),
  getChatRooms: (page, limit) => apiClient.get('/chat/rooms', { params: { page, limit } }),
  markMessagesRead: (roomId) => apiClient.patch(`/chat/room/${roomId}/read`),
  getOnlineUsers: () => apiClient.get('/chat/online-users'),

  // Calling functionality
  initiateCall: (recipientId, type) => apiClient.post('/calling/initiate', { recipientId, type }),
  acceptCall: (callId) => apiClient.post(`/calling/accept/${callId}`),
  rejectCall: (callId, reason) => apiClient.post(`/calling/reject/${callId}`, { reason }),
  endCall: (callId) => apiClient.post(`/calling/end/${callId}`),
  getCallHistory: (page, limit, type, status) => apiClient.get('/calling/history', { params: { page, limit, type, status } }),
  getWebRTCConfig: () => apiClient.get('/calling/webrtc-config'),
  getCallStats: (period) => apiClient.get('/calling/stats', { params: { period } }),

  // Social feed functionality
  createPost: (content, media, type, tags, location) => apiClient.post('/social/post', { content, media, type, tags, location }),
  getFeed: (page, limit, type, userId) => apiClient.get('/social/feed', { params: { page, limit, type, userId } }),
  likePost: (postId) => apiClient.post(`/social/post/${postId}/like`),
  commentPost: (postId, content) => apiClient.post(`/social/post/${postId}/comment`, { content }),
  sharePost: (postId) => apiClient.post(`/social/post/${postId}/share`),
  getUserPosts: (userId, page, limit) => apiClient.get(`/social/user/${userId}/posts`, { params: { page, limit } }),
  deletePost: (postId) => apiClient.delete(`/social/post/${postId}`),
  getTrendingPosts: (period) => apiClient.get('/social/trending', { params: { period } }),
  searchPosts: (query, type, tags, page, limit) => apiClient.get('/social/search', { params: { query, type, tags, page, limit } }),

  // Legacy events (for backward compatibility)
  getEvents: () => apiClient.get('/events'),
  getEvent: (id) => apiClient.get(`/events/${id}`),
  createEvent: (eventData) => apiClient.post('/events', eventData),
  updateEvent: (id, eventData) => apiClient.put(`/events/${id}`, eventData),
  deleteEvent: (id) => apiClient.delete(`/events/${id}`),

  // Testimonials API
  testimonials: {
    createTestimonial: (testimonialData) => apiClient.post('/testimonials', testimonialData),
    getTestimonials: (limit = 10, featured = false) => apiClient.get(`/testimonials?limit=${limit}&featured=${featured}`),
    getMyTestimonials: () => apiClient.get('/testimonials/my'),
    updateTestimonial: (testimonialId, updateData) => apiClient.put(`/testimonials/${testimonialId}`, updateData),
    deleteTestimonial: (testimonialId) => apiClient.delete(`/testimonials/${testimonialId}`),
    approveTestimonial: (testimonialId, approved, featured = false) => apiClient.patch(`/testimonials/${testimonialId}/approval`, { approved, featured }),
    getAllTestimonials: (status = 'all', limit = 20, page = 1) => apiClient.get(`/testimonials/admin/all?status=${status}&limit=${limit}&page=${page}`)
  },

  // Services API
  services: {
    createService: (serviceData) => apiClient.post('/services', serviceData),
    getServices: (providerId = null, category = null, limit = 20, page = 1) => {
      const params = new URLSearchParams();
      if (providerId) params.append('providerId', providerId);
      if (category) params.append('category', category);
      params.append('limit', limit);
      params.append('page', page);
      return apiClient.request(`/services?${params.toString()}`, { 
        method: 'GET',
        skipAuth: true 
      });
    },
    getService: (serviceId) => apiClient.request(`/services/${serviceId}`, { 
      method: 'GET',
      skipAuth: true 
    }),
    getServiceSchedule: (serviceId) => apiClient.request(`/services/${serviceId}/schedule`, {
      method: 'GET',
      skipAuth: true
    }),
    getServiceScheduleAlt: (serviceId) => apiClient.request(`/services/schedule/${serviceId}`, {
      method: 'GET',
      skipAuth: true
    }),
    updateService: (serviceId, updateData) => apiClient.put(`/services/${serviceId}`, updateData),
    deleteService: (serviceId) => apiClient.delete(`/services/${serviceId}`),
    getMyServices: () => apiClient.get('/services/my'),
    toggleServiceStatus: (serviceId, isActive) => apiClient.patch(`/services/${serviceId}/status`, { isActive }),
    getCategories: () => apiClient.request('/services/categories/list', { 
      method: 'GET',
      skipAuth: true 
    }),
    // Provider endpoints - these are public endpoints, no auth required
    getAllProviders: (limit = 20, page = 1) => apiClient.request(`/services/providers/all?limit=${limit}&page=${page}`, { 
      method: 'GET',
      skipAuth: true 
    }),
    getProvider: (providerId) => apiClient.request(`/services/providers/${providerId}`, { 
      method: 'GET',
      skipAuth: true 
    })
  },

  // Freelancer API
  freelancer: {
    getProfile: () => apiClient.get('/freelancer/profile'),
    updateProfile: (profileData) => apiClient.put('/freelancer/profile', profileData),
    getJobs: (filters = {}) => apiClient.get('/freelancer/jobs', { params: filters }),
    applyToJob: (jobId, applicationData) => apiClient.post(`/freelancer/jobs/${jobId}/apply`, applicationData),
    getApplications: () => apiClient.get('/freelancer/applications'),
    getPortfolio: () => apiClient.get('/freelancer/portfolio'),
    addPortfolioItem: (portfolioData) => apiClient.post('/freelancer/portfolio', portfolioData)
  },

  // Provider-Freelancer Interaction API
  providerFreelancer: {
    postJob: (jobData) => apiClient.post('/provider-freelancer/jobs', jobData),
    getJobs: () => apiClient.get('/provider-freelancer/jobs'),
    getJobApplications: (jobId) => apiClient.get(`/provider-freelancer/jobs/${jobId}/applications`),
    acceptApplication: (applicationId) => apiClient.patch(`/provider-freelancer/applications/${applicationId}/accept`),
    rejectApplication: (applicationId, reason) => apiClient.patch(`/provider-freelancer/applications/${applicationId}/reject`, { reason }),
    getCollaborations: () => apiClient.get('/provider-freelancer/collaborations'),
    rateFreelancer: (collaborationId, ratingData) => apiClient.post(`/provider-freelancer/collaborations/${collaborationId}/rate`, ratingData),
    getFreelancerDetails: (freelancerId) => apiClient.get(`/provider-freelancer/freelancers/${freelancerId}`),
    searchFreelancers: (filters = {}) => apiClient.get('/freelancer/search', { params: filters })
  },

  // Staff Jobs API (for Providers and JobSeekers)
  staffJobs: {
    // Provider endpoints
    postStaffJob: async (jobData) => {
      const res = await apiClient.post('/staff-jobs', jobData);
      // Backend returns { success, message, data }
      return res?.data || res;
    },
    getMyStaffJobs: async () => {
      const res = await apiClient.get('/staff-jobs');
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    },
    getStaffJobApplications: async (jobId) => {
      const res = await apiClient.get(`/staff-jobs/${jobId}/applications`);
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    },
    approveApplication: (applicationId) => apiClient.patch(`/staff-jobs/applications/${applicationId}/approve`),
    disapproveApplication: (applicationId) => apiClient.patch(`/staff-jobs/applications/${applicationId}/disapprove`),
    
    // JobSeeker endpoints
    getAvailableStaffJobs: async (filters = {}) => {
      const res = await apiClient.get('/staff-jobs/available', { params: filters });
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    },
    applyToStaffJob: (jobId) => apiClient.post(`/staff-jobs/${jobId}/apply`),
    getMyStaffApplications: async () => {
      const res = await apiClient.get('/staff-jobs/my-applications');
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  }
};

export default apiClient;
