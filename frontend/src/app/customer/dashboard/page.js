'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  MessageCircle,
  Bell,
  Settings,
  Plus,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Share,
  Eye,
  Filter,
  Search,
  Sparkles,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  LogOut,
  User,
  Palette,
  Shield,
  CreditCard,
  Globe,
  Camera,
  Edit3,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Trash2,
  XCircle
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import ChatInterface from '../../../components/Chat/ChatInterface';
import EnhancedMessages from '../../../components/Messages/EnhancedMessages';
import CertificateTemplate from '../../../components/CertificateTemplate';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bidRequests, setBidRequests] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [serviceSchedule, setServiceSchedule] = useState([]); // pending/confirmed/in_progress slots for selected service
  const [bookingError, setBookingError] = useState('');
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [chatPartnerId, setChatPartnerId] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [showEventNeedModal, setShowEventNeedModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    eventDate: '',
    eventTime: '',
    location: '',
    notes: '',
    budget: '',
    guestCount: ''
  });
  const [eventNeedForm, setEventNeedForm] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    location: '',
    headcount: '',
    budget: '',
    needWholeTeam: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState(null);

  const { user, userProfile, logout } = useAuth();
  const router = useRouter();

  // Handle logout with proper redirection
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  // Customer-specific stats
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    totalSpent: '₹0',
    favoriteProviders: 0,
    reviews: 0
  });

  const notifications = [
    {
      id: 1,
      type: 'welcome',
      title: 'Welcome to Eventrra!',
      message: 'Start exploring amazing event services and book your first event.',
      time: 'Just now',
      unread: true
    }
  ];

  const recentMessages = [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'services', label: 'Browse Services', icon: Search },
    { id: 'providers', label: 'View Providers', icon: Users },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'features', label: 'Features', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleStartConversation = async () => {
    try {
      if (!chatPartnerId) {
        toast.error('Please select a provider');
        return;
      }
      const res = await api.createChatRoom(chatPartnerId, 'direct');
      const roomId = res?.data?.roomId || res?.roomId;
      if (roomId) {
        setActiveChatRoomId(roomId);
        toast.success('Conversation started');
      } else {
        toast.error('Failed to create chat room');
      }
    } catch (error) {
      console.error('Create chat room error:', error);
      toast.error(error.message || 'Failed to start conversation');
    }
  };

  // Load data on component mount and when user changes
  useEffect(() => {
    console.log('Dashboard mounted or user changed, user:', user);
    console.log('User profile:', userProfile);
    if (user && userProfile && userProfile.role === 'customer') {
      // Add a small delay to ensure authentication state is fully settled
      const timer = setTimeout(() => {
        loadData();
      }, 100);
      return () => clearTimeout(timer);
    } else if (user && !userProfile) {
      // If user exists but profile is not loaded yet, try again after a longer delay
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback: Loading data without profile check');
        loadData();
      }, 1000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [user, userProfile]);

  useEffect(() => {
    console.log('User state changed:', user);
    console.log('User profile state changed:', userProfile);
  }, [user, userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load public data (services and providers) - these should always work
      try {
        const servicesResponse = await api.services.getServices();
        console.log('Services response:', servicesResponse);
        setServices(servicesResponse.data || []);
      } catch (error) {
        console.error('Error loading services:', error);
        setServices([]);
      }

      try {
        const providersResponse = await api.services.getAllProviders();
        console.log('Providers response:', providersResponse);
        setProviders(providersResponse.data || []);
      } catch (error) {
        console.error('Error loading providers:', error);
        setProviders([]);
      }

      // Load user-specific data only if user is authenticated and has a valid token
      let bookingsList = [];
      let bidRequestsList = [];

      if (user) {
        try {
          // Verify user has a valid token before making authenticated requests
          // Force token refresh to ensure we have the latest token
          const token = await user.getIdToken(true);
          if (token) {
            try {
              const bookingsResponse = await api.getBookings();
              console.log('Bookings response:', bookingsResponse);

              // Merge backend data with local state to preserve optimistic updates
              setBookings(prevBookings => {
                const backendBookings = bookingsResponse.data || [];

                // Create a map of backend bookings for quick lookup
                const backendBookingsMap = new Map();
                backendBookings.forEach(booking => {
                  backendBookingsMap.set(booking.id, booking);
                });

                // Merge local and backend bookings
                const mergedBookings = [...backendBookings];
                console.log('Backend bookings count:', backendBookings.length);
                console.log('Previous bookings count:', prevBookings.length);

                // Add any local bookings that aren't in backend yet (optimistic updates)
                prevBookings.forEach(localBooking => {
                  if (!backendBookingsMap.has(localBooking.id)) {
                    // Check if there's a backend booking for the same service (different ID)
                    const backendBookingForService = backendBookings.find(b =>
                      b.serviceId === localBooking.serviceId &&
                      b.customerId === localBooking.customerId
                    );

                    if (backendBookingForService) {
                      // Replace local booking with backend booking
                      console.log('Replacing local booking with backend booking:', backendBookingForService);
                      const index = mergedBookings.findIndex(b => b.id === backendBookingForService.id);
                      if (index === -1) {
                        mergedBookings.push(backendBookingForService);
                      }
                    } else {
                      // Only add if it's a recent optimistic update (within last 5 minutes)
                      const bookingTime = new Date(localBooking.createdAt);
                      const now = new Date();
                      const timeDiff = now - bookingTime;
                      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
                        console.log('Preserving optimistic booking update:', localBooking);
                        mergedBookings.push(localBooking);
                      }
                    }
                  } else {
                    // If backend has the booking, check if we need to update local state
                    const backendBooking = backendBookingsMap.get(localBooking.id);
                    if (backendBooking.status !== localBooking.status) {
                      console.log('Updating booking status from backend:', backendBooking.status);
                      // Find and update the booking in mergedBookings
                      const index = mergedBookings.findIndex(b => b.id === localBooking.id);
                      if (index !== -1) {
                        mergedBookings[index] = { ...mergedBookings[index], ...backendBooking };
                      }
                    }
                  }
                });

                console.log('Final merged bookings count:', mergedBookings.length);
                return mergedBookings;
              });

              bookingsList = bookingsResponse.data || [];
            } catch (error) {
              console.error('Error loading bookings:', error);
              // Don't show error to user for bookings, just log it
              // Don't clear bookings on error to preserve local state
              console.log('Preserving local bookings due to backend error');
            }

            try {
              console.log('Fetching bid requests for user:', user.uid);
              const bidRequestsResponse = await api.getMyBidRequests();
              console.log('Bid requests response:', bidRequestsResponse);
              console.log('Bid requests data:', bidRequestsResponse.data);
              console.log('Number of bid requests:', bidRequestsResponse.data?.length || 0);
              setBidRequests(bidRequestsResponse.data || []);
              bidRequestsList = bidRequestsResponse.data || [];
            } catch (error) {
              console.error('Error loading bid requests:', error);
              console.error('Error details:', error.message);
              // Don't show error to user for bid requests, just log it
              setBidRequests([]);
            }
          } else {
            console.log('No valid token available, skipping authenticated requests');
            setBookings([]);
            setBidRequests([]);
          }
        } catch (tokenError) {
          console.error('Error getting auth token:', tokenError);
          console.error('Token error details:', tokenError.message);
          // Try to refresh the token and retry once
          try {
            console.log('Attempting to refresh token...');
            const refreshedToken = await user.getIdToken(true);
            if (refreshedToken) {
              console.log('Token refreshed successfully, retrying data load...');
              // Retry loading bid requests with refreshed token
              try {
                const bidRequestsResponse = await api.getMyBidRequests();
                console.log('Retry bid requests response:', bidRequestsResponse);
                setBidRequests(bidRequestsResponse.data || []);
                bidRequestsList = bidRequestsResponse.data || [];
              } catch (retryError) {
                console.error('Retry failed for bid requests:', retryError);
                setBidRequests([]);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
          setBookings([]);
          if (!bidRequestsList.length) {
            setBidRequests([]);
          }
        }
      } else {
        console.log('User not authenticated, skipping user-specific data');
        setBookings([]);
        setBidRequests([]);
      }

      // Update stats
      setStats({
        upcomingBookings: bookingsList.filter(b => b.status === 'confirmed').length || 0,
        totalSpent: `₹${bookingsList.reduce((sum, b) => sum + (b.price || 0), 0) || 0}`,
        favoriteProviders: providers.length || 0,
        reviews: bidRequestsList.length || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle event need creation
  const handlePostEventNeed = async () => {
    try {
      console.log('Starting event need creation...');
      console.log('Event need form:', eventNeedForm);

      if (!eventNeedForm.eventName || !eventNeedForm.eventType || !eventNeedForm.eventDate || !eventNeedForm.location || !eventNeedForm.headcount) {
        toast.error('Please fill in all required fields');
        return;
      }

      const bidRequestData = {
        eventName: eventNeedForm.eventName,
        eventType: eventNeedForm.eventType.toLowerCase(),
        eventDate: eventNeedForm.eventDate,
        location: eventNeedForm.location,
        budget: eventNeedForm.budget ? parseFloat(eventNeedForm.budget) : 0,
        guestCount: parseInt(eventNeedForm.headcount) || 0,
        requirements: `Event Name: ${eventNeedForm.eventName}, Event Type: ${eventNeedForm.eventType}`,
        servicesNeeded: [],
        preferredCategories: [eventNeedForm.eventType.toLowerCase()],
        needWholeTeam: eventNeedForm.needWholeTeam
      };

      console.log('Event need data to send:', bidRequestData);

      const response = await api.createBidRequest(bidRequestData);
      console.log('Event need response:', response);

      toast.success('Event need posted successfully! Providers will respond soon.');

      setShowEventNeedModal(false);
      setEventNeedForm({
        eventName: '',
        eventType: '',
        eventDate: '',
        location: '',
        headcount: '',
        budget: '',
        needWholeTeam: false
      });

      console.log('Refreshing data...');
      await loadData(); // Refresh data
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error posting event need:', error);
      toast.error(`Failed to post event need: ${error.message}`);
    }
  };

  // Handle direct booking creation
  const handleBookService = async () => {
    // Prevent multiple simultaneous booking requests
    if (isBookingInProgress) {
      console.log('Booking already in progress, ignoring request');
      return;
    }

    try {
      setIsBookingInProgress(true);
      setBookingServiceId(selectedService.id);
      console.log('Starting direct booking creation...');
      console.log('Selected service:', selectedService);
      console.log('Booking form:', bookingForm);

      if (!selectedService || !bookingForm.eventDate || !bookingForm.location || !bookingForm.budget) {
        toast.error('Please fill in all required fields including budget');
        return;
      }

      const bookingData = {
        serviceId: selectedService.id,
        providerId: selectedService.providerId,
        eventDate: bookingForm.eventDate,
        eventTime: bookingForm.eventTime,
        location: bookingForm.location,
        budget: parseFloat(bookingForm.budget),
        guestCount: parseInt(bookingForm.guestCount) || 0,
        requirements: bookingForm.notes || '',
        eventName: selectedService.name,
        eventType: selectedService.category || 'Other'
      };

      console.log('Direct booking data to send:', bookingData);

      // Pre-validate against service schedule to avoid conflicts
      try {
        const scheduleRes = await api.services.getServiceSchedule(selectedService.id).catch(() => api.services.getServiceScheduleAlt(selectedService.id));
        const schedule = scheduleRes?.data || [];
        const normalizeTime = (t) => (t && t.length >= 4 ? t.slice(0, 5) : '');
        const desiredDate = bookingData.eventDate;
        const desiredTime = normalizeTime(bookingData.eventTime || '');
        const hasConflict = schedule.some(s => {
          const sDate = s.eventDate;
          const sTime = normalizeTime(s.eventTime || '');
          if (!sDate) return false;
          if (!sTime && !desiredTime) return sDate === desiredDate;
          return sDate === desiredDate && sTime === desiredTime;
        });
        if (hasConflict) {
          setBookingError('Selected date/time is not available for this service');
          setIsBookingInProgress(false);
          setBookingServiceId(null);
          return;
        }
      } catch (e) {
        console.warn('Schedule precheck failed, proceeding with server validation');
      }

      const response = await api.bookNow(bookingData);
      console.log('Direct booking response:', response);

      // Optimistically update the local state immediately
      const newBooking = {
        id: response.data?.id || `temp-${Date.now()}`, // Use actual booking ID from response
        serviceId: selectedService.id,
        providerId: selectedService.providerId,
        customerId: user.uid,
        customerName: user.displayName || userProfile?.name || 'Customer',
        eventName: bookingData.eventName,
        eventType: bookingData.eventType,
        eventDate: bookingData.eventDate,
        location: bookingData.location,
        budget: bookingData.budget,
        price: bookingData.budget,
        guestCount: bookingData.guestCount,
        requirements: bookingData.requirements,
        status: 'pending', // New bookings start as pending
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOptimistic: !response.data?.id, // Mark as optimistic if no real ID
        tempId: `temp-${Date.now()}-${selectedService.id}` // Unique temp identifier for tracking
      };

      // Add the new booking to the local state immediately
      setBookings(prevBookings => {
        // Check if booking already exists to prevent duplicates
        const existingBooking = prevBookings.find(b =>
          b.serviceId === newBooking.serviceId &&
          (b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_progress')
        );

        if (existingBooking) {
          console.log('Booking already exists for this service, not adding duplicate');
          return prevBookings;
        }

        console.log('Adding new booking to local state:', newBooking);
        console.log('Previous bookings count:', prevBookings.length);
        const updatedBookings = [newBooking, ...prevBookings];
        console.log('Updated bookings count:', updatedBookings.length);
        return updatedBookings;
      });

      toast.success('Booking request sent! Waiting for provider confirmation.');

      setShowBookingModal(false);
      setSelectedService(null);
      setBookingForm({
        eventDate: '',
        eventTime: '',
        location: '',
        notes: '',
        budget: '',
        guestCount: ''
      });

      // Only refresh data if we used a temporary ID (optimistic update)
      if (newBooking.isOptimistic) {
        console.log('Scheduling data refresh for optimistic booking...');
        setTimeout(async () => {
          console.log('Refreshing data after delay...');
          await loadData(); // Refresh data
          console.log('Data refreshed successfully');
        }, 2000); // 2 second delay for optimistic updates
      } else {
        console.log('Using real booking ID, no need for delayed refresh');
        // Still refresh after a short delay to get any status updates
        setTimeout(async () => {
          console.log('Refreshing data for status updates...');
          await loadData();
          console.log('Data refreshed successfully');
        }, 500); // Shorter delay for real bookings
      }

    } catch (error) {
      console.error('Error creating direct booking:', error);
      toast.error(`Failed to book service: ${error.message}`);
    } finally {
      setIsBookingInProgress(false);
      setBookingServiceId(null);
    }
  };

  // Handle bid acceptance
  const handleAcceptBid = async (requestId, bidId) => {
    try {
      await api.acceptBid(requestId, bidId);
      toast.success('Bid accepted! Booking has been created.');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast.error('Failed to accept bid');
    }
  };

  // Handle bid rejection
  const handleRejectBid = async (requestId, bidId) => {
    try {
      await api.rejectBid(requestId, bidId);
      toast.success('Bid rejected');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast.error('Failed to reject bid');
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    try {
      await api.updateBookingStatus(bookingId, 'cancelled', 'Cancelled by customer');
      toast.success('Booking cancelled successfully');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (requestId) => {
    try {
      // Find the specific bid request to check actual bid count
      const bidRequest = bidRequests.find(request => request.id === requestId);
      const actualBidCount = bidRequest?.bids?.length || 0;

      // Only show confirmation if there are actual bids
      if (actualBidCount > 0) {
        const confirmMessage = 'This event has received bids from providers. Are you sure you want to delete it? This will notify all providers who submitted bids.';
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }
      // For events with zero bids, delete immediately without confirmation

      await api.deleteBidRequest(requestId);
      toast.success('Event deleted successfully');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(`Failed to delete event: ${error.message}`);
    }
  };

  // Helper function to check if a bid request exists for a service
  const getBidRequestForService = (service) => {
    return bidRequests.find(request => {
      // Check if service ID is in servicesNeeded array
      const matchesServiceId = request.servicesNeeded?.includes(service.id);
      // Check if service ID matches serviceId field (for backward compatibility)
      const matchesDirectServiceId = request.serviceId === service.id;
      // Check if category matches (as fallback)
      const matchesCategory = request.preferredCategories?.includes(service.category);

      return matchesServiceId || matchesDirectServiceId || matchesCategory;
    });
  };

  // Helper: find an active booking for this service (or its provider)
  const getBookingForService = (service) => {
    const foundBooking = bookings.find((booking) => {
      // Prefer exact service match when available
      const matchesServiceId = booking.serviceId && service.id && booking.serviceId === service.id;
      // Fallback: some bookings (e.g., bid-accepted) may not store serviceId; match by provider
      const matchesProviderId = booking.providerId && service.providerId && booking.providerId === service.providerId;
      // Additional heuristic for mock data: match by service name/category
      const matchesServiceName = booking.serviceName && service.name && booking.serviceName.trim().toLowerCase() === service.name.trim().toLowerCase();
      const matchesCategory = booking.serviceCategory && service.category && booking.serviceCategory === service.category;
      // Active means user should not be able to book again yet
      const isActiveBooking = booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'in_progress';

      if ((matchesServiceId || matchesProviderId || matchesServiceName || matchesCategory) && isActiveBooking) {
        console.log(`Active booking found for service ${service.id} (provider ${service.providerId}):`, {
          bookingId: booking.id,
          status: booking.status,
          matchedBy: matchesServiceId ? 'serviceId' : (matchesProviderId ? 'providerId' : (matchesServiceName ? 'serviceName' : 'category')),
          isOptimistic: booking.isOptimistic
        });
        return true;
      }
      return false;
    });

    if (!foundBooking) {
      console.log(`No active booking found for service ${service.id}. Total bookings: ${bookings.length}`);
    }

    return foundBooking;
  };

  // Get all active bookings for a service/provider, sorted by date/time ascending
  const getAllActiveBookingsForService = (service) => {
    const list = bookings.filter((booking) => {
      const matchesServiceId = booking.serviceId && service.id && booking.serviceId === service.id;
      const matchesProviderId = booking.providerId && service.providerId && booking.providerId === service.providerId;
      const isActiveBooking = booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'in_progress';
      return (matchesServiceId || matchesProviderId) && isActiveBooking;
    });

    // Normalize date/time for sorting
    const toSortableDate = (b) => {
      const dateStr = b.eventDate || b.date || '';
      const timeStr = b.eventTime || b.time || '00:00';
      const dt = new Date(`${dateStr}T${timeStr}`);
      return isNaN(dt.getTime()) ? new Date(0) : dt;
    };

    return [...list].sort((a, b) => toSortableDate(a) - toSortableDate(b));
  };

  // Check if a date/time slot is free for a given service
  const isSlotAvailable = (service, date, time) => {
    if (!date) return false;
    const all = getAllActiveBookingsForService(service || {});
    const normalizeTime = (t) => (t && t.length >= 4 ? t.slice(0, 5) : '');
    const desiredTime = normalizeTime(time);
    return !all.some((b) => {
      const bookedDate = b.eventDate || b.date;
      const bookedTime = normalizeTime(b.eventTime || b.time);
      if (!bookedDate) return false;
      // If times are not provided, consider whole-day booking collision on same date
      if (!bookedTime && !desiredTime) return bookedDate === date;
      // If either has time, require both date equal and time equal to count as collision
      return bookedDate === date && bookedTime === desiredTime;
    });
  };

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Check if filtering by provider ID (when clicking "View Services" from provider card)
    const isProviderFilter = categoryFilter !== 'all' && providers.some(p => p.id === categoryFilter);

    const matchesCategory = categoryFilter === 'all' ||
      service.category === categoryFilter ||
      (isProviderFilter && service.providerId === categoryFilter);

    return matchesSearch && matchesCategory;
  });

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Message */}
      <PremiumCard className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome {userProfile?.name ? userProfile.name.split(' ')[0] : 'Guest'} to Eventrra!</h2>
          <p className="text-lg text-gray-600 mb-6">Discover amazing event services and create unforgettable memories.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton variant="primary" size="lg" onClick={() => setActiveTab('services')}>
              <Plus className="w-5 h-5 mr-2" />
              Browse Services
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg" onClick={() => setActiveTab('providers')}>
              <Eye className="w-5 h-5 mr-2" />
              View Providers
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Upcoming Bookings</p>
              <p className="text-3xl font-bold text-slate-900">{stats.upcomingBookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalSpent}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Favorite Providers</p>
              <p className="text-3xl font-bold text-slate-900">{stats.favoriteProviders}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Reviews Written</p>
              <p className="text-3xl font-bold text-slate-900">{stats.reviews}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Recent Bookings */}
      <PremiumCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Recent Bookings</h3>
          <PremiumButton variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
            View All
          </PremiumButton>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.slice(0, 3).map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{booking.serviceName || 'Event Service'}</h4>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                    </div>
                    {booking.eventTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{booking.eventTime}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹{booking.budget || booking.amount || 'TBD'}</div>
                  <div className={`text-sm px-3 py-1 rounded-full ${booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                    {booking.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No bookings yet</h3>
            <p className="text-slate-500 mb-6">Start exploring our amazing event services!</p>
            <PremiumButton variant="primary" size="lg" onClick={() => setActiveTab('services')}>
              <Plus className="w-5 h-5 mr-2" />
              Browse Services
            </PremiumButton>
          </div>
        )}
      </PremiumCard>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">My Bookings & My Events</h2>
        <div className="flex items-center space-x-3">
          <PremiumButton variant="ghost" size="sm" onClick={() => {
            console.log('Manual refresh triggered');
            console.log('Current user:', user);
            console.log('Current userProfile:', userProfile);
            console.log('Current bidRequests:', bidRequests);
            loadData();
          }}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </PremiumButton>
          <PremiumButton variant="primary" size="sm" onClick={() => setShowEventNeedModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            My Events
          </PremiumButton>
        </div>
      </div>

      {/* Bid Requests Section */}
      {loading && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Active My Events</h3>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-600 mt-2">Loading your events...</p>
          </div>
        </div>
      )}

      {!loading && bidRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Active My Events</h3>
          <div className="grid grid-cols-1 gap-6">
            {bidRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PremiumCard className="p-6" hoverEffect="lift">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{request.eventName || `${request.eventType} Event`}</h3>
                          <p className="text-slate-600">{request.bids?.length || 0} bids received</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          {/* currency icon removed per request */}
                          <span className="font-semibold">Budget: ₹{request.budget}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <User className="w-4 h-4" />
                          <span>{request.guestCount} guests</span>
                        </div>
                      </div>

                      {request.requirements && (
                        <p className="text-slate-600 mb-4 text-sm bg-slate-50 p-3 rounded-lg">
                          <strong>Requirements:</strong> {request.requirements}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold mb-2 ${request.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : request.status === 'awarded'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {request.status}
                      </div>

                      {/* Delete button - only show for open events */}
                      {request.status === 'open' && (
                        <div className="mt-2">
                          <PremiumButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(request.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </PremiumButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bids Section */}
                  {request.bids && request.bids.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Received Bids:</h4>
                      <div className="space-y-3">
                        {request.bids.map((bid, bidIndex) => (
                          <div key={bidIndex} className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{bid.providerName}</p>
                                  <p className="text-sm text-slate-600">{bid.providerRole}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-indigo-600">₹{bid.price}</p>
                                <div className={`px-2 py-1 rounded text-xs font-semibold ${bid.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : bid.status === 'accepted'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                  }`}>
                                  {bid.status}
                                </div>
                              </div>
                            </div>

                            <p className="text-slate-700 text-sm mb-3">{bid.description}</p>

                            {bid.estimatedTime && (
                              <p className="text-slate-600 text-xs mb-3">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Estimated time: {bid.estimatedTime}
                              </p>
                            )}

                            {bid.status === 'pending' && request.status === 'open' && (
                              <div className="flex space-x-2">
                                <Link href={`/provider/profile?id=${bid.providerId}`}>
                                  <PremiumButton
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Profile
                                  </PremiumButton>
                                </Link>
                                <PremiumButton
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAcceptBid(request.id, bid.providerId)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </PremiumButton>
                                <PremiumButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectBid(request.id, bid.providerId)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </PremiumButton>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.bids?.length === 0 && (
                    <div className="mt-6 border-t pt-4 text-center text-slate-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No bids received yet. Providers will submit their proposals soon.</p>
                    </div>
                  )}
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Bookings Section */}
      {bookings.filter(booking => booking.status === 'pending').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Pending Bookings</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.filter(booking => booking.status === 'pending').map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PremiumCard className="p-6" hoverEffect="lift">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{booking.serviceName || booking.eventType}</h3>
                      <div className="space-y-2 text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* currency icon removed per request */}
                          <span className="text-2xl font-bold text-indigo-600">₹{booking.price || booking.budget}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                        Pending
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Waiting for provider confirmation
                    </p>
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Bookings Section */}
      {bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Confirmed Bookings</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed').map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PremiumCard className="p-6" hoverEffect="lift">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{booking.serviceName || booking.eventType}</h3>
                      <div className="space-y-2 text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* currency icon removed per request */}
                          <span className="text-2xl font-bold text-indigo-600">₹{booking.price || booking.budget}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : booking.status === 'completed'
                            ? 'bg-purple-100 text-purple-700'
                            : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                        {booking.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex space-x-2">
                      <PremiumButton variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </PremiumButton>
                      {booking.status === 'confirmed' && (
                        <PremiumButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </PremiumButton>
                      )}
                    </div>
                    {/* Removed standalone View Details here; card header is clickable */}
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && bidRequests.length === 0 && bookings.length === 0 && (
        <div className="text-center py-20">
          <Target className="w-24 h-24 text-slate-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-slate-600 mb-4">No events or bookings yet</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Start your event planning journey by posting your event. Service providers will respond with their proposals, and you can choose the best one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton variant="primary" size="lg" onClick={() => setShowEventNeedModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              My Events
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg" onClick={() => setActiveTab('providers')}>
              <Eye className="w-5 h-5 mr-2" />
              View Providers
            </PremiumButton>
          </div>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="h-[700px]">
      <EnhancedMessages />
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Notifications</h2>
        <PremiumButton variant="ghost" size="sm">
          Mark All Read
        </PremiumButton>
      </div>

      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PremiumCard className={`p-6 ${notification.unread ? 'ring-2 ring-indigo-200' : ''}`}>
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${notification.type === 'welcome' ? 'bg-indigo-100' :
                  notification.type === 'booking' ? 'bg-blue-100' :
                    notification.type === 'payment' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                  {notification.type === 'welcome' && <Sparkles className="w-6 h-6 text-indigo-600" />}
                  {notification.type === 'booking' && <Calendar className="w-6 h-6 text-blue-600" />}
                  {notification.type === 'payment' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {notification.type === 'review' && <Star className="w-6 h-6 text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                  <p className="text-slate-600 mt-1">{notification.message}</p>
                  <p className="text-sm text-slate-500 mt-2">{notification.time}</p>
                </div>
                {notification.unread && (
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                )}
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Features</h2>
        <div className="flex items-center space-x-2 text-slate-600">
          <Award className="w-6 h-6" />
          <span className="text-lg">Premium Tools</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificate Generation Card */}
        <Link href="/certificate">
          <PremiumCard className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Certificate Generator</h3>
                  <p className="text-slate-600 text-sm">
                    Create professional certificates for events and achievements
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
              </div>
              <div className="flex-1 flex items-end">
                <div className="flex items-center space-x-4 text-xs text-slate-500 w-full">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>PDF & PNG</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Custom Design</span>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </Link>

        {/* ID Card Generator Card */}
        <Link href="/features/id-card">
          <PremiumCard className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">ID Card Generator</h3>
                  <p className="text-slate-600 text-sm">
                    Quickly create professional ID cards for event attendees. Upload a photo or use a URL, add a name and event, then download.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
              <div className="flex-1 flex items-end">
                <div className="flex items-center space-x-4 text-xs text-slate-500 w-full">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>PNG Export</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Simple Design</span>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </Link>

        {/* Placeholder for future features */}
        <PremiumCard className="p-6 h-full">
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">More Features Coming Soon</h3>
                <p className="text-slate-600 text-sm">
                  We're constantly adding new premium features to enhance your event management experience.
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-end">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Stay tuned for updates</span>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <Link href="/customer/settings">
          <PremiumButton variant="primary" size="sm">
            <Settings className="w-5 h-5 mr-2" />
            Manage Settings
          </PremiumButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Profile Settings</h3>
              <p className="text-slate-600">Update your personal information</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4">Manage your profile details, contact information, and preferences.</p>
          <Link href="/customer/settings">
            <PremiumButton variant="ghost" size="sm" className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Profile Settings
            </PremiumButton>
          </Link>
        </PremiumCard>

        {/* Theme Settings */}
        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Theme Settings</h3>
              <p className="text-slate-600">Customize your appearance</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4">Switch between light and dark themes to match your preference.</p>
          <Link href="/customer/settings">
            <PremiumButton variant="ghost" size="sm" className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Change Theme
            </PremiumButton>
          </Link>
        </PremiumCard>

        {/* Notification Settings */}
        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
              <p className="text-slate-600">Manage your notifications</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4">Control how and when you receive notifications from Eventrra.</p>
          <Link href="/customer/settings">
            <PremiumButton variant="ghost" size="sm" className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Notification Settings
            </PremiumButton>
          </Link>
        </PremiumCard>

        {/* Security Settings */}
        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Security</h3>
              <p className="text-slate-600">Account security settings</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4">Manage your password, privacy settings, and account security.</p>
          <Link href="/customer/settings">
            <PremiumButton variant="ghost" size="sm" className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Security Settings
            </PremiumButton>
          </Link>
        </PremiumCard>
      </div>
    </div>
  );

  // Render Browse Services tab
  const renderServices = () => {
    // Check if we're filtering by a specific provider
    const selectedProvider = providers.find(p => p.id === categoryFilter);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {selectedProvider ? `${selectedProvider.name}'s Services` : 'Browse Services'}
            </h2>
            {selectedProvider && (
              <button
                onClick={() => setCategoryFilter('all')}
                className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to all services
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="photography">Photography</option>
              <option value="catering">Catering</option>
              <option value="decoration">Decoration</option>
              <option value="music">Music & Entertainment</option>
              <option value="transport">Transportation</option>
              <option value="venue">Venue</option>
              <option value="planning">Event Planning</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PremiumCard className="p-6 cursor-pointer" hoverEffect="lift" onClick={() => { setSelectedService(service); setShowServiceModal(true); }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                      <p className="text-slate-600 mb-3 line-clamp-2">{service.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center">
                          ₹{service.price}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration || 'Varies'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${service.category === 'photography' ? 'bg-purple-100 text-purple-700' :
                          service.category === 'catering' ? 'bg-green-100 text-green-700' :
                            service.category === 'decoration' ? 'bg-pink-100 text-pink-700' :
                              service.category === 'music' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {service.category || 'Other'}
                        </span>
                        {/* Availability chip hidden per request */}
                        {isBookingInProgress && bookingServiceId === service.id && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                            Processing...
                          </span>
                        )}
                        {/* Bid status chip hidden per request */}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <PremiumButton
                        variant="primary"
                        size="sm"
                        className="w-full sm:min-w-[150px] text-xs md:text-sm py-2 min-h-[40px] whitespace-normal leading-snug justify-center shadow-none"
                        onClick={() => {
                          if (isBookingInProgress) return;
                          setSelectedService(service);
                          setShowBookingModal(true);
                        }}
                        disabled={isBookingInProgress}
                      >
                        Booking
                      </PremiumButton>
                      <PremiumButton
                        variant="primary"
                        size="sm"
                        className="w-full sm:min-w-[150px] text-xs md:text-sm py-2 min-h-[40px] whitespace-normal leading-snug justify-center shadow-none"
                        onClick={() => {
                          const booking = getBookingForService(service);
                          const bidReq = getBidRequestForService(service);
                          // If not bookable, show status modal instead of booking flow
                          if (booking || bidReq) {
                            setStatusInfo({
                              service,
                              booking,
                              bidReq
                            });
                            setShowStatusModal(true);
                            return;
                          }
                          if (!isBookingInProgress) {
                            setSelectedService(service);
                            // Load schedule for disabled dates/times
                            setServiceSchedule([]);
                            api.services.getServiceSchedule(service.id)
                              .then((res) => setServiceSchedule(res?.data || []))
                              .catch(() => api.services.getServiceScheduleAlt(service.id).then((res2) => setServiceSchedule(res2?.data || [])).catch(() => setServiceSchedule([])));
                            setShowBookingModal(true);
                          }
                        }}
                        disabled={service.isActive === false || isBookingInProgress}
                      >
                        {(() => {
                          const booking = getBookingForService(service);
                          const bidReq = getBidRequestForService(service);
                          if (isBookingInProgress && bookingServiceId === service.id) return 'Booking...';
                          if (bidReq && (bidReq.status === 'open' || bidReq.status === 'awarded')) return bidReq.status === 'open' ? 'Pending / Confirmed' : 'Bid Awarded';
                          if (!booking) return 'Book Now';

                          switch (booking.status) {
                            case 'pending':
                              return 'Booking Pending';
                            case 'confirmed':
                              return 'Already Booked';
                            case 'in_progress':
                              return 'In Progress';
                            case 'completed':
                              return 'Completed';
                            default:
                              return 'Already Booked';
                          }
                        })()}
                      </PremiumButton>
                    </div>
                  </div>
                  {(() => {
                    const all = getAllActiveBookingsForService(service) || [];
                    if (all.length === 0) return null;
                    const pendingCount = all.filter(b => b.status === 'pending').length;
                    const confirmedCount = all.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;
                    return (
                      <div className="mt-4 text-xs text-slate-600 flex items-center gap-3">
                        <span className="px-2.5 py-1.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200">Pending: {pendingCount}</span>
                        <span className="px-2.5 py-1.5 rounded-full bg-green-50 text-green-800 border border-green-200">Confirmed: {confirmedCount}</span>
                        <button
                          className="text-indigo-600 hover:underline font-medium"
                          onClick={() => {
                            const booking = getBookingForService(service); // may be null
                            setStatusInfo({ service, booking: booking || null, bidReq: getBidRequestForService(service) || null });
                            setShowStatusModal(true);
                          }}
                        >
                          View details
                        </button>
                      </div>
                    );
                  })()}
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No services found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    );

    // Render View Providers tab
    const renderProviders = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900">Service Providers</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading providers...</p>
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PremiumCard className="p-6" hoverEffect="lift">
                  <div className="text-center mb-4">
                    {provider.picture ? (
                      <img
                        src={provider.picture}
                        alt={provider.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{provider.businessName || provider.name}</h3>
                    <p className="text-slate-600 mb-2">{provider.totalServices} service{provider.totalServices !== 1 ? 's' : ''} available</p>
                    {provider.location && (
                      <p className="text-sm text-slate-500 mb-2">{provider.location}</p>
                    )}
                    {provider.rating > 0 && (
                      <div className="flex items-center justify-center mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-slate-600 ml-1">{provider.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {provider.services.slice(0, 3).map((service) => (
                      <div key={service.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 truncate">{service.name}</span>
                        <span className="text-indigo-600 font-semibold">₹{service.price}</span>
                      </div>
                    ))}
                    {provider.services.length > 3 && (
                      <p className="text-sm text-slate-500">+{provider.services.length - 3} more services</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <PremiumButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowProviderModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </PremiumButton>
                    <PremiumButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setCategoryFilter(provider.id); // Use provider ID as filter
                        setActiveTab('services');
                      }}
                    >
                      View Services
                    </PremiumButton>
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Providers Found</h3>
            <p className="text-gray-600">There are no service providers available at the moment.</p>
          </div>
        )}
      </div>
    );
  };

  // Render Browse Providers tab
  const renderProviders = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900">Browse Providers</h2>
      {providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <motion.div
              key={provider.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PremiumCard className="h-full">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{provider.businessName || provider.name}</h3>
                      <p className="text-sm text-gray-600">
                        {provider.category
                          ? provider.category
                          : provider.categories && provider.categories.length > 0
                            ? provider.categories.join(', ').replace(/\b\w/g, l => l.toUpperCase())
                            : provider.specialties && provider.specialties.length > 0
                              ? provider.specialties.join(', ')
                              : ''
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {provider.phone || 'Not provided'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {provider.email || 'Not provided'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {provider.location || 'Location not specified'}
                    </div>
                  </div>

                  <Link href={`/provider/profile?id=${provider.id}`}>
                    <PremiumButton
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      View Profile
                    </PremiumButton>
                  </Link>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Providers Found</h3>
          <p className="text-gray-600">There are no service providers available at the moment.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        className="bg-white/90 backdrop-blur-md border-b border-slate-200/20 sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Eventrra
              </span>
            </motion.div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">Customer Dashboard</span>
              </div>
              <Link href="/customer/settings">
                <PremiumButton variant="ghost" size="sm">
                  <Settings className="w-5 h-5" />
                </PremiumButton>
              </Link>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </PremiumButton>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <motion.div
          className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-white/50'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'services' && renderServices()}
          {activeTab === 'providers' && renderProviders()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'features' && renderFeatures()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </div>

      {/* Service Details Modal */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Service Details</h2>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setSelectedService(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedService.name}</h3>
                <p className="text-gray-600">{selectedService.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                  <p className="text-2xl font-bold text-indigo-600">₹{selectedService.price}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">{selectedService.duration || 'Varies'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900 capitalize">{selectedService.category || 'Other'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  {/* Status chip hidden per request */}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  variant="ghost"
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedService(null);
                  }}
                >
                  Close
                </PremiumButton>
                {/* Book button removed per request */}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Provider Details Modal */}
      {showProviderModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Provider Profile</h2>
              <button
                onClick={() => {
                  setShowProviderModal(false);
                  setSelectedProvider(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProvider.businessName}</h3>
                <p className="text-gray-600">{selectedProvider.totalServices} service{selectedProvider.totalServices !== 1 ? 's' : ''} available</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Services</h4>
                <div className="space-y-3">
                  {selectedProvider.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <h5 className="font-semibold text-gray-900">{service.name}</h5>
                        <p className="text-sm text-gray-600 line-clamp-1">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">₹{service.price}</p>
                        {/* Availability chip hidden per request */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  variant="ghost"
                  onClick={() => {
                    setShowProviderModal(false);
                    setSelectedProvider(null);
                  }}
                >
                  Close
                </PremiumButton>
                <PremiumButton
                  variant="primary"
                  onClick={() => {
                    setShowProviderModal(false);
                    setActiveTab('services');
                  }}
                >
                  View All Services
                </PremiumButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book Service</h2>
                <p className="text-sm text-gray-600 mt-1">Service providers will submit bids for your event</p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedService(null);
                  setBookingForm({
                    eventDate: '',
                    eventTime: '',
                    location: '',
                    notes: '',
                    budget: '',
                    guestCount: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
              <h3 className="font-semibold text-indigo-900 mb-1">{selectedService.name}</h3>
              <p className="text-indigo-700 text-sm">{selectedService.description}</p>
              <p className="text-indigo-900 font-bold mt-2">Base Price: ₹{selectedService.price}</p>
              <p className="text-xs text-indigo-600 mt-1">Providers may offer different pricing in their bids</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleBookService();
            }} className="space-y-6">
              {bookingError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{bookingError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.eventDate}
                    onChange={(e) => {
                      setBookingError('');
                      setBookingForm({ ...bookingForm, eventDate: e.target.value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    list="disabled-dates"
                  />
                  <datalist id="disabled-dates">
                    {serviceSchedule
                      .filter(s => s.eventDate)
                      .map(s => s.eventDate)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map(date => (
                        <option value={date} key={date} />
                      ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Time
                  </label>
                  <input
                    type="time"
                    value={bookingForm.eventTime}
                    onChange={(e) => {
                      setBookingError('');
                      setBookingForm({ ...bookingForm, eventTime: e.target.value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    list="disabled-times"
                  />
                  <datalist id="disabled-times">
                    {bookingForm.eventDate && serviceSchedule
                      .filter(s => s.eventDate === bookingForm.eventDate && s.eventTime)
                      .map(s => s.eventTime)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map(time => (
                        <option value={time} key={time} />
                      ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Location *
                </label>
                <input
                  type="text"
                  value={bookingForm.location}
                  onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter event location"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Budget (₹) *
                  </label>
                  <input
                    type="number"
                    value={bookingForm.budget}
                    onChange={(e) => setBookingForm({ ...bookingForm, budget: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Suggested: ₹${selectedService.price}`}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    value={bookingForm.guestCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestCount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Number of guests"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any special requirements or notes for the service provider..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (isBookingInProgress) return; // Prevent closing during booking
                    setShowBookingModal(false);
                    setSelectedService(null);
                    setBookingForm({
                      eventDate: '',
                      eventTime: '',
                      location: '',
                      notes: '',
                      budget: '',
                      guestCount: ''
                    });
                  }}
                  disabled={isBookingInProgress}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  type="submit"
                  variant="primary"
                  disabled={isBookingInProgress}
                >
                  {isBookingInProgress ? 'Sending Request...' : 'Send Booking Request'}
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Status Modal (shows when service is not directly bookable) */}
      {showStatusModal && statusInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Service Status</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusInfo(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{statusInfo.service?.name}</h3>
                <p className="text-sm text-gray-600">{statusInfo.service?.description}</p>
              </div>

              {/* Load schedule from backend */}
              {(() => {
                // Fetch once per open if not loaded
                if (!statusInfo.scheduleLoading && !statusInfo.schedule) {
                  setStatusInfo(prev => ({ ...(prev || {}), scheduleLoading: true }));
                  api.services.getServiceSchedule(statusInfo.service?.id).then((res) => {
                    setStatusInfo(prev => ({ ...(prev || {}), schedule: res?.data || [], scheduleLoading: false }));
                  }).catch(() => {
                    // try alternate path
                    api.services.getServiceScheduleAlt(statusInfo.service?.id).then((res2) => {
                      setStatusInfo(prev => ({ ...(prev || {}), schedule: res2?.data || [], scheduleLoading: false }));
                    }).catch(() => {
                      setStatusInfo(prev => ({ ...(prev || {}), schedule: [], scheduleLoading: false }));
                    });
                  });
                }
                return null;
              })()}

              {/* Bookings grouped by status with full details */}
              <div>
                {(() => {
                  const all = Array.isArray(statusInfo.schedule) && statusInfo.schedule.length > 0
                    ? statusInfo.schedule
                    : getAllActiveBookingsForService(statusInfo.service || {});
                  if (!all || all.length === 0) return null;
                  const pending = all.filter(b => b.status === 'pending');
                  const confirmed = all.filter(b => b.status === 'confirmed' || b.status === 'in_progress');
                  const renderItem = (b, color) => (
                    <div key={b.id} className={`p-3 rounded-lg border ${color.bg} ${color.border}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${color.text}`}>{(b.status || '').replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">{b.location || '—'}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-900">{b.eventName || b.eventType || 'Event'}</div>
                      <div className="text-sm text-gray-900">{b.eventDate || '—'}{b.eventTime ? `, ${b.eventTime}` : ''}</div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div><span className="font-semibold">Guests:</span> {b.guestCount ?? '-'}</div>
                        <div><span className="font-semibold">Budget:</span> {b.budget ? `₹${b.budget}` : '-'}</div>
                        <div className="col-span-2"><span className="font-semibold">Requirements:</span> {b.requirements || b.notes || '-'}</div>
                      </div>
                    </div>
                  );

                  return (
                    <div className="space-y-4">
                      {pending.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Pending Requests ({pending.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pending.map(b => renderItem(b, { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' }))}
                          </div>
                        </div>
                      )}
                      {confirmed.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-800 mb-2">Confirmed & In Progress ({confirmed.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {confirmed.map(b => renderItem(b, { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' }))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {statusInfo.bidReq ? (
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="font-semibold text-indigo-900">Pending</p>
                  <p className="text-sm text-indigo-900 mt-1">Requested Date: {statusInfo.bidReq.eventDate || '—'}</p>
                  {statusInfo.bidReq.location && (
                    <p className="text-sm text-indigo-900">Location: {statusInfo.bidReq.location}</p>
                  )}
                  {/* Booking action moved to card; inputs removed here per request */}
                </div>
              ) : null}

              {!statusInfo.booking && !statusInfo.bidReq ? (
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="font-semibold text-green-900">Available</p>
                  <p className="text-sm text-green-900 mt-1">This service is available to book.</p>
                  {/* Booking action moved to card; inputs removed here per request */}
                </div>
              ) : null}

              <div className="flex items-center justify-end pt-4">
                <PremiumButton
                  variant="ghost"
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusInfo(null);
                  }}
                >
                  Close
                </PremiumButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Event Need Modal */}
      {showEventNeedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
                <p className="text-sm text-gray-600 mt-1">Share your event details and get responses from providers</p>
              </div>
              <button
                onClick={() => {
                  setShowEventNeedModal(false);
                  setEventNeedForm({
                    eventName: '',
                    eventType: '',
                    eventDate: '',
                    location: '',
                    headcount: '',
                    budget: '',
                    needWholeTeam: false
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handlePostEventNeed();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={eventNeedForm.eventName}
                  onChange={(e) => setEventNeedForm({ ...eventNeedForm, eventName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your event name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Type *
                </label>
                <input
                  list="eventTypes"
                  value={eventNeedForm.eventType}
                  onChange={(e) => setEventNeedForm({ ...eventNeedForm, eventType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="Select or type your event type"
                  required
                />
                <datalist id="eventTypes">
                  <option value="Birthday" />
                  <option value="Wedding" />
                  <option value="Corporate" />
                  <option value="Anniversary" />
                  <option value="Others" />
                  <option value="Graduation" />
                  <option value="Conference" />
                  <option value="Party" />
                  <option value="Celebration" />
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={eventNeedForm.eventDate}
                  onChange={(e) => setEventNeedForm({ ...eventNeedForm, eventDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Address *
                </label>
                <input
                  type="text"
                  value={eventNeedForm.location}
                  onChange={(e) => setEventNeedForm({ ...eventNeedForm, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter event location"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Headcount *
                </label>
                <input
                  type="number"
                  value={eventNeedForm.headcount}
                  onChange={(e) => setEventNeedForm({ ...eventNeedForm, headcount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Number of guests"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget (₹) <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="number"
                  value={eventNeedForm.budget}
                  onChange={(e) => setEventNeedForm({ ...eventNeedForm, budget: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your budget range"
                  min="0"
                />
              </div>

              {/* Checkbox appears only after all other fields are filled */}
              {eventNeedForm.eventName && eventNeedForm.eventType && eventNeedForm.eventDate && eventNeedForm.location && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="needWholeTeam"
                      checked={eventNeedForm.needWholeTeam}
                      onChange={(e) => setEventNeedForm({ ...eventNeedForm, needWholeTeam: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <label htmlFor="needWholeTeam" className="text-sm font-medium text-gray-700">
                      Need a whole team (catering, lights, setup)?
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    {eventNeedForm.needWholeTeam
                      ? "Service providers will be notified"
                      : "Freelancers will be notified"
                    }
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowEventNeedModal(false);
                    setEventNeedForm({
                      eventName: '',
                      eventType: '',
                      eventDate: '',
                      location: '',
                      headcount: '',
                      budget: '',
                      needWholeTeam: false
                    });
                  }}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton type="submit" variant="primary">
                  <Share className="w-4 h-4 mr-2" />
                  Post It
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default CustomerDashboard;