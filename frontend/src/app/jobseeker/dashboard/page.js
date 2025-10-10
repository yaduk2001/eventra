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
  UserX,
  Building,
  GraduationCap,
  Download
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

const JobSeekerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const { user, userProfile, logout } = useAuth();

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

  // JobSeeker-specific stats
  const [stats, setStats] = useState({
    activeApplications: 0,
    savedJobs: 0,
    profileViews: 0,
    interviewsScheduled: 0
  });

  // Staff jobs state
  const [staffJobs, setStaffJobs] = useState([]);
  const [myStaffApplications, setMyStaffApplications] = useState([]);
  const [loadingStaffJobs, setLoadingStaffJobs] = useState(false);
  
  // Real notifications and messages state
  const [realNotifications, setRealNotifications] = useState([]);
  const [realMessages, setRealMessages] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Profile data for jobseeker (cleaned up - removed unnecessary fields)
  const profile = {
    name: userProfile?.name || 'Job Seeker',
    title: userProfile?.title || 'Event Industry Professional',
    location: userProfile?.location || 'Mumbai, India',
    phone: userProfile?.phone || '+91 98765 43210',
    email: userProfile?.email || user?.email || 'jobseeker@example.com',
    bio: userProfile?.bio || 'Passionate about the event industry with strong organizational and communication skills.',
    skills: userProfile?.skills || ['Event Planning', 'Customer Service', 'Project Management', 'Communication'],
    experience: userProfile?.experience || '2+ years',
    education: userProfile?.education || 'Bachelor\'s in Event Management',
    availability: userProfile?.availability || 'Immediately Available',
    joinedDate: 'Jan 2024'
  };



  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'staff-jobs', label: 'Staff Jobs', icon: UserCheck },
    { id: 'applications', label: 'My Applications', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  useEffect(() => {
    // Fetch staff jobs and applications
    if (user) {
      fetchStaffJobs();
      fetchMyStaffApplications();
      fetchRealNotifications();
      fetchRealMessages();
    }
    
    // Simulate loading for initial load
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [user]);

  // Update stats when applications change
  useEffect(() => {
    setStats({
      activeApplications: myStaffApplications.filter(app => app.status === 'pending' || app.status === 'approved').length,
      savedJobs: 5, // This could be fetched from backend in the future
      profileViews: 23, // This could be fetched from backend in the future
      interviewsScheduled: myStaffApplications.filter(app => app.status === 'approved').length
    });
  }, [myStaffApplications]);

  const handleApplyJob = (jobId) => {
    toast.success('Application submitted successfully!');
    // In a real app, this would make an API call
  };

  const handleSaveJob = (jobId) => {
    toast.success('Job saved to your favorites!');
    // In a real app, this would make an API call
  };

  // Staff jobs functions
  const fetchStaffJobs = async () => {
    try {
      setLoadingStaffJobs(true);
      const jobs = await api.staffJobs.getAvailableStaffJobs();
      // Ensure jobs is always an array
      setStaffJobs(Array.isArray(jobs) ? jobs : []);
    } catch (error) {
      console.error('Error fetching staff jobs:', error);
      toast.error('Failed to load staff jobs');
      // Set to empty array on error
      setStaffJobs([]);
    } finally {
      setLoadingStaffJobs(false);
    }
  };

  const fetchMyStaffApplications = async () => {
    try {
      const applications = await api.staffJobs.getMyStaffApplications();
      setMyStaffApplications(applications);
    } catch (error) {
      console.error('Error fetching my staff applications:', error);
    }
  };

  const fetchRealNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.getNotifications({ limit: 10 });
      setRealNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setRealNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchRealMessages = async () => {
    try {
      setLoadingMessages(true);
      const response = await api.getChatRooms(1, 10);
      setRealMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setRealMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Notifications helpers
  const dismissNotification = async (notificationId) => {
    try {
      await api.deleteNotification(notificationId);
    } catch (e) {
      // ignore network errors for UX; still remove locally
    } finally {
      setRealNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setRealNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleApplyStaffJob = async (jobId) => {
    try {
      await api.staffJobs.applyToStaffJob(jobId);
      toast.success('Application submitted successfully!');
      fetchStaffJobs(); // Refresh to update application count
      fetchMyStaffApplications(); // Refresh my applications
    } catch (error) {
      console.error('Error applying for staff job:', error);
      toast.error('Failed to submit application');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'interview_scheduled': return 'text-blue-600 bg-blue-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'interview_scheduled': return <Calendar className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Message */}
      <PremiumCard className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome {profile.name.split(' ')[0]} to Job Search Dashboard!</h2>
          <p className="text-lg text-gray-600 mb-6">Find your dream job in the event industry and build your career.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton variant="primary" size="lg" onClick={() => setActiveTab('staff-jobs')}>
              <UserCheck className="w-5 h-5 mr-2" />
              View Staff Jobs
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg" onClick={() => setActiveTab('profile')}>
              <User className="w-5 h-5 mr-2" />
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
              <p className="text-slate-600 text-sm font-medium">Saved Jobs</p>
              <p className="text-3xl font-bold text-slate-900">{stats.savedJobs}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Profile Views</p>
              <p className="text-3xl font-bold text-slate-900">{stats.profileViews}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </PremiumCard>
        
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Interviews Scheduled</p>
              <p className="text-3xl font-bold text-slate-900">{stats.interviewsScheduled}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Recent Applications */}
      <PremiumCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Applications</h3>
          <PremiumButton variant="ghost" size="sm" onClick={() => setActiveTab('applications')}>
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </PremiumButton>
        </div>
        <div className="space-y-4">
          {myStaffApplications.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No applications yet. Start applying to staff jobs!</p>
            </div>
          ) : (
            myStaffApplications.slice(0, 3).map((application) => (
              <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{application.job?.jobName || 'Staff Position'}</h4>
                    <p className="text-sm text-gray-600">{application.provider?.businessName || application.provider?.name || 'Company'}</p>
                    <p className="text-xs text-gray-500">Applied on {new Date(application.appliedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                  </div>
                  {application.job?.pay && (
                    <p className="text-sm text-gray-600 mt-1">₹{application.job.pay}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PremiumCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <PremiumButton variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('jobs')}>
              <Search className="w-5 h-5 mr-3" />
              Search for Jobs
            </PremiumButton>
            <PremiumButton variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('profile')}>
              <User className="w-5 h-5 mr-3" />
              Update Profile
            </PremiumButton>
            <PremiumButton variant="ghost" className="w-full justify-start">
              <Download className="w-5 h-5 mr-3" />
              Download Resume
            </PremiumButton>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Messages</h3>
          <div className="space-y-3">
            {realMessages.slice(0, 3).map((message) => (
              <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 text-sm">{message.sender || 'Unknown'}</h4>
                  <span className="text-xs text-gray-500">{message.updatedAt ? new Date(message.updatedAt).toLocaleString() : ''}</span>
                </div>
                <p className="text-sm text-gray-600">{message.lastMessage?.content || 'No messages yet'}</p>
              </div>
            ))}
          </div>
          <PremiumButton variant="ghost" size="sm" className="w-full mt-4" onClick={() => setActiveTab('messages')}>
            View All Messages
          </PremiumButton>
        </PremiumCard>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Browse Jobs</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <PremiumButton variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </PremiumButton>
        </div>
      </div>

      <div className="grid gap-6">
        {availableJobs.map((job) => (
          <PremiumCard key={job.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {job.salary}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {job.type}
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {job.experience}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{job.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-6">
                <PremiumButton variant="primary" size="sm" onClick={() => handleApplyJob(job.id)}>
                  Apply Now
                </PremiumButton>
                <PremiumButton variant="ghost" size="sm" onClick={() => handleSaveJob(job.id)}>
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </PremiumButton>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">Posted on {job.postedDate}</span>
              <div className="flex items-center space-x-2">
                <PremiumButton variant="ghost" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </PremiumButton>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>
    </div>
  );

  const renderStaffJobs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Staff Jobs</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{Array.isArray(staffJobs) ? staffJobs.length : 0} jobs available</span>
        </div>
      </div>

      {loadingStaffJobs ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {!Array.isArray(staffJobs) || staffJobs.length === 0 ? (
            <PremiumCard className="p-8 text-center">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Jobs Available</h3>
              <p className="text-gray-600">Check back later for new opportunities!</p>
            </PremiumCard>
          ) : (
            staffJobs.map((job) => {
              const hasApplied = myStaffApplications.some(app => app.jobId === job.id);
              const myApplication = myStaffApplications.find(app => app.jobId === job.id);
              
              return (
                <PremiumCard key={job.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{job.jobName}</h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {job.spotsNeeded} spots
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{new Date(job.dateTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{new Date(job.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="font-semibold">₹{job.pay}</span>
                        </div>
                        {job.provider?.location && (
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{job.provider.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Company Information */}
                      {job.provider && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Building className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {job.provider.businessName || job.provider.name}
                                </h4>
                                <p className="text-sm text-gray-600">{job.provider.location}</p>
                              </div>
                            </div>
                          <Link href={`/provider/profile?id=${job.providerId}`}>
                            <PremiumButton 
                              variant="ghost" 
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Profile
                            </PremiumButton>
                          </Link>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{job.applicationsCount || 0} applied</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {hasApplied ? (
                            <div className="flex items-center space-x-2">
                              {myApplication?.status === 'approved' ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approved
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
                              onClick={() => handleApplyStaffJob(job.id)}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Apply Now
                            </PremiumButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              );
            })
          )}
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{myStaffApplications.length} applications</span>
        </div>
      </div>

      <div className="grid gap-6">
        {myStaffApplications.length === 0 ? (
          <PremiumCard className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-4">You haven't applied to any jobs yet. Start browsing staff jobs to find opportunities!</p>
            <PremiumButton variant="primary" onClick={() => setActiveTab('staff-jobs')}>
              <UserCheck className="w-4 h-4 mr-2" />
              Browse Staff Jobs
            </PremiumButton>
          </PremiumCard>
        ) : (
          myStaffApplications.map((application) => (
            <PremiumCard key={application.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{application.job?.jobName || 'Staff Position'}</h3>
                    <p className="text-gray-600">{application.provider?.businessName || application.provider?.name || 'Company'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {application.provider?.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {application.provider.location}
                        </div>
                      )}
                      {application.job?.pay && (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ₹{application.job.pay}
                        </div>
                      )}
                      {application.job?.dateTime && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(application.job.dateTime).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Applied on {new Date(application.appliedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {application.job?.description && (
                <p className="text-gray-700 mt-4">{application.job.description}</p>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {application.status === 'approved' && (
                    <PremiumButton variant="primary" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      View Job Details
                    </PremiumButton>
                  )}
                  <PremiumButton variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Company
                  </PremiumButton>
                </div>
              </div>
            </PremiumCard>
          ))
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <PremiumButton variant="primary" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Profile
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <PremiumCard className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{profile.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{profile.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{profile.location}</p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                <p className="text-gray-900">{profile.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-gray-900">{profile.bio}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <p className="text-gray-900">{profile.experience}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <p className="text-gray-900">{profile.education}</p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </PremiumCard>
        </div>

        {/* Profile Summary */}
        <div className="space-y-6">
          <PremiumCard className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h3>
              <p className="text-gray-600 mb-2">{profile.title}</p>
              <div className="flex items-center justify-center space-x-1 mb-4">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{profile.location}</span>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profile.availability === 'Immediately Available' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
              }`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {profile.availability}
              </div>
            </div>
          </PremiumCard>



          <PremiumCard className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <PremiumButton variant="ghost" className="w-full justify-start">
                <Download className="w-5 h-5 mr-3" />
                Upload Resume
              </PremiumButton>
              <PremiumButton variant="ghost" className="w-full justify-start">
                <Camera className="w-5 h-5 mr-3" />
                Add Portfolio
              </PremiumButton>
              <PremiumButton variant="ghost" className="w-full justify-start">
                <Share className="w-5 h-5 mr-3" />
                Share Profile
              </PremiumButton>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <PremiumButton variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </PremiumButton>
      </div>

      {loadingMessages ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {realMessages.length === 0 ? (
            <PremiumCard className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h3>
              <p className="text-gray-600">You don't have any messages yet. Start a conversation with employers!</p>
            </PremiumCard>
          ) : (
            realMessages.map((message) => (
              <PremiumCard key={message.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{message.sender || 'Unknown'}</h4>
                      <p className="text-gray-600 text-sm">{message.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{message.updatedAt ? new Date(message.updatedAt).toLocaleDateString() : ''}</span>
                    {message.unreadCount && message.unreadCount > 0 && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1 ml-auto"></div>
                    )}
                  </div>
                </div>
              </PremiumCard>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <div className="flex items-center gap-2">
          <PremiumButton variant="ghost" size="sm" onClick={markAllNotificationsRead}>
            Mark All Read
          </PremiumButton>
          <PremiumButton variant="ghost" size="sm" onClick={() => setRealNotifications([])}>
            Clear All
          </PremiumButton>
        </div>
      </div>

      {loadingNotifications ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {realNotifications.length === 0 ? (
            <PremiumCard className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
            </PremiumCard>
          ) : (
            realNotifications.map((notification) => (
              <PremiumCard key={notification.id} className={`p-4 ${!notification.read ? 'border-l-4 border-indigo-500' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === 'job_approved' ? 'bg-green-100' :
                      notification.type === 'application' ? 'bg-blue-100' :
                      notification.type === 'job_match' ? 'bg-green-100' :
                      notification.type === 'interview' ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      {notification.type === 'job_approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {notification.type === 'application' && <Briefcase className="w-5 h-5 text-blue-600" />}
                      {notification.type === 'job_match' && <Target className="w-5 h-5 text-green-600" />}
                      {notification.type === 'interview' && <Calendar className="w-5 h-5 text-orange-600" />}
                      {!['job_approved', 'application', 'job_match', 'interview'].includes(notification.type) && <Bell className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <p className="text-gray-600 text-sm">{notification.message}</p>
                      {notification.type === 'job_approved' && (notification.providerBusinessName || notification.providerRole || notification.providerLocation) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.providerRole ? `${notification.providerRole} • ` : ''}
                          {notification.providerBusinessName || ''}
                          {notification.providerLocation ? ` — ${notification.providerLocation}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      )}
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="grid gap-6">
        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive email updates about job matches and applications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-600">Receive SMS updates for urgent notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                <p className="text-sm text-gray-600">Make your profile visible to employers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Actions</h3>
          <div className="space-y-4">
            <PremiumButton variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
                <span className="text-slate-600">JobSeeker Dashboard</span>
              </div>
              <Link href="/jobseeker/settings">
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
          {activeTab === 'staff-jobs' && renderStaffJobs()}
          {activeTab === 'applications' && renderApplications()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;