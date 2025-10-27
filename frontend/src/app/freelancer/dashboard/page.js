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
  Briefcase,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  FileText,
  UserCheck,
  UserX
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import EnhancedMessages from '../../../components/Messages/EnhancedMessages';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

const FreelancerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, userProfile, logout } = useAuth();
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

  // State declarations
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);

  // Freelancer-specific stats - updated to reflect real data
  const stats = {
    activeApplications: myApplications.filter(app => app.status === 'pending').length,
    completedJobs: myApplications.filter(app => app.status === 'accepted').length,
    totalEarnings: '₹45,000', // This could be calculated from completed jobs
    rating: 4.8 // This could be fetched from user profile
  };

  // Mock data for freelancer
  const profile = {
    name: userProfile?.name || 'Alex Johnson',
    title: 'Event Photographer',
    location: 'Mumbai, India',
    phone: '+91 98765 43210',
    email: 'alex@example.com',
    bio: 'Professional photographer with 5+ years of experience in wedding and corporate events.',
    skills: ['Wedding Photography', 'Corporate Events', 'Portrait Photography', 'Video Editing'],
    hourlyRate: '₹2,500',
    availability: 'Available',
    rating: 4.8,
    completedJobs: 12,
    joinedDate: 'Jan 2023'
  };

  const applications = [
    {
      id: 1,
      provider: 'Elite Wedding Planners',
      position: 'Wedding Photographer',
      location: 'Mumbai, India',
      date: '2024-02-15',
      status: 'pending',
      rate: '₹3,000/day',
      description: 'Looking for an experienced wedding photographer for a luxury wedding event.'
    },
    {
      id: 2,
      provider: 'Corporate Events Co.',
      position: 'Event Photographer',
      location: 'Delhi, India',
      date: '2024-02-20',
      status: 'accepted',
      rate: '₹2,500/day',
      description: 'Corporate event photography for product launch event.'
    },
    {
      id: 3,
      provider: 'Dream Weddings',
      position: 'Freelance Photographer',
      location: 'Bangalore, India',
      date: '2024-02-25',
      status: 'rejected',
      rate: '₹2,000/day',
      description: 'Wedding photography for destination wedding in Goa.'
    }
  ];

  useEffect(() => {
    if (!user) return;
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const res = await api.freelancer.getJobs();
        const jobs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setAvailableJobs(jobs);
      } catch (error) {
        console.error('Error fetching freelancer jobs:', error);
        toast.error('Failed to load jobs');
        setAvailableJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };
    
    const loadApplications = async () => {
      try {
        setLoadingApplications(true);
        const res = await api.freelancer.getApplications();
        const applications = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setMyApplications(applications);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
        setMyApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };
    
    loadJobs();
    loadApplications();
  }, [user]);

  const handleApplyFreelancerJob = async (jobId) => {
    try {
      await api.freelancer.applyToJob(jobId, { 
        coverLetter: 'I am interested in this opportunity and available to work.', 
        proposedRate: null, 
        availability: 'available' 
      });
      toast.success('Application submitted successfully!');
      
      // Refresh applications and jobs
      const res = await api.freelancer.getApplications();
      const applications = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setMyApplications(applications);
      
      // Update stats
      setStats({
        activeApplications: applications.filter(app => app.status === 'pending').length,
        completedJobs: applications.filter(app => app.status === 'accepted').length,
        totalEarnings: '₹45,000',
        rating: 4.8
      });
    } catch (error) {
      console.error('Apply to freelancer job error:', error);
      toast.error('Failed to apply. Please try again.');
    }
  };

  const handleStartOnboarding = async (application) => {
    try {
      // Create collaboration record
      await api.freelancer.startCollaboration(application.id);
      
      toast.success('Onboarding started! You are now officially part of the project.');
      
      // Refresh applications
      const res = await api.freelancer.getApplications();
      const applications = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setMyApplications(applications);
      
      // Update stats
      setStats({
        activeApplications: applications.filter(app => app.status === 'pending').length,
        completedJobs: applications.filter(app => app.status === 'accepted').length,
        totalEarnings: '₹45,000',
        rating: 4.8
      });
    } catch (error) {
      console.error('Start onboarding error:', error);
      toast.error('Failed to start onboarding. Please try again.');
    }
  };

  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'applications', label: 'My Applications', icon: Briefcase },
    { id: 'jobs', label: 'Available Jobs', icon: Target },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Message */}
      <PremiumCard className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome {profile.name.split(' ')[0]} to Freelancer Dashboard!</h2>
          <p className="text-lg text-gray-600 mb-6">Find amazing freelance opportunities and grow your career.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Browse Jobs
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg">
              <Eye className="w-5 h-5 mr-2" />
              Update Profile
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active Applications</p>
              <p className="text-3xl font-bold text-slate-900">{stats.activeApplications}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Completed Jobs</p>
              <p className="text-3xl font-bold text-slate-900">{stats.completedJobs}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Earnings</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalEarnings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Rating</p>
              <p className="text-3xl font-bold text-slate-900">{stats.rating}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Recent Applications */}
      <PremiumCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Recent Applications</h3>
          <PremiumButton variant="ghost" size="sm" onClick={() => setActiveTab('applications')}>
            View All
          </PremiumButton>
        </div>
        
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">No applications yet. Start applying to jobs!</p>
            </div>
          ) : (
            myApplications.slice(0, 3).map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {application.job?.title?.charAt(0) || 'J'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{application.job?.title || 'Freelance Job'}</h4>
                  <p className="text-slate-600 text-sm">{application.job?.category || 'General'}</p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    {application.job?.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{application.job.location}</span>
                      </div>
                    )}
                    {application.job?.startDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(application.job.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{application.job?.hourlyRate ? `₹${application.job.hourlyRate}/hr` : 'Rate TBD'}</div>
                  <div className={`text-sm px-3 py-1 rounded-full ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {application.status}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PremiumCard>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">My Applications</h2>
        <PremiumButton variant="primary" size="sm" onClick={() => setActiveTab('jobs')}>
          <Plus className="w-5 h-5 mr-2" />
          Browse Jobs
        </PremiumButton>
      </div>

      {loadingApplications ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : myApplications.length === 0 ? (
        <PremiumCard className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Applications Yet</h3>
          <p className="text-slate-600 mb-4">You haven't applied to any jobs yet. Start browsing available jobs!</p>
          <PremiumButton variant="primary" onClick={() => setActiveTab('jobs')}>
            <Target className="w-4 h-4 mr-2" />
            Browse Jobs
          </PremiumButton>
        </PremiumCard>
      ) : (
        <div className="space-y-4">
          {myApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PremiumCard className="p-6" hoverEffect="lift">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {application.job?.title?.charAt(0) || 'J'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{application.job?.title || 'Freelance Job'}</h3>
                      <p className="text-slate-600">{application.job?.category || 'General'}</p>
                      <p className="text-slate-500 text-sm">{application.job?.description || 'No description available'}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        {application.job?.location && (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{application.job.location}</span>
                          </div>
                        )}
                        {application.job?.startDate && (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{new Date(application.job.startDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {(application.job?.hourlyRate || application.job?.monthlyPay) && (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                              {application.job?.monthlyPay 
                                ? `₹${application.job.monthlyPay}/month` 
                                : `₹${application.job.hourlyRate}/hr`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold mb-2 ${
                      application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      application.status === 'onboarded' ? 'bg-blue-100 text-blue-700' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {application.status === 'onboarded' ? 'Onboarded' : application.status}
                    </div>
                    <p className="text-sm text-slate-500">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {application.status === 'accepted' ? (
                        <PremiumButton 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleStartOnboarding(application)}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Start Onboarding
                        </PremiumButton>
                      ) : application.status === 'onboarded' ? (
                        <PremiumButton 
                          variant="primary" 
                          size="sm"
                          disabled
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Onboarded
                        </PremiumButton>
                      ) : (
                        <PremiumButton variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </PremiumButton>
                      )}
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Available Jobs</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <PremiumButton variant="ghost" size="sm">
            <Filter className="w-5 h-5" />
          </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loadingJobs ? (
          <div className="col-span-2 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : availableJobs.length === 0 ? (
          <PremiumCard className="p-12 text-center col-span-2">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs available</h3>
            <p className="text-slate-600">New freelance jobs will appear here.</p>
          </PremiumCard>
        ) : availableJobs.map((job, index) => {
          const hasApplied = myApplications.some(app => app.jobId === job.id);
          const myApplication = myApplications.find(app => app.jobId === job.id);
          
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PremiumCard className="p-6" hoverEffect="lift">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                    <p className="text-slate-600">{job.category || 'Freelance Job'}</p>
                    <p className="text-slate-500 text-sm mt-2">{job.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-slate-900">
                      {(job.hourlyRate || job.monthlyPay) ? 
                        (job.monthlyPay ? `₹${job.monthlyPay}/month` : `₹${job.hourlyRate}/hr`) : 
                        'Rate TBD'
                      }
                    </div>
                    <div className="text-sm text-slate-500">{job.duration || 'Duration TBD'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {job.location && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{job.location}</span>
                    </div>
                  )}
                  {job.startDate && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{new Date(job.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-slate-600">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Requirements: {Array.isArray(job.requirements) ? job.requirements.length : 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PremiumButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewJobDetails(job)}
                    >
                      <Eye className="w-4 h-4" />
                    </PremiumButton>
                    {job.bidRequestId && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        From Customer Request
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {hasApplied ? (
                      <div className="flex items-center space-x-2">
                        {myApplication?.status === 'accepted' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accepted
                          </span>
                        ) : myApplication?.status === 'rejected' ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            Not Selected
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Applied
                          </span>
                        )}
                      </div>
                    ) : (
                      <PremiumButton 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleApplyFreelancerJob(job.id)}
                      >
                        Apply Now
                      </PremiumButton>
                    )}
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">My Profile</h2>
        <PremiumButton variant="primary" size="sm">
          <Edit3 className="w-5 h-5 mr-2" />
          Edit Profile
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PremiumCard className="p-8">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{profile.name}</h3>
                <p className="text-slate-600">{profile.title}</p>
                <p className="text-slate-500">{profile.location}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{profile.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-600">{profile.completedJobs} jobs completed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">About Me</h4>
                <p className="text-slate-600">{profile.bio}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Rates & Availability</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{profile.hourlyRate}/hour</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{profile.availability}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {profile.joinedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </div>

        <div className="space-y-6">
          <PremiumCard className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Active Applications</span>
                <span className="font-semibold">{stats.activeApplications}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Completed Jobs</span>
                <span className="font-semibold">{stats.completedJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Earnings</span>
                <span className="font-semibold">{stats.totalEarnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Rating</span>
                <span className="font-semibold flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  {stats.rating}
                </span>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <PremiumButton variant="ghost" size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Apply to New Job
              </PremiumButton>
              <PremiumButton variant="ghost" size="sm" className="w-full justify-start">
                <Edit3 className="w-4 h-4 mr-2" />
                Update Profile
              </PremiumButton>
              <PremiumButton variant="ghost" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Portfolio
              </PremiumButton>
            </div>
          </PremiumCard>
        </div>
      </div>
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
        <PremiumCard className="p-6 ring-2 ring-indigo-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">Welcome to Eventrra!</h4>
              <p className="text-slate-600 mt-1">Complete your profile to start receiving job opportunities.</p>
              <p className="text-sm text-slate-500 mt-2">Just now</p>
            </div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
          </div>
        </PremiumCard>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <Link href="/freelancer/settings">
          <PremiumButton variant="primary" size="sm">
            <Settings className="w-5 h-5 mr-2" />
            Manage Settings
          </PremiumButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <p className="text-slate-600 mb-4">Manage your profile details, skills, and portfolio.</p>
          <Link href="/freelancer/settings">
            <PremiumButton variant="ghost" size="sm" className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Profile Settings
            </PremiumButton>
          </Link>
        </PremiumCard>

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
          <Link href="/freelancer/settings">
            <PremiumButton variant="ghost" size="sm" className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Change Theme
            </PremiumButton>
          </Link>
        </PremiumCard>
      </div>
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
                <span className="text-slate-600">Freelancer Dashboard</span>
              </div>
              <Link href="/freelancer/settings">
                <PremiumButton variant="ghost" size="sm">
                  <Settings className="w-5 h-5" />
                </PremiumButton>
              </Link>
              <PremiumButton variant="ghost" size="sm" onClick={handleLogout}>
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
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
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
          {activeTab === 'applications' && renderApplications()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </div>

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJob && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowJobDetailsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Job Header */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                <p className="text-lg text-gray-600 mb-4">{selectedJob.category || 'Freelance Job'}</p>
                <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Payment</p>
                      <p className="font-semibold text-gray-900">
                        {(selectedJob.hourlyRate || selectedJob.monthlyPay) ? 
                          (selectedJob.monthlyPay ? `₹${selectedJob.monthlyPay}/month` : `₹${selectedJob.hourlyRate}/hr`) : 
                          'Rate TBD'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{selectedJob.duration || 'Duration TBD'}</p>
                    </div>
                  </div>

                  {selectedJob.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-semibold text-gray-900">{selectedJob.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedJob.startDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedJob.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedJob.endDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedJob.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedJob.startHour && selectedJob.endHour && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Working Hours</p>
                        <p className="font-semibold text-gray-900">
                          {selectedJob.startHour} - {selectedJob.endHour}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h4>
                    {selectedJob.requirements && selectedJob.requirements.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No specific requirements listed</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <PremiumButton
                  variant="ghost"
                  onClick={() => setShowJobDetailsModal(false)}
                >
                  Close
                </PremiumButton>
                {!myApplications.some(app => app.jobId === selectedJob.id) ? (
                  <PremiumButton
                    variant="primary"
                    onClick={() => {
                      handleApplyFreelancerJob(selectedJob.id);
                      setShowJobDetailsModal(false);
                    }}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Apply Now
                  </PremiumButton>
                ) : (
                  <PremiumButton
                    variant="primary"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Already Applied
                  </PremiumButton>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default FreelancerDashboard;
