'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Star,
  MessageSquare,
  MessageCircle,
  Bell,
  Settings,
  Upload,
  MapPin,
  User,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  UserPlus,
  UserCheck,
  UserX,
  X,
  Check,
  Briefcase,
  RefreshCw,
  Award,
  ArrowRight,
  Camera,
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import ChatInterface from '../../../components/Chat/ChatInterface';
import EnhancedMessages from '../../../components/Messages/EnhancedMessages';
import AIStaffRecommendationModal from '../../../components/ui/AIStaffRecommendationModal';
import CertificateTemplate from '../../../components/CertificateTemplate';
import MassEmailSender from '../../../components/Email/MassEmailSender';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { debugAuthFlow } from '../../../utils/authFlowTest';

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // AI Staff Recommendation states
  const [showAIRecommendationModal, setShowAIRecommendationModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    isActive: true
  });
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [bidRequests, setBidRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBidRequest, setSelectedBidRequest] = useState(null);
  const [bidForm, setBidForm] = useState({
    price: '',
    description: ''
  });
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [staffJobs, setStaffJobs] = useState([]);
  const [showStaffJobModal, setShowStaffJobModal] = useState(false);
  const [staffJobForm, setStaffJobForm] = useState({
    jobName: '',
    dateTime: '',
    pay: '',
    spotsNeeded: 1
  });
  const [selectedStaffJob, setSelectedStaffJob] = useState(null);
  const [staffJobApplications, setStaffJobApplications] = useState([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [isSubmittingStaffJob, setIsSubmittingStaffJob] = useState(false);
  const [isRefreshingStaffJobs, setIsRefreshingStaffJobs] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  // Freelancer job management state
  const [freelancerJobs, setFreelancerJobs] = useState([]);
  const [showFreelancerJobModal, setShowFreelancerJobModal] = useState(false);
  const [freelancerJobForm, setFreelancerJobForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    hourlyRate: '',
    monthlyPay: '',
    duration: '',
    requirements: '',
    startDate: '',
    endDate: '',
    startHour: '',
    endHour: ''
  });
  const [isSubmittingFreelancerJob, setIsSubmittingFreelancerJob] = useState(false);
  const [selectedFreelancerJob, setSelectedFreelancerJob] = useState(null);
  const [freelancerJobApplications, setFreelancerJobApplications] = useState([]);
  const [showFreelancerApplicationsModal, setShowFreelancerApplicationsModal] = useState(false);
  const [isCalculatingEndDate, setIsCalculatingEndDate] = useState(false);

  // Booking details modal state
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [showMassEmail, setShowMassEmail] = useState(false);

  // Weather state (now integrated into booking details)
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Chat state
  const [chatRooms, setChatRooms] = useState([]);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [loadingChatRooms, setLoadingChatRooms] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  // Staff job functions
  const handlePostStaffJob = async () => {
    try {
      setIsSubmittingStaffJob(true);

      // Validate form
      if (!staffJobForm.jobName || !staffJobForm.dateTime || !staffJobForm.pay || !staffJobForm.spotsNeeded) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate date is in the future
      const selectedDate = new Date(staffJobForm.dateTime);
      if (selectedDate <= new Date()) {
        toast.error('Please select a future date and time');
        return;
      }

      // Validate pay is a positive number
      const payAmount = parseFloat(staffJobForm.pay);
      if (isNaN(payAmount) || payAmount <= 0) {
        toast.error('Please enter a valid pay amount');
        return;
      }

      // Validate spots needed is a positive integer
      const spots = parseInt(staffJobForm.spotsNeeded);
      if (isNaN(spots) || spots <= 0) {
        toast.error('Please enter a valid number of spots needed');
        return;
      }

      // Create staff job via API
      const newJob = await api.staffJobs.postStaffJob({
        jobName: staffJobForm.jobName,
        dateTime: new Date(staffJobForm.dateTime).toISOString(),
        pay: parseFloat(staffJobForm.pay),
        spotsNeeded: parseInt(staffJobForm.spotsNeeded)
      });

      // Add to local state
      setStaffJobs(prev => [newJob, ...prev]);

      // Reset form and close modal
      setStaffJobForm({
        jobName: '',
        dateTime: '',
        pay: '',
        spotsNeeded: 1
      });
      setShowStaffJobModal(false);

      toast.success('Staff job posted successfully!');
    } catch (error) {
      console.error('Error posting staff job:', error);
      toast.error('Failed to post staff job. Please try again.');
    } finally {
      setIsSubmittingStaffJob(false);
    }
  };

  const fetchStaffJobs = async () => {
    try {
      setIsRefreshingStaffJobs(true);
      const jobs = await api.staffJobs.getMyStaffJobs();
      // Ensure jobs is always an array
      setStaffJobs(Array.isArray(jobs) ? jobs : []);
      toast.success('Staff jobs refreshed successfully');
    } catch (error) {
      console.error('Error fetching staff jobs:', error);
      toast.error('Failed to load staff jobs');
      // Set to empty array on error
      setStaffJobs([]);
    } finally {
      setIsRefreshingStaffJobs(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      await api.staffJobs.approveApplication(applicationId);
      toast.success('Application approved! Notification sent to applicant.');

      // Refresh applications
      if (selectedStaffJob) {
        const applications = await api.staffJobs.getStaffJobApplications(selectedStaffJob.id);
        setStaffJobApplications(applications);
      }

      // Refresh staff jobs to update application counts
      fetchStaffJobs();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await api.staffJobs.disapproveApplication(applicationId);
      toast.success('Application rejected.');

      // Refresh applications
      if (selectedStaffJob) {
        const applications = await api.staffJobs.getStaffJobApplications(selectedStaffJob.id);
        setStaffJobApplications(applications);
      }

      // Refresh staff jobs to update application counts
      fetchStaffJobs();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    }
  };

  // Unified handler used by Applications Modal buttons
  const handleApplicationAction = async (applicationId, action) => {
    try {
      if (action === 'approved') {
        await api.staffJobs.approveApplication(applicationId);
        toast.success('Application approved!');
      } else if (action === 'rejected') {
        await api.staffJobs.disapproveApplication(applicationId);
        toast.success('Application disapproved.');
      } else {
        return;
      }

      // Refresh applications list for the selected job
      if (selectedStaffJob) {
        const applications = await api.staffJobs.getStaffJobApplications(selectedStaffJob.id);
        setStaffJobApplications(applications);
      }

      // Refresh jobs to update counts
      fetchStaffJobs();
    } catch (error) {
      console.error('Error handling application action:', error);
      toast.error('Failed to update application');
    }
  };

  const handleViewApplications = async (job) => {
    try {
      setSelectedStaffJob(job);
      const applications = await api.staffJobs.getStaffJobApplications(job.id);
      setStaffJobApplications(applications);
      setShowApplicationsModal(true);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const handleDeleteStaffJob = async (job) => {
    setJobToDelete(job);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteStaffJob = async () => {
    if (!jobToDelete) return;

    setIsDeletingJob(true);
    try {
      await api.staffJobs.deleteStaffJob(jobToDelete.id);

      // Remove from local state
      setStaffJobs(prev => prev.filter(job => job.id !== jobToDelete.id));

      setShowDeleteConfirmModal(false);
      setJobToDelete(null);
      toast.success('Staff job deleted successfully');
    } catch (error) {
      console.error('Error deleting staff job:', error);
      toast.error('Failed to delete staff job');
    } finally {
      setIsDeletingJob(false);
    }
  };

  // Booking details functions
  const handleViewBookingDetails = async (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);

    // Fetch weather data for the booking
    setWeatherLoading(true);
    setWeatherError(null);
    setWeatherData(null);

    try {
      // Format event date to YYYY-MM-DD format to avoid timezone issues
      let formattedEventDate = null;
      if (booking.eventDate) {
        console.log('Frontend - Original event date:', booking.eventDate);
        console.log('Frontend - Event date type:', typeof booking.eventDate);

        const eventDate = new Date(booking.eventDate);
        // Set to noon to avoid timezone edge cases
        eventDate.setHours(12, 0, 0, 0);
        formattedEventDate = eventDate.toISOString().split('T')[0];

        // Check if event date is in the future and within forecast range
        const now = new Date();
        const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        console.log('Frontend - Event date is', daysDiff, 'days from now');
        console.log('Frontend - Current date:', now.toISOString().split('T')[0]);
        console.log('Frontend - Event date:', eventDate.toISOString().split('T')[0]);

        console.log('Frontend - Formatted event date:', formattedEventDate);
        console.log('Frontend - Event date object:', eventDate);
        console.log('Frontend - Event date ISO string:', eventDate.toISOString());
      }

      const response = await api.getWeather(booking.location, formattedEventDate);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherError(error.message || 'Failed to fetch weather data');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleCloseBookingDetailsModal = () => {
    setShowBookingDetailsModal(false);
    setSelectedBooking(null);
    setWeatherData(null);
    setWeatherError(null);
  };

  // Freelancer job functions
  const handlePostFreelancerJob = async () => {
    try {
      setIsSubmittingFreelancerJob(true);

      // Validate form
      if (!freelancerJobForm.title || !freelancerJobForm.description || !freelancerJobForm.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create freelancer job via API
      console.log('Posting freelancer job with data:', {
        title: freelancerJobForm.title,
        description: freelancerJobForm.description,
        category: freelancerJobForm.category,
        location: freelancerJobForm.location,
        hourlyRate: freelancerJobForm.hourlyRate ? parseFloat(freelancerJobForm.hourlyRate) : null,
        duration: freelancerJobForm.duration,
        requirements: freelancerJobForm.requirements ? freelancerJobForm.requirements.split(',').map(r => r.trim()) : [],
        startDate: freelancerJobForm.startDate ? new Date(freelancerJobForm.startDate).toISOString() : null,
        endDate: freelancerJobForm.endDate ? new Date(freelancerJobForm.endDate).toISOString() : null
      });

      const response = await api.providerFreelancer.postJob({
        title: freelancerJobForm.title,
        description: freelancerJobForm.description,
        category: freelancerJobForm.category,
        location: freelancerJobForm.location,
        hourlyRate: isMonthBasedDuration(freelancerJobForm.duration) ? null : (freelancerJobForm.hourlyRate ? parseFloat(freelancerJobForm.hourlyRate) : null),
        monthlyPay: isMonthBasedDuration(freelancerJobForm.duration) ? (freelancerJobForm.monthlyPay ? parseFloat(freelancerJobForm.monthlyPay) : null) : null,
        duration: freelancerJobForm.duration,
        requirements: freelancerJobForm.requirements ? freelancerJobForm.requirements.split(',').map(r => r.trim()) : [],
        startDate: freelancerJobForm.startDate ? new Date(freelancerJobForm.startDate).toISOString() : null,
        endDate: freelancerJobForm.endDate ? new Date(freelancerJobForm.endDate).toISOString() : null,
        startHour: freelancerJobForm.startHour || null,
        endHour: freelancerJobForm.endHour || null
      });

      console.log('API response:', response);

      // Create job object with proper structure
      const newJob = {
        id: response.id || Date.now().toString(),
        title: freelancerJobForm.title,
        description: freelancerJobForm.description,
        category: freelancerJobForm.category,
        location: freelancerJobForm.location,
        hourlyRate: isMonthBasedDuration(freelancerJobForm.duration) ? null : (freelancerJobForm.hourlyRate ? parseFloat(freelancerJobForm.hourlyRate) : null),
        monthlyPay: isMonthBasedDuration(freelancerJobForm.duration) ? (freelancerJobForm.monthlyPay ? parseFloat(freelancerJobForm.monthlyPay) : null) : null,
        duration: freelancerJobForm.duration,
        requirements: freelancerJobForm.requirements ? freelancerJobForm.requirements.split(',').map(r => r.trim()) : [],
        startDate: freelancerJobForm.startDate ? new Date(freelancerJobForm.startDate).toISOString() : null,
        endDate: freelancerJobForm.endDate ? new Date(freelancerJobForm.endDate).toISOString() : null,
        startHour: freelancerJobForm.startHour || null,
        endHour: freelancerJobForm.endHour || null,
        status: 'active',
        applicationsCount: 0,
        createdAt: new Date().toISOString()
      };

      // Add to local state
      console.log('Adding new job to state:', newJob);
      setFreelancerJobs(prev => {
        const updated = [newJob, ...prev];
        console.log('Updated freelancer jobs:', updated);
        return updated;
      });

      // Reset form and close modal
      setFreelancerJobForm({
        title: '',
        description: '',
        category: '',
        location: '',
        hourlyRate: '',
        monthlyPay: '',
        duration: '',
        requirements: '',
        startDate: '',
        endDate: '',
        startHour: '',
        endHour: ''
      });
      setShowFreelancerJobModal(false);

      toast.success('Freelancer job posted successfully!');
    } catch (error) {
      console.error('Error posting freelancer job:', error);
      toast.error('Failed to post freelancer job. Please try again.');
    } finally {
      setIsSubmittingFreelancerJob(false);
    }
  };

  const fetchFreelancerJobs = async () => {
    try {
      const response = await api.providerFreelancer.getJobs();
      console.log('Freelancer jobs response:', response);

      // Handle different response structures
      let jobs = [];
      if (Array.isArray(response)) {
        jobs = response;
      } else if (response && Array.isArray(response.data)) {
        jobs = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        jobs = response.data;
      }

      // Ensure each job has required properties
      const processedJobs = jobs.map((job, index) => ({
        id: job.id || `job-${index}`,
        title: job.title || 'Untitled Job',
        description: job.description || '',
        category: job.category || 'other',
        location: job.location || '',
        hourlyRate: job.hourlyRate || null,
        duration: job.duration || '',
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        startDate: job.startDate || null,
        endDate: job.endDate || null,
        status: job.status || 'active',
        applicationsCount: job.applicationsCount || 0,
        createdAt: job.createdAt || new Date().toISOString()
      }));

      setFreelancerJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching freelancer jobs:', error);
      toast.error('Failed to load freelancer jobs');
      // Set empty array as fallback
      setFreelancerJobs([]);
    }
  };

  const handleViewFreelancerApplications = async (job) => {
    try {
      setSelectedFreelancerJob(job);
      const applications = await api.providerFreelancer.getJobApplications(job.id);
      setFreelancerJobApplications(applications);
      setShowFreelancerApplicationsModal(true);
    } catch (error) {
      console.error('Error fetching freelancer applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const handleAcceptFreelancerApplication = async (applicationId) => {
    try {
      await api.providerFreelancer.acceptApplication(applicationId);
      toast.success('Application accepted! Notification sent to freelancer.');

      // Refresh applications
      if (selectedFreelancerJob) {
        const applications = await api.providerFreelancer.getJobApplications(selectedFreelancerJob.id);
        setFreelancerJobApplications(applications);
      }

      // Refresh jobs
      fetchFreelancerJobs();
    } catch (error) {
      console.error('Error accepting freelancer application:', error);
      toast.error('Failed to accept application');
    }
  };

  const handleRejectFreelancerApplication = async (applicationId) => {
    try {
      await api.providerFreelancer.rejectApplication(applicationId, 'Not selected for this project');
      toast.success('Application rejected.');

      // Refresh applications
      if (selectedFreelancerJob) {
        const applications = await api.providerFreelancer.getJobApplications(selectedFreelancerJob.id);
        setFreelancerJobApplications(applications);
      }

      // Refresh jobs
      fetchFreelancerJobs();
    } catch (error) {
      console.error('Error rejecting freelancer application:', error);
      toast.error('Failed to reject application');
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    setIsDeletingJob(true);
    try {
      console.log('Attempting to delete job:', jobToDelete.id);
      console.log('API endpoint:', `/provider-freelancer/jobs/${jobToDelete.id}`);
      console.log('Current user:', user);
      console.log('User profile:', userProfile);

      // Check if this is a test job or local-only job
      if (jobToDelete.id.startsWith('test-job-') || jobToDelete.id.startsWith('job-')) {
        console.log('Deleting local test job, not making API call');
        // Just remove from local state for test jobs
        setFreelancerJobs(prev => prev.filter(job => job.id !== jobToDelete.id));
        setShowDeleteConfirmModal(false);
        setJobToDelete(null);
        toast.success('Freelancer job deleted successfully');
        return;
      }

      const response = await api.providerFreelancer.deleteJob(jobToDelete.id);
      console.log('Delete response:', response);

      // Remove from local state
      setFreelancerJobs(prev => prev.filter(job => job.id !== jobToDelete.id));

      // Close modal and reset state
      setShowDeleteConfirmModal(false);
      setJobToDelete(null);

      toast.success('Freelancer job deleted successfully');
    } catch (error) {
      console.error('Error deleting freelancer job:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });

      // If it's a 404 error, the job might already be deleted, so just remove from local state
      if (error.status === 404) {
        console.log('Job not found in database, removing from local state');
        setFreelancerJobs(prev => prev.filter(job => job.id !== jobToDelete.id));
        setShowDeleteConfirmModal(false);
        setJobToDelete(null);
        toast.success('Freelancer job deleted successfully');
      } else {
        toast.error('Failed to delete freelancer job');
      }
    } finally {
      setIsDeletingJob(false);
    }
  };

  const confirmDeleteJob = (job) => {
    setJobToDelete(job);
    setShowDeleteConfirmModal(true);
  };

  // Calculate end date and time based on duration, start date, and start hour
  const calculateEndDateTime = (duration, startDate, startHour) => {
    if (!duration || !startDate) return { endDate: '', endHour: '' };

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return { endDate: '', endHour: '' };

    // Parse duration - support formats like "5 days", "8 hours", "2 weeks", etc.
    const durationStr = duration.toLowerCase().trim();
    const match = durationStr.match(/(\d+)\s*(day|days|hour|hours|week|weeks|month|months)/);

    if (!match) return { endDate: '', endHour: '' };

    const amount = parseInt(match[1]);
    const unit = match[2];

    const endDateTime = new Date(start);

    // If start hour is provided, set it
    if (startHour) {
      const [hours, minutes] = startHour.split(':').map(Number);
      endDateTime.setHours(hours, minutes || 0, 0, 0);
    }

    switch (unit) {
      case 'hour':
      case 'hours':
        endDateTime.setHours(endDateTime.getHours() + amount);
        break;
      case 'day':
      case 'days':
        endDateTime.setDate(endDateTime.getDate() + amount);
        break;
      case 'week':
      case 'weeks':
        endDateTime.setDate(endDateTime.getDate() + (amount * 7));
        break;
      case 'month':
      case 'months':
        endDateTime.setMonth(endDateTime.getMonth() + amount);
        break;
      default:
        return { endDate: '', endHour: '' };
    }

    const endDate = endDateTime.toISOString().split('T')[0];
    const endHour = endDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    return { endDate, endHour };
  };

  // Check if duration is hour-based
  const isHourBasedDuration = (duration) => {
    if (!duration) return false;
    const durationStr = duration.toLowerCase().trim();
    return durationStr.includes('hour');
  };

  // Check if duration is month-based
  const isMonthBasedDuration = (duration) => {
    if (!duration) return false;
    const durationStr = duration.toLowerCase().trim();
    return durationStr.includes('month');
  };

  // Handle duration change with automatic end date calculation
  const handleDurationChange = (duration) => {
    const updatedForm = { ...freelancerJobForm, duration };

    // If start date is set, calculate end date automatically
    if (freelancerJobForm.startDate) {
      setIsCalculatingEndDate(true);
      setTimeout(() => {
        const calculated = calculateEndDateTime(duration, freelancerJobForm.startDate, freelancerJobForm.startHour);
        if (calculated.endDate) {
          updatedForm.endDate = calculated.endDate;
        }
        if (calculated.endHour) {
          updatedForm.endHour = calculated.endHour;
        }
        setFreelancerJobForm(updatedForm);
        setIsCalculatingEndDate(false);
      }, 100); // Small delay to show calculation state
    } else {
      setFreelancerJobForm(updatedForm);
    }
  };

  // Handle start date change with automatic end date calculation
  const handleStartDateChange = (startDate) => {
    const updatedForm = { ...freelancerJobForm, startDate };

    // If duration is set, calculate end date automatically
    if (freelancerJobForm.duration) {
      setIsCalculatingEndDate(true);
      setTimeout(() => {
        const calculated = calculateEndDateTime(freelancerJobForm.duration, startDate, freelancerJobForm.startHour);
        if (calculated.endDate) {
          updatedForm.endDate = calculated.endDate;
        }
        if (calculated.endHour) {
          updatedForm.endHour = calculated.endHour;
        }
        setFreelancerJobForm(updatedForm);
        setIsCalculatingEndDate(false);
      }, 100); // Small delay to show calculation state
    } else {
      setFreelancerJobForm(updatedForm);
    }
  };

  // Handle start hour change with automatic end hour calculation
  const handleStartHourChange = (startHour) => {
    const updatedForm = { ...freelancerJobForm, startHour };

    // If duration and start date are set, calculate end date and hour automatically
    if (freelancerJobForm.duration && freelancerJobForm.startDate) {
      setIsCalculatingEndDate(true);
      setTimeout(() => {
        const calculated = calculateEndDateTime(freelancerJobForm.duration, freelancerJobForm.startDate, startHour);
        if (calculated.endDate) {
          updatedForm.endDate = calculated.endDate;
        }
        if (calculated.endHour) {
          updatedForm.endHour = calculated.endHour;
        }
        setFreelancerJobForm(updatedForm);
        setIsCalculatingEndDate(false);
      }, 100);
    } else {
      setFreelancerJobForm(updatedForm);
    }
  };

  // Chat functions
  const loadChatRooms = async () => {
    try {
      setLoadingChatRooms(true);
      const response = await api.getChatRooms();
      if (response.success) {
        setChatRooms(response.data || []);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast.error('Failed to load chat rooms');
    } finally {
      setLoadingChatRooms(false);
    }
  };

  const loadAvailablePartners = async () => {
    try {
      setLoadingPartners(true);
      console.log('Loading available partners...');
      const response = await api.getAvailablePartners();
      console.log('Available partners response:', response);

      if (response.success) {
        console.log('Setting available partners:', response.data);
        setAvailablePartners(response.data || []);
      } else {
        console.error('Failed to load partners:', response);
        toast.error(response.message || 'Failed to load available partners');
      }
    } catch (error) {
      console.error('Error loading available partners:', error);
      toast.error('Failed to load available partners');
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleStartChat = async (partnerId) => {
    try {
      const response = await api.createChatRoom(partnerId);
      if (response.success) {
        setActiveChatRoomId(response.data.roomId);
        await loadChatRooms(); // Refresh chat rooms
        toast.success('Chat started successfully!');
      } else {
        toast.error(response.message || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  // Persist active tab across page reloads
  useEffect(() => {
    const savedTab = localStorage.getItem('providerDashboardActiveTab');
    if (savedTab && ['overview', 'services', 'profile', 'hire-staff', 'hire-freelancers', 'bookings', 'messages', 'notifications'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('providerDashboardActiveTab', activeTab);
  }, [activeTab]);

  // Check if user is authenticated and profile is complete
  useEffect(() => {
    let timeoutId = null;

    const checkProfileAndRedirect = async () => {
      // Wait for auth context to initialize
      if (authLoading) {
        console.log('Auth context still loading...');
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to login');
        // Only show error toast if we're not already on the login page
        if (window.location.pathname !== '/auth/login') {
          toast.error('Please log in to access your dashboard');
        }
        router.push('/auth/login');
        return;
      }

      // If userProfile is null but user exists, wait a bit more for profile to load
      if (userProfile === null) {
        console.log('User authenticated but profile not loaded yet, waiting...');
        setDashboardLoading(true);

        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (userProfile === null) {
            console.log('Profile loading timeout - user may need onboarding');
            router.push('/provider/onboarding');
          }
        }, 3000); // Reduced timeout to 3 seconds
        return;
      }

      // Clear timeout if profile loaded
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log('User profile found:', userProfile);

      // Debug the authentication flow
      const debugResult = debugAuthFlow(user, userProfile, 'ProviderDashboard');
      console.log('Debug result:', debugResult);

      // Check if user is a service provider
      const providerRoles = ['event_company', 'caterer', 'transport', 'photographer'];
      if (!providerRoles.includes(userProfile.role)) {
        console.log('User is not a service provider, redirecting to appropriate dashboard');
        if (userProfile.role === 'customer') {
          router.push('/customer/dashboard');
        } else if (userProfile.role === 'freelancer') {
          router.push('/freelancer/dashboard');
        } else if (userProfile.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/customer/dashboard');
        }
        return;
      }

      // Check if profile is complete - if not, redirect to onboarding
      const isProfileComplete = userProfile.profileComplete || userProfile.completed;
      if (!isProfileComplete) {
        console.log('Service provider profile incomplete, redirecting to onboarding');
        router.push('/provider/onboarding');
        return;
      }

      console.log('Service provider profile complete, loading dashboard');
      setProfileData(userProfile);
      setDashboardLoading(false);
    };

    checkProfileAndRedirect();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, userProfile, router, authLoading]);

  // Load services when profile is loaded
  useEffect(() => {
    if (profileData) {
      loadServices();
      loadBidRequests();
      loadBookings();
      fetchStaffJobs();
      console.log('Initial load - fetching freelancer jobs...');
      fetchFreelancerJobs();
      // Load chat data
      loadChatRooms();
      loadAvailablePartners();
      setEditedProfile({
        businessName: profileData.businessName || '',
        description: profileData.description || '',
        location: profileData.location || '',
        phone: profileData.phone || '',
        website: profileData.website || '',
        socialMedia: {
          instagram: profileData.socialMedia?.instagram || '',
          facebook: profileData.socialMedia?.facebook || '',
          twitter: profileData.socialMedia?.twitter || ''
        }
      });
    }
  }, [profileData]);

  // Service management functions
  const loadServices = async () => {
    try {
      const response = await api.services.getMyServices();
      setServices(response.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    }
  };

  // Load bid requests for provider
  const loadBidRequests = async () => {
    try {
      const response = await api.getProviderBidRequests();
      setBidRequests(response.data || []);
    } catch (error) {
      console.error('Error loading bid requests:', error);
      toast.error('Failed to load bid requests');
    }
  };

  // Load bookings for provider
  const loadBookings = async () => {
    try {
      const response = await api.getBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const handleAddService = async () => {
    try {
      if (!serviceForm.name || !serviceForm.description || !serviceForm.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      const serviceData = {
        ...serviceForm,
        price: parseFloat(serviceForm.price)
      };

      await api.services.createService(serviceData);
      toast.success('Service added successfully!');

      // Close modal and reset form state
      setShowAddServiceModal(false);
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        isActive: true
      });
      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const handleEditService = async () => {
    try {
      if (!serviceForm.name || !serviceForm.description || !serviceForm.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      const serviceData = {
        ...serviceForm,
        price: parseFloat(serviceForm.price)
      };

      await api.services.updateService(editingService.id, serviceData);
      toast.success('Service updated successfully!');

      // Close modal and reset form state
      setShowAddServiceModal(false);
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        isActive: true
      });
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.services.deleteService(serviceId);
      toast.success('Service deleted successfully!');
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const openEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      duration: service.duration || '',
      category: service.category || '',
      isActive: service.isActive !== false
    });
    setShowAddServiceModal(true);
  };

  // Profile management functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      await api.updateUserProfile(editedProfile);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
      // Update local profile data
      setProfileData({ ...profileData, ...editedProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({
      businessName: profileData.businessName || '',
      description: profileData.description || '',
      location: profileData.location || '',
      phone: profileData.phone || '',
      website: profileData.website || '',
      socialMedia: {
        instagram: profileData.socialMedia?.instagram || '',
        facebook: profileData.socialMedia?.facebook || '',
        twitter: profileData.socialMedia?.twitter || ''
      }
    });
  };

  // Profile picture upload function
  const handleProfilePictureUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setIsUploadingPicture(true);

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('profilePicture', file);

        // Upload to backend
        const response = await api.uploadProfilePicture(formData);

        // Update profile data with new picture URL
        setProfileData({ ...profileData, profilePicture: response.profilePictureUrl });
        toast.success('Profile picture updated successfully!');
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Failed to upload profile picture');
      } finally {
        setIsUploadingPicture(false);
      }
    };
    input.click();
  };

  // Bid submission functions
  const handleSubmitOffer = (bidRequest) => {
    setSelectedBidRequest(bidRequest);
    setBidForm({
      price: '',
      description: `I would like to provide ${bidRequest.eventType} services for your event. I have experience in this field and can deliver quality service within your requirements.`
    });
    setShowBidModal(true);
  };

  // Handle booking acceptance/decline
  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.acceptBooking(bookingId);
      toast.success('Booking accepted successfully!');
      loadBookings(); // Refresh bookings
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error('Failed to accept booking');
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    try {
      await api.declineBooking(bookingId);
      toast.success('Booking declined');
      loadBookings(); // Refresh bookings
    } catch (error) {
      console.error('Error declining booking:', error);
      toast.error('Failed to decline booking');
    }
  };

  const handleBidSubmit = async () => {
    if (!bidForm.price) {
      toast.error('Please enter your price');
      return;
    }

    if (parseFloat(bidForm.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmittingBid(true);
    try {
      await api.submitBid(selectedBidRequest.id, {
        price: parseFloat(bidForm.price),
        description: bidForm.description || `I would like to provide ${selectedBidRequest.eventType} services for your event. I have experience in this field and can deliver quality service within your requirements.`
      });

      toast.success('Bid submitted successfully!');
      setShowBidModal(false);
      setBidForm({ price: '', description: '' });
      setSelectedBidRequest(null);

      // Refresh bid requests to show updated status
      loadBidRequests();
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast.error(`Failed to submit bid: ${error.message}`);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleCloseBidModal = () => {
    setShowBidModal(false);
    setBidForm({ price: '', description: '' });
    setSelectedBidRequest(null);
  };

  // AI Staff Recommendation functions
  const handleAIStaffRecommendation = async (bookingId) => {
    try {
      setAiLoading(true);
      setSelectedBooking(bookings.find(b => b.id === bookingId));
      setShowAIRecommendationModal(true);

      const response = await api.staffJobs.getAIRecommendations(bookingId);

      if (response.success) {
        console.log('AI Recommendations received:', response.data.recommendations);
        setAiRecommendations(response.data.recommendations);
        setSelectedBooking(response.data.booking);

        // Show info message if using fallback recommendations
        if (response.data.isFallback) {
          toast.info('Using standard recommendations (AI service not available)');
        }
      } else {
        toast.error(response.message || 'Failed to get AI recommendations');
        setShowAIRecommendationModal(false);
      }
    } catch (error) {
      console.error('AI recommendation error:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to get AI recommendations';
      if (error.message && error.message.includes('Google AI API key')) {
        errorMessage = 'AI service is not configured. Please contact support.';
      } else if (error.message && error.message.includes('Unable to connect')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }

      toast.error(errorMessage);
      setShowAIRecommendationModal(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveRecommendations = async (recommendations) => {
    try {
      const response = await api.staffJobs.bulkCreateJobs(recommendations);
      console.log('Bulk create response:', response);

      if (response.success) {
        // Handle different response structures
        let staffJobs = [];
        let freelancerJobs = [];
        let total = 0;

        if (response.data) {
          // New structure with separate arrays
          if (response.data.staffJobs && response.data.freelancerJobs) {
            staffJobs = response.data.staffJobs || [];
            freelancerJobs = response.data.freelancerJobs || [];
            total = response.data.total || (staffJobs.length + freelancerJobs.length);
          }
          // Legacy structure (array of jobs)
          else if (Array.isArray(response.data)) {
            // Count by job type
            staffJobs = response.data.filter(job => job.jobName || job.jobType === 'staff' || !job.jobType);
            freelancerJobs = response.data.filter(job => job.jobType === 'freelancer');
            total = response.data.length;
          }
          // Fallback
          else {
            total = response.data.length || 0;
            staffJobs = response.data || [];
          }
        }

        // Show detailed success message
        let message = `${total} jobs created successfully!`;
        if (staffJobs.length > 0 && freelancerJobs.length > 0) {
          message = `${staffJobs.length} staff jobs and ${freelancerJobs.length} freelancer jobs created!`;
        } else if (staffJobs.length > 0) {
          message = `${staffJobs.length} staff jobs created!`;
        } else if (freelancerJobs.length > 0) {
          message = `${freelancerJobs.length} freelancer jobs created!`;
        }

        toast.success(message, {
          duration: 4000,
          style: {
            background: '#10B981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500'
          }
        });

        setShowAIRecommendationModal(false);
        setAiRecommendations([]);
        setSelectedBooking(null);

        // Navigate to hire staff tab
        setActiveTab('hire-staff');
      } else {
        toast.error(response.message || 'Failed to create jobs');
      }
    } catch (error) {
      console.error('Approve recommendations error:', error);
      toast.error('Failed to create jobs');
    }
  };

  // Show loading state
  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no profile data
  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <PremiumCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile data.</p>
          <PremiumButton onClick={() => router.push('/provider/onboarding')}>
            Complete Profile Setup
          </PremiumButton>
        </PremiumCard>
      </div>
    );
  }



  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{profileData?.totalBookings || '0'}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{profileData?.totalRevenue || '₹0'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">{profileData?.rating || '0.0'}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6" hoverEffect="lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profile Views</p>
              <p className="text-3xl font-bold text-gray-900">{profileData?.profileViews || '0'}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Recent Bookings */}
      <PremiumCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
          <PremiumButton variant="ghost" size="sm">
            View All
          </PremiumButton>
        </div>
        <div className="space-y-4">
          {profileData?.recentBookings && profileData.recentBookings.length > 0 ? (
            profileData.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{booking.customer || booking.customerName}</p>
                  <p className="text-sm text-gray-600">{booking.service || booking.serviceName}</p>
                  <p className="text-sm text-gray-500">{booking.date || booking.eventDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{booking.amount || booking.totalAmount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent bookings found</p>
              <p className="text-sm">Your bookings will appear here once customers start booking your services.</p>
            </div>
          )}
        </div>
      </PremiumCard>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Services</h2>
        <PremiumButton variant="primary" size="lg" onClick={() => {
          setEditingService(null);
          setServiceForm({
            name: '',
            description: '',
            price: '',
            duration: '',
            category: '',
            isActive: true
          });
          setShowAddServiceModal(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Add Service
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services && services.length > 0 ? (
          services.map((service) => (
            <PremiumCard key={service.id} className="p-6" hoverEffect="lift">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name || service.serviceName}</h3>
                  <p className="text-gray-600 mb-3">{service.description || 'No description provided'}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ₹{service.price || service.basePrice || 'Contact for pricing'}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration || 'Varies'}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {service.bookings || '0'} bookings
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditService(service)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${service.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {service.isActive !== false ? 'Active' : 'Inactive'}
                </span>
                <PremiumButton variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </PremiumButton>
              </div>
            </PremiumCard>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Added</h3>
            <p className="mb-4">Start by adding your first service to attract customers.</p>
            <PremiumButton variant="primary" size="lg" onClick={() => {
              setEditingService(null);
              setServiceForm({
                name: '',
                description: '',
                price: '',
                duration: '',
                category: '',
                isActive: true
              });
              setShowAddServiceModal(true);
            }}>
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Service
            </PremiumButton>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
        {!isEditingProfile ? (
          <PremiumButton variant="primary" size="lg" onClick={handleEditProfile}>
            <Edit className="w-5 h-5 mr-2" />
            Edit Profile
          </PremiumButton>
        ) : (
          <div className="flex space-x-3">
            <PremiumButton variant="ghost" size="lg" onClick={handleCancelEdit}>
              Cancel
            </PremiumButton>
            <PremiumButton variant="primary" size="lg" onClick={handleSaveProfile}>
              Save Changes
            </PremiumButton>
          </div>
        )}
      </div>

      {/* Profile Picture Section */}
      <PremiumCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Picture</h3>
        <div className="flex items-center space-x-6">
          <img
            src={profileData?.profilePicture || userProfile?.profilePicture || user?.photoURL || "https://images.unsplash.com/photo-1522204523234-8729aa607dc7?w=100"}
            alt="Profile Picture"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          <div>
            <p className="text-gray-900 font-semibold">{profileData?.businessName || profileData?.name || 'Service Provider'}</p>
            <p className="text-gray-600 text-sm">Profile picture from your account</p>
            {isEditingProfile && (
              <PremiumButton
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={handleProfilePictureUpload}
                disabled={isUploadingPicture}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingPicture ? 'Uploading...' : 'Change Picture'}
              </PremiumButton>
            )}
          </div>
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editedProfile.businessName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              ) : (
                <p className="text-gray-900">{profileData.businessName || profileData.name || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <p className="text-gray-900">{profileData.category || profileData.categories?.[0] || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              {isEditingProfile ? (
                <textarea
                  value={editedProfile.description}
                  onChange={(e) => setEditedProfile({ ...editedProfile, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              ) : (
                <p className="text-gray-900">{profileData.description || 'No description provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="City, State"
                />
              ) : (
                <p className="text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {profileData.location || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              {isEditingProfile ? (
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              ) : (
                <p className="text-gray-900 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {profileData.phone || 'Not provided'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <p className="text-gray-900 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {profileData.email || user?.email || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
              {isEditingProfile ? (
                <input
                  type="url"
                  value={editedProfile.website}
                  onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                <p className="text-gray-900 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  {profileData.website || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-pink-50 rounded-xl">
            <Instagram className="w-6 h-6 text-pink-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Instagram</p>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editedProfile.socialMedia?.instagram || ''}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    socialMedia: { ...editedProfile.socialMedia, instagram: e.target.value }
                  })}
                  className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="@username"
                />
              ) : (
                <p className="text-sm text-gray-600">{profileData?.socialMedia?.instagram || 'Not connected'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
            <Facebook className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Facebook</p>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editedProfile.socialMedia?.facebook || ''}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    socialMedia: { ...editedProfile.socialMedia, facebook: e.target.value }
                  })}
                  className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="Page URL"
                />
              ) : (
                <p className="text-sm text-gray-600">{profileData?.socialMedia?.facebook || 'Not connected'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-sky-50 rounded-xl">
            <Twitter className="w-6 h-6 text-sky-500" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Twitter</p>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={editedProfile.socialMedia?.twitter || ''}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    socialMedia: { ...editedProfile.socialMedia, twitter: e.target.value }
                  })}
                  className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="@username"
                />
              ) : (
                <p className="text-sm text-gray-600">{profileData?.socialMedia?.twitter || 'Not connected'}</p>
              )}
            </div>
          </div>
        </div>
      </PremiumCard>
    </div>
  );

  const renderHireStaff = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hire Staff</h2>
        <div className="flex items-center gap-3">
          <PremiumButton
            variant="ghost"
            size="lg"
            onClick={fetchStaffJobs}
            disabled={isRefreshingStaffJobs}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50"
            title="Refresh staff jobs"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshingStaffJobs ? 'animate-spin' : ''}`} />
            {isRefreshingStaffJobs ? 'Refreshing...' : 'Refresh'}
          </PremiumButton>
          <PremiumButton
            variant="primary"
            size="lg"
            onClick={() => setShowStaffJobModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post Job
          </PremiumButton>
        </div>
      </div>

      {/* Staff Jobs List */}
      <div className="space-y-4">
        {!Array.isArray(staffJobs) || staffJobs.length === 0 ? (
          <PremiumCard className="p-12 text-center">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Jobs Posted</h3>
            <p className="text-gray-600 mb-6">Start hiring staff for your events by posting your first job.</p>
            <PremiumButton
              variant="primary"
              onClick={() => setShowStaffJobModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post Your First Job
            </PremiumButton>
          </PremiumCard>
        ) : (
          staffJobs.map((job) => (
            <PremiumCard
              key={job.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => handleViewApplications(job)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.jobName}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(job.dateTime).toLocaleDateString()} at {new Date(job.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{job.pay}</p>
                    <p className="text-sm text-gray-600">
                      {job.spotsNeeded} spots • {job.spotsApplied || 0} applied
                    </p>
                    {job.spotsApproved > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        {job.spotsApproved} approved
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStaffJob(job);
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </PremiumCard>
          ))
        )}
      </div>
    </div>
  );

  const renderHireFreelancers = () => {
    console.log('Rendering hire freelancers, jobs:', freelancerJobs);
    console.log('Jobs length:', freelancerJobs?.length);
    console.log('Is array:', Array.isArray(freelancerJobs));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Hire Freelancers</h2>
          <PremiumButton
            variant="primary"
            size="lg"
            onClick={() => setShowFreelancerJobModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post Freelancer Job
          </PremiumButton>
        </div>

        {/* Freelancer Jobs List */}
        <div className="space-y-4">
          {!Array.isArray(freelancerJobs) || freelancerJobs.length === 0 ? (
            <PremiumCard className="p-12 text-center">
              <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Freelancer Jobs Posted</h3>
              <p className="text-gray-600 mb-6">Start hiring freelancers for your projects by posting your first job.</p>
              <PremiumButton
                variant="primary"
                onClick={() => setShowFreelancerJobModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Your First Freelancer Job
              </PremiumButton>
            </PremiumCard>
          ) : (
            freelancerJobs.map((job, index) => {
              console.log('Rendering job:', job, 'index:', index);
              return (
                <PremiumCard
                  key={job.id || `job-${index}`}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewFreelancerApplications(job)}
                    >
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.category}</p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">{job.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        {job.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {(job.hourlyRate || job.monthlyPay) && (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>
                              {job.monthlyPay
                                ? `₹${job.monthlyPay}/month`
                                : `₹${job.hourlyRate}/hr`
                              }
                            </span>
                          </div>
                        )}
                        {job.duration && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{job.duration}</span>
                          </div>
                        )}
                        {job.startDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(job.startDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteJob(job);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {job.applicationsCount || 0} applications
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {job.status}
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const sidebarNavItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'services', label: 'My Services', icon: Settings },
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'hire-staff', label: 'Hire Staff', icon: UserPlus },
    { id: 'hire-freelancers', label: 'Hire Freelancers', icon: UserCheck },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'features', label: 'Features', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const renderMessages = () => (
    <div className="h-[700px]">
      <EnhancedMessages />
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
        <PremiumButton variant="ghost" size="sm" onClick={() => { loadBidRequests(); loadBookings(); }}>
          Refresh
        </PremiumButton>
      </div>

      {/* Pending Requests Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Pending Requests</h3>
        {bidRequests.filter(r => r.hasProviderBid && (r.providerBid?.status === 'pending' || r.status === 'open')).length > 0 ? (
          <div className="grid gap-4">
            {bidRequests
              .filter(r => r.hasProviderBid && (r.providerBid?.status === 'pending' || r.status === 'open'))
              .map((request) => (
                <PremiumCard
                  key={request.id}
                  className={`p-6 border-purple-200 bg-purple-50/30`}
                  hoverEffect="lift"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700`}>
                          <Clock className="w-3 h-3 mr-1 inline" />
                          Pending Review
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {request.eventName || `${request.eventType} Event`}
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{request.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{request.guestCount || 'N/A'} guests</span>
                        </div>
                      </div>

                      {request.requirements && (
                        <p className="text-gray-600 text-sm mb-3">
                          <strong>Requirements:</strong> {request.requirements}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>Customer: {request.customerName}</span>
                        <span>•</span>
                        <span>{request.bidCount} bid(s) received</span>
                        <span>•</span>
                        <span>Posted {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>

                      {request.providerBid && (
                        <div className="mt-4 p-4 bg-purple-100 rounded-lg border border-purple-200">
                          <h5 className="font-medium text-purple-900 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Your Bid - {request.providerBid.status === 'pending' ? 'Pending Review' : request.providerBid.status}
                          </h5>
                          <div className="text-sm text-purple-700 space-y-1">
                            <p><strong>Price:</strong> ₹{request.providerBid.price?.toLocaleString()}</p>
                            <p><strong>Description:</strong> {request.providerBid.description}</p>
                            <p><strong>Submitted:</strong> {new Date(request.providerBid.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PremiumCard>
              ))}
          </div>
        ) : (
          <PremiumCard className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">Your submitted bids awaiting review will appear here.</p>
          </PremiumCard>
        )}
      </div>

      {/* Bid Requests Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Bid Requests</h3>
        {bidRequests.filter(r => r.status === 'open' && !r.hasProviderBid).length > 0 ? (
          <div className="grid gap-4">
            {bidRequests
              .filter(r => r.status === 'open' && !r.hasProviderBid)
              .map((request) => (
                <PremiumCard
                  key={request.id}
                  className={`p-6 border-green-200 bg-green-50/30`}
                  hoverEffect="lift"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700`}>
                          Open for Bids
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          <Star className="w-3 h-3 mr-1 inline" />
                          Available
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {request.eventName || `${request.eventType} Event`}
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{request.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{request.guestCount || 'N/A'} guests</span>
                        </div>
                      </div>

                      {request.requirements && (
                        <p className="text-gray-600 text-sm mb-3">
                          <strong>Requirements:</strong> {request.requirements}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>Customer: {request.customerName}</span>
                        <span>•</span>
                        <span>{request.bidCount} bid(s) received</span>
                        <span>•</span>
                        <span>Posted {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Submit Offer Button */}
                    <div className="ml-6">
                      <PremiumButton
                        variant="primary"
                        size="lg"
                        onClick={() => handleSubmitOffer(request)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <DollarSign className="w-5 h-5 mr-2" />
                        Submit Offer
                      </PremiumButton>
                    </div>
                  </div>
                </PremiumCard>
              ))}
          </div>
        ) : (
          <PremiumCard className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bid Requests</h3>
            <p className="text-gray-600">No bid requests available at the moment. Check back later for new opportunities.</p>
          </PremiumCard>
        )}
      </div>

      {/* Pending Direct Bookings Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Pending Direct Bookings</h3>
        {bookings.filter(booking => booking.status === 'pending').length > 0 ? (
          <div className="grid gap-4">
            {bookings.filter(booking => booking.status === 'pending').map((booking) => (
              <PremiumCard key={booking.id} className="p-6 border-yellow-200 bg-yellow-50/30" hoverEffect="lift">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        Pending Approval
                      </div>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {booking.eventName || booking.serviceName || `${booking.eventType} Event`}
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{booking.price || booking.budget}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{booking.guestCount} guests</span>
                      </div>
                    </div>

                    {booking.requirements && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Requirements:</strong> {booking.requirements}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>Customer: {booking.customerName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <PremiumButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptBooking(booking.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </PremiumButton>
                    <PremiumButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeclineBooking(booking.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </PremiumButton>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        ) : (
          <PremiumCard className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Bookings</h3>
            <p className="text-gray-600">Direct booking requests from customers will appear here for your approval.</p>
          </PremiumCard>
        )}
      </div>

      {/* Confirmed Bookings Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Confirmed Bookings</h3>
        {bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed').length > 0 ? (
          <div className="grid gap-4">
            {bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'completed').map((booking) => (
              <PremiumCard key={booking.id} className="p-6" hoverEffect="lift">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {booking.status === 'confirmed' ? 'Confirmed' :
                          booking.status === 'in_progress' ? 'In Progress' :
                            booking.status === 'completed' ? 'Completed' :
                              booking.status === 'cancelled' ? 'Cancelled' :
                                booking.status}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex-1">
                        {(() => {
                          // Try to extract event name from requirements field
                          if (booking.requirements) {
                            const eventNameMatch = booking.requirements.match(/Event Name:\s*(.+?)(?:\s*,\s*Event Type:|$)/i);
                            if (eventNameMatch) {
                              return eventNameMatch[1].trim();
                            }
                          }
                          // Fallback to other fields
                          return booking.eventName || booking.serviceName || booking.title || 'Event';
                        })()}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-gray-600">{booking.location || 'Location not specified'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <PremiumButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBookingDetails(booking)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </PremiumButton>
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium text-sm"
                        onClick={() => handleAIStaffRecommendation(booking.id)}
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Staff Recommendation
                      </button>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        ) : (
          <PremiumCard className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Confirmed Bookings</h3>
            <p className="text-gray-600">Your confirmed bookings will appear here once customers accept your bids.</p>
          </PremiumCard>
        )}
      </div>
    </div>
  );

  const renderFeatures = () => {
    if (showMassEmail) {
      return (
        <div className="space-y-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setShowMassEmail(false)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-3xl font-bold text-slate-900">Mass Email</h2>
          </div>
          <MassEmailSender />
        </div>
      );
    }

    return (
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
                      Create professional certificates for your events and services
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
          <Link href="/provider/id-card">
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

          {/* Mass Email Feature Card */}
          <PremiumCard
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group h-full"
            onClick={() => setShowMassEmail(true)}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Mass Email</h3>
                  <p className="text-slate-600 text-sm">
                    Send emails to multiple recipients using CSV upload
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
                </div>
              </div>
              <div className="flex-1 flex items-end">
                <div className="flex items-center space-x-4 text-xs text-slate-500 w-full">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>CSV Upload</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Bulk Send</span>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
      <PremiumCard className="p-12 text-center">
        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
        <p className="text-gray-600">You don't have any notifications yet. Important updates and alerts will appear here.</p>
      </PremiumCard>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'services':
        return renderServices();
      case 'profile':
        return renderProfile();
      case 'hire-staff':
        return renderHireStaff();
      case 'hire-freelancers':
        return renderHireFreelancers();
      case 'bookings':
        return renderBookings();
      case 'messages':
        return renderMessages();
      case 'features':
        return renderFeatures();
      case 'notifications':
        return renderNotifications();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <motion.aside
        className="w-72 bg-white/90 backdrop-blur-md border-r border-gray-200/20 p-6 flex flex-col shadow-lg fixed h-full z-10"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Eventrra
          </span>
        </div>

        <nav className="flex-grow">
          <ul className="space-y-2">
            {sidebarNavItems.map((item) => (
              <motion.li key={item.id} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-4 w-full px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                    ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={profileData?.profilePicture || userProfile?.profilePicture || user?.photoURL || "https://images.unsplash.com/photo-1522204523234-8729aa607dc7?w=100"}
              alt="Provider Avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-gray-900">{userProfile?.businessName || userProfile?.companyName || 'Service Provider'}</p>
              <p className="text-sm text-gray-600">Service Provider</p>
            </div>
          </div>
          <PremiumButton variant="ghost" className="w-full flex items-center justify-center space-x-2 text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </PremiumButton>
          <PremiumButton
            variant="ghost"
            className="w-full flex items-center justify-center space-x-2 text-gray-700 hover:bg-gray-100 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </PremiumButton>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        className="flex-1 p-10 overflow-y-auto ml-72"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {activeTab === 'overview' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'overview' ? `Welcome ${userProfile?.name ? userProfile.name.split(' ')[0] : 'back'}! Here's what's happening with your business.` :
              activeTab === 'services' ? 'Manage your services and pricing' :
                activeTab === 'profile' ? 'Update your business information' :
                  activeTab === 'analytics' ? 'View your performance metrics' :
                    activeTab === 'messages' ? 'View and respond to customer messages' :
                      activeTab === 'notifications' ? 'Stay updated with important alerts' :
                        'Manage your business'}
          </p>
        </div>

        {renderContent()}
      </motion.main>

      {/* Add/Edit Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => {
                  setShowAddServiceModal(false);
                  setEditingService(null);
                  setServiceForm({
                    name: '',
                    description: '',
                    price: '',
                    duration: '',
                    category: '',
                    isActive: true
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              editingService ? handleEditService() : handleAddService();
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="e.g., Wedding Photography"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  placeholder="Describe your service in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                    placeholder="10000"
                    min="0"
                    step="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                    placeholder="e.g., 8 hours, 2 days"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                >
                  <option value="">Select a category</option>
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

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Service is active and available for booking
                </label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditingService(null);
                    setServiceForm({
                      name: '',
                      description: '',
                      price: '',
                      duration: '',
                      category: '',
                      isActive: true
                    });
                  }}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton type="submit" variant="primary">
                  {editingService ? 'Update Service' : 'Add Service'}
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bid Submission Modal */}
      {showBidModal && selectedBidRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Submit Your Offer</h2>
              <button
                onClick={handleCloseBidModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedBidRequest.eventName || `${selectedBidRequest.eventType} Event`}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Date:</strong> {new Date(selectedBidRequest.eventDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {selectedBidRequest.location}</p>
                <p><strong>Budget:</strong> ₹{selectedBidRequest.budget?.toLocaleString()}</p>
                <p><strong>Guests:</strong> {selectedBidRequest.guestCount || 'N/A'}</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleBidSubmit(); }}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="bidPrice" className="block text-lg font-semibold text-gray-900 mb-4 text-center">
                    How much are you charging?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-semibold text-gray-600">₹</span>
                    <input
                      id="bidPrice"
                      type="number"
                      min="1"
                      step="1"
                      value={bidForm.price}
                      onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                      placeholder="Enter amount"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">Enter your service price in Indian Rupees</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  onClick={handleCloseBidModal}
                  disabled={isSubmittingBid}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingBid || !bidForm.price}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmittingBid ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Staff Job Posting Modal */}
      {showStaffJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Post Staff Job</h2>
              <button
                onClick={() => {
                  setShowStaffJobModal(false);
                  setStaffJobForm({
                    jobName: '',
                    dateTime: '',
                    pay: '',
                    spotsNeeded: 1
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handlePostStaffJob();
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Name *
                </label>
                <input
                  type="text"
                  value={staffJobForm.jobName}
                  onChange={(e) => setStaffJobForm({ ...staffJobForm, jobName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="e.g., Waiter, Sound tech"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={staffJobForm.dateTime}
                  onChange={(e) => setStaffJobForm({ ...staffJobForm, dateTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">End time will be auto-set to 4 hours after start time</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pay *
                </label>
                <input
                  type="text"
                  value={staffJobForm.pay}
                  onChange={(e) => setStaffJobForm({ ...staffJobForm, pay: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                  placeholder="e.g., ₹200/hr or ₹1000 flat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Spots Needed *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={staffJobForm.spotsNeeded}
                  onChange={(e) => setStaffJobForm({ ...staffJobForm, spotsNeeded: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowStaffJobModal(false);
                    setStaffJobForm({
                      jobName: '',
                      dateTime: '',
                      pay: '',
                      spotsNeeded: 1
                    });
                  }}
                  disabled={isSubmittingStaffJob}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingStaffJob}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isSubmittingStaffJob ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Job
                    </>
                  )}
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Applications Modal */}
      {showApplicationsModal && selectedStaffJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedStaffJob.jobName} - Applications</h2>
                <p className="text-gray-600">
                  {new Date(selectedStaffJob.dateTime).toLocaleDateString()} at {new Date(selectedStaffJob.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApplicationsModal(false);
                  setSelectedStaffJob(null);
                  setStaffJobApplications([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {staffJobApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600">Applications will appear here once jobseekers apply.</p>
                </div>
              ) : (
                staffJobApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{application.jobseeker?.name || 'Applicant'}</h4>
                          {application.jobseeker?.email && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {application.jobseeker.email}
                            </p>
                          )}
                          {application.jobseeker?.phone && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {application.jobseeker.phone}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {application.status === 'pending' ? (
                          <>
                            <PremiumButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApplicationAction(application.id, 'rejected')}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Disapprove
                            </PremiumButton>
                            <PremiumButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleApplicationAction(application.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </PremiumButton>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {application.status === 'approved' ? 'Approved' : 'Disapproved'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Freelancer Job Posting Modal */}
      {showFreelancerJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Post Freelancer Job</h2>
              <button
                onClick={() => {
                  setShowFreelancerJobModal(false);
                  setFreelancerJobForm({
                    title: '',
                    description: '',
                    category: '',
                    location: '',
                    hourlyRate: '',
                    monthlyPay: '',
                    duration: '',
                    requirements: '',
                    startDate: '',
                    endDate: '',
                    startHour: '',
                    endHour: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handlePostFreelancerJob();
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={freelancerJobForm.title}
                    onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    placeholder="e.g., Event Photographer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={freelancerJobForm.category}
                    onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="music">Music & Entertainment</option>
                    <option value="catering">Catering</option>
                    <option value="decoration">Decoration</option>
                    <option value="planning">Event Planning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={freelancerJobForm.description}
                  onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                  placeholder="Describe the job requirements and what you're looking for..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={freelancerJobForm.location}
                    onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    placeholder="e.g., Mumbai, India"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {isMonthBasedDuration(freelancerJobForm.duration) ? 'Monthly Pay (₹)' : 'Hourly Rate (₹)'}
                  </label>
                  <input
                    type="number"
                    value={isMonthBasedDuration(freelancerJobForm.duration) ? freelancerJobForm.monthlyPay : freelancerJobForm.hourlyRate}
                    onChange={(e) => {
                      if (isMonthBasedDuration(freelancerJobForm.duration)) {
                        setFreelancerJobForm({ ...freelancerJobForm, monthlyPay: e.target.value });
                      } else {
                        setFreelancerJobForm({ ...freelancerJobForm, hourlyRate: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    placeholder={isMonthBasedDuration(freelancerJobForm.duration) ? "e.g., 50000" : "e.g., 2000"}
                    min="0"
                    step={isMonthBasedDuration(freelancerJobForm.duration) ? "1000" : "100"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isMonthBasedDuration(freelancerJobForm.duration)
                      ? 'Monthly salary for the freelancer'
                      : 'Rate per hour for the freelancer'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={freelancerJobForm.duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    placeholder="e.g., 8 hours, 2 days, 1 week"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: hours, days, weeks, months (e.g., "5 days", "8 hours", "2 weeks", "1 month")
                  </p>
                  {freelancerJobForm.duration && !calculateEndDateTime(freelancerJobForm.duration, '2024-01-01', '09:00').endDate && (
                    <p className="text-xs text-red-500 mt-1">
                      Invalid format. Use formats like "5 days", "8 hours", "2 weeks", "1 month"
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Requirements (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={freelancerJobForm.requirements}
                    onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, requirements: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    placeholder="e.g., 3+ years experience, DSLR camera"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={freelancerJobForm.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    End date will be calculated automatically if duration is set
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                    {freelancerJobForm.duration && freelancerJobForm.startDate && (
                      <span className="text-green-600 text-xs ml-2">(Auto-calculated)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={freelancerJobForm.endDate}
                      onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, endDate: e.target.value })}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white ${freelancerJobForm.duration && freelancerJobForm.startDate ? 'bg-green-50 border-green-200' : ''
                        }`}
                    />
                    {isCalculatingEndDate && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {freelancerJobForm.duration && freelancerJobForm.startDate
                      ? 'Automatically calculated from duration and start date'
                      : 'Set manually or enter duration + start date for auto-calculation'
                    }
                  </p>
                </div>
              </div>

              {/* Hour fields - only show for hour-based durations */}
              {isHourBasedDuration(freelancerJobForm.duration) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={freelancerJobForm.startHour}
                      onChange={(e) => handleStartHourChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set the start time for your job
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time
                      {freelancerJobForm.duration && freelancerJobForm.startDate && freelancerJobForm.startHour && (
                        <span className="text-green-600 text-xs ml-2">(Auto-calculated)</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={freelancerJobForm.endHour}
                        onChange={(e) => setFreelancerJobForm({ ...freelancerJobForm, endHour: e.target.value })}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white ${freelancerJobForm.duration && freelancerJobForm.startDate && freelancerJobForm.startHour ? 'bg-green-50 border-green-200' : ''
                          }`}
                      />
                      {isCalculatingEndDate && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {freelancerJobForm.duration && freelancerJobForm.startDate && freelancerJobForm.startHour
                        ? 'Automatically calculated from duration and start time'
                        : 'Set manually or enter duration + start time for auto-calculation'
                      }
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowFreelancerJobModal(false);
                    setFreelancerJobForm({
                      title: '',
                      description: '',
                      category: '',
                      location: '',
                      hourlyRate: '',
                      monthlyPay: '',
                      duration: '',
                      requirements: '',
                      startDate: '',
                      endDate: '',
                      startHour: '',
                      endHour: ''
                    });
                  }}
                  disabled={isSubmittingFreelancerJob}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingFreelancerJob}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmittingFreelancerJob ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Job
                    </>
                  )}
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Freelancer Applications Modal */}
      {showFreelancerApplicationsModal && selectedFreelancerJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedFreelancerJob.title} - Applications</h2>
                <p className="text-gray-600">{selectedFreelancerJob.category}</p>
              </div>
              <button
                onClick={() => {
                  setShowFreelancerApplicationsModal(false);
                  setSelectedFreelancerJob(null);
                  setFreelancerJobApplications([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {freelancerJobApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600">Applications will appear here once freelancers apply.</p>
                </div>
              ) : (
                freelancerJobApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{application.freelancer?.name || 'Freelancer'}</h4>
                          {application.freelancer?.email && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {application.freelancer.email}
                            </p>
                          )}
                          {application.freelancer?.phone && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {application.freelancer.phone}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {application.status === 'pending' ? (
                          <>
                            <PremiumButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectFreelancerApplication(application.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </PremiumButton>
                            <PremiumButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptFreelancerApplication(application.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Accept
                            </PremiumButton>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {application.status === 'accepted' ? 'Accepted' : 'Rejected'}
                          </span>
                        )}
                      </div>
                    </div>

                    {application.coverLetter && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-1">Cover Letter:</h5>
                        <p className="text-sm text-gray-700">{application.coverLetter}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && jobToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Delete {jobToDelete.jobName ? 'Staff Job' : 'Freelancer Job'}
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<strong>{jobToDelete.jobName || jobToDelete.title}</strong>"?
                This action cannot be undone and will remove all associated applications.
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setJobToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeletingJob}
                >
                  Cancel
                </button>
                <button
                  onClick={jobToDelete.jobName ? confirmDeleteStaffJob : handleDeleteJob}
                  disabled={isDeletingJob}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeletingJob ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Job'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Staff Recommendation Modal */}
      <AIStaffRecommendationModal
        isOpen={showAIRecommendationModal}
        onClose={() => {
          setShowAIRecommendationModal(false);
          setAiRecommendations([]);
          setSelectedBooking(null);
        }}
        recommendations={aiRecommendations}
        booking={selectedBooking}
        onApprove={handleApproveRecommendations}
        isLoading={aiLoading}
      />

      {/* Booking Details Modal */}
      {showBookingDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={handleCloseBookingDetailsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    selectedBooking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      selectedBooking.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                        selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                    }`}>
                    {selectedBooking.status === 'confirmed' ? 'Confirmed' :
                      selectedBooking.status === 'in_progress' ? 'In Progress' :
                        selectedBooking.status === 'completed' ? 'Completed' :
                          selectedBooking.status === 'cancelled' ? 'Cancelled' :
                            selectedBooking.status}
                  </div>
                </div>

                {/* Event Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Event Title</label>
                      <p className="text-gray-900">{(() => {
                        // Try to extract event name from requirements field
                        if (selectedBooking.requirements) {
                          const eventNameMatch = selectedBooking.requirements.match(/Event Name:\s*(.+?)(?:\s*,\s*Event Type:|$)/i);
                          if (eventNameMatch) {
                            return eventNameMatch[1].trim();
                          }
                        }
                        // Fallback to other fields
                        return selectedBooking.eventName || selectedBooking.serviceName || selectedBooking.title || selectedBooking.eventType + ' Event';
                      })()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Event Type</label>
                      <p className="text-gray-900">{selectedBooking.eventType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Event Date</label>
                      <p className="text-gray-900">{new Date(selectedBooking.eventDate).toLocaleDateString()}</p>
                    </div>
                    {selectedBooking.eventTime && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Event Time</label>
                        <p className="text-gray-900">{selectedBooking.eventTime}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-900">{selectedBooking.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Number of Guests</label>
                      <p className="text-gray-900">{selectedBooking.guestCount || 'N/A'} guests</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Price</label>
                      <p className="text-gray-900 text-lg font-semibold">₹{selectedBooking.price}</p>
                    </div>
                    {selectedBooking.budget && selectedBooking.budget !== selectedBooking.price && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Original Budget</label>
                        <p className="text-gray-900">₹{selectedBooking.budget}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                {selectedBooking.requirements && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                    <p className="text-gray-700">{selectedBooking.requirements}</p>
                  </div>
                )}

                {/* Booking Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Booked On</label>
                      <p className="text-gray-900">{new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-gray-900">{new Date(selectedBooking.updatedAt).toLocaleDateString()}</p>
                    </div>
                    {selectedBooking.customerName && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Customer</label>
                        <p className="text-gray-900">{selectedBooking.customerName}</p>
                      </div>
                    )}
                    {selectedBooking.serviceName && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Service</label>
                        <p className="text-gray-900">{selectedBooking.serviceName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weather Forecast Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Cloud className="w-5 h-5 mr-2 text-blue-600" />
                    Weather Forecast
                  </h3>

                  {weatherLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading weather data...</span>
                    </div>
                  )}

                  {weatherError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-red-800 font-medium">Weather Unavailable</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{weatherError}</p>
                    </div>
                  )}

                  {weatherData && !weatherLoading && (
                    <div className="space-y-4">
                      {/* Event Day Forecast - Priority Display */}
                      {weatherData.forecast ? (
                        <div className={`rounded-lg p-4 ${weatherData.forecast.isExactDate ? 'bg-green-50' : 'bg-yellow-50'}`}>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            {weatherData.forecast.isExactDate
                              ? (weatherData.forecast.date ? `Forecast for ${weatherData.forecast.date}` : 'Event Day Forecast')
                              : (weatherData.forecast.date ? `Closest Available Forecast for ${weatherData.forecast.date}` : 'Closest Available Forecast')
                            }
                          </h4>
                          {!weatherData.forecast.isExactDate && (
                            <div className="mb-3 p-2 bg-yellow-100 rounded text-yellow-800 text-sm">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              This is the closest available forecast to your event date.
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src={`https://openweathermap.org/img/wn/${weatherData.forecast.icon}@2x.png`}
                                alt={weatherData.forecast.description}
                                className="w-16 h-16"
                              />
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {weatherData.forecast.temperature}°C
                                </p>
                                <p className="text-sm text-gray-600 capitalize">
                                  {weatherData.forecast.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {weatherData.forecast.time}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>Feels like {weatherData.forecast.feelsLike}°C</p>
                              <p>Humidity: {weatherData.forecast.humidity}%</p>
                              <p>Wind: {weatherData.forecast.windSpeed} km/h</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <span className="text-yellow-800 font-medium">Event Day Forecast Not Available</span>
                          </div>
                          <p className="text-yellow-700 text-sm mt-1">
                            {selectedBooking?.eventDate ? (() => {
                              const eventDate = new Date(selectedBooking.eventDate);
                              const now = new Date();
                              const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

                              if (daysDiff < 0) {
                                return `The event date ${eventDate.toLocaleDateString()} has already passed. Showing current conditions instead.`;
                              } else if (daysDiff > 5) {
                                return `Forecast data for ${eventDate.toLocaleDateString()} is not available. Weather forecasts are only available for the next 5 days. Showing the closest available forecast instead.`;
                              } else {
                                return `Forecast data for ${eventDate.toLocaleDateString()} is not available. Showing the closest available forecast instead.`;
                              }
                            })() :
                              'Forecast data for the event date is not available. Showing the closest available forecast instead.'
                            }
                          </p>
                        </div>
                      )}

                      {/* Current Weather - Secondary Display */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Current Conditions</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <img
                              src={`https://openweathermap.org/img/wn/${weatherData.current.icon}@2x.png`}
                              alt={weatherData.current.description}
                              className="w-12 h-12"
                            />
                            <div>
                              <p className="text-xl font-bold text-gray-900">
                                {weatherData.current.temperature}°C
                              </p>
                              <p className="text-sm text-gray-600 capitalize">
                                {weatherData.current.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>Feels like {weatherData.current.feelsLike}°C</p>
                            <p>Humidity: {weatherData.current.humidity}%</p>
                            <p>Wind: {weatherData.current.windSpeed} km/h</p>
                          </div>
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 text-center">
                          Weather for {weatherData.location.name}, {weatherData.location.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <PremiumButton
                  variant="primary"
                  onClick={handleCloseBookingDetailsModal}
                >
                  Close
                </PremiumButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default ProviderDashboard;
