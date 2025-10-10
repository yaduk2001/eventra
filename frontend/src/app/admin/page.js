'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Star,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  Clock,
  Award,
  Target
} from 'lucide-react';
import PremiumButton from '../../components/ui/PremiumButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminPanel = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [usersModalTitle, setUsersModalTitle] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerActionLoading, setProviderActionLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
  };

  const fetchDashboard = async () => {
    try {
      const dashRes = await api.getDashboardStats();
      setDashboard(dashRes.data);
    } catch (e) {
      setError(e?.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashRes, bookingsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getAdminBookings({ limit: 6, page: 1 })
        ]);
        if (!isMounted) return;
        setDashboard(dashRes.data);
        setRecentBookings(bookingsRes.data || []);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load admin data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (!authLoading && user) {
      fetchData();
    }
    return () => { isMounted = false; };
  }, [authLoading, user]);

  const handleApproveProvider = async (provider) => {
    if (!provider?.uid) return;
    setProviderActionLoading(true);
    try {
      await api.approveUser(provider.uid, 'Approved by admin');
      await fetchDashboard();
      setProviderModalOpen(false);
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setProviderActionLoading(false);
    }
  };

  const handleRejectProvider = async (provider, reason = 'Not a fit') => {
    if (!provider?.uid) return;
    setProviderActionLoading(true);
    try {
      await api.rejectUser(provider.uid, reason);
      await fetchDashboard();
      setProviderModalOpen(false);
    } catch (e) {
      console.error('Reject failed', e);
    } finally {
      setProviderActionLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'providers', label: 'Providers', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PremiumCard className="p-6 cursor-pointer" onClick={async () => {
          setUsersModalTitle('All Users');
          setUsersModalOpen(true);
          setUsersLoading(true);
          try {
            const res = await api.getAdminUsers({ page: 1, limit: 50 });
            setUsersList(res.data || []);
          } catch (e) {
            setUsersList([]);
          } finally {
            setUsersLoading(false);
          }
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-slate-900">{
                (() => {
                  const counts = dashboard?.userStats || [];
                  return counts.reduce((sum, r) => sum + (r.count || 0), 0);
                })()
              }</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6 cursor-pointer" onClick={async () => {
          setUsersModalTitle('Active Providers');
          setUsersModalOpen(true);
          setUsersLoading(true);
          try {
            const res = await api.getAdminUsers({ page: 1, limit: 50, role: 'event_company' });
            // Include all provider roles
            const providerRoles = ['event_company', 'caterer', 'transport', 'photographer', 'freelancer'];
            const resAll = await api.getAdminUsers({ page: 1, limit: 200 });
            const providers = (resAll.data || []).filter(u => providerRoles.includes(u.role) && u.approved);
            setUsersList(providers);
          } catch (e) {
            setUsersList([]);
          } finally {
            setUsersLoading(false);
          }
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active Providers</p>
              <p className="text-3xl font-bold text-slate-900">{
                (() => {
                  const counts = dashboard?.userStats || [];
                  return counts
                    .filter(r => r.role !== 'customer' && r.role !== 'admin')
                    .reduce((sum, r) => sum + (r.approved_count || 0), 0);
                })()
              }</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Pending Approvals</p>
              <p className="text-3xl font-bold text-slate-900">{dashboard?.pendingApprovals?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Bookings</p>
              <p className="text-3xl font-bold text-slate-900">{dashboard?.platformStats?.total_bookings || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(dashboard?.platformStats?.total_revenue)}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Monthly Growth</p>
              <p className="text-3xl font-bold text-green-600">+0%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PremiumCard className="p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Recent Bookings</h3>
          <div className="space-y-4">
            {(recentBookings || []).map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div>
                  <h4 className="font-semibold text-slate-900">{booking.customer_name || booking.userId || 'Customer'}</h4>
                  <p className="text-slate-600 text-sm">{booking.provider_name || booking.providerId || 'Provider'}</p>
                  <p className="text-slate-500 text-xs">{formatDate(booking.eventDate || booking.createdAt)}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(booking.amount)}</div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {booking.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Pending Approvals</h3>
          <div className="space-y-4">
            {(dashboard?.pendingApprovals || []).slice(0, 3).map((provider, index) => (
              <motion.div
                key={provider.uid || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div>
                  <h4 className="font-semibold text-slate-900">{provider.name || provider.businessName || 'Provider'}</h4>
                  <p className="text-slate-600 text-sm">{provider.role}</p>
                  <p className="text-slate-500 text-xs">{formatDate(provider.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <PremiumButton variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </PremiumButton>
                  <PremiumButton variant="primary" size="sm">
                    <CheckCircle className="w-4 h-4" />
                  </PremiumButton>
                  <PremiumButton variant="ghost" size="sm">
                    <XCircle className="w-4 h-4" />
                  </PremiumButton>
                </div>
              </motion.div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </div>
  );

  const renderProviders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Provider Management</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <PremiumButton variant="ghost" size="sm">
            <Filter className="w-5 h-5" />
          </PremiumButton>
        </div>
      </div>

      <div className="space-y-4">
        {(dashboard?.pendingApprovals || []).map((provider, index) => (
          <motion.div
            key={provider.uid || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PremiumCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {(provider.name || provider.businessName || 'P').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{provider.name || provider.businessName || 'Provider'}</h3>
                    <p className="text-slate-600">{provider.email}</p>
                    <p className="text-slate-500 text-sm">{provider.role}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-slate-500">Submitted: {formatDate(provider.createdAt)}</span>
                      <span className="text-sm text-slate-500">Approved: {provider.approved ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setSelectedProvider(provider);
                      setProviderModalOpen(true);
                      // Try to fetch full details from backend if we have an id
                      try {
                        if (provider?.uid) {
                          const detail = await api.getAdminUserById(provider.uid);
                          if (detail?.data) {
                            setSelectedProvider({ ...provider, ...detail.data });
                          }
                        }
                      } catch (e) {
                        // Keep minimal details if fetch fails
                      }
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </PremiumButton>
                  <PremiumButton variant="primary" size="sm" onClick={() => handleApproveProvider(provider)}>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </PremiumButton>
                  <PremiumButton variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleRejectProvider(provider)}>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </PremiumButton>
                  <PremiumButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </PremiumButton>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Booking Management</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search bookings..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <PremiumButton variant="ghost" size="sm">
            <Filter className="w-5 h-5" />
          </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {recentBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PremiumCard className="p-6" hoverEffect="lift">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{booking.customer}</h3>
                  <p className="text-slate-600">{booking.provider}</p>
                  <p className="text-slate-500 text-sm">{booking.category}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {booking.status}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{booking.date}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-semibold">{booking.amount}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <PremiumButton variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </PremiumButton>
                <PremiumButton variant="primary" size="sm">
                  Manage
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">User Reports</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <PremiumButton variant="ghost" size="sm">
            <Filter className="w-5 h-5" />
          </PremiumButton>
        </div>
      </div>

      <div className="space-y-4">
        {(dashboard?.reportedContent || []).map((report, index) => (
          <motion.div
            key={report.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <PremiumCard className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    report.status === 'under_review' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {report.status === 'under_review' ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{report.title || report.reported || 'Reported item'}</h3>
                    <p className="text-slate-600">Reported by: {report.reporter || report.userName || 'Unknown'}</p>
                    <p className="text-slate-500 text-sm">Reason: {report.reason || report.description || '-'}</p>
                    <p className="text-slate-500 text-sm">Date: {formatDate(report.createdAt || report.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    report.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {(report.status || 'under_review').replace('_', ' ')}
                  </div>
                  <PremiumButton variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </PremiumButton>
                  <PremiumButton variant="primary" size="sm">
                    <Edit className="w-4 h-4" />
                  </PremiumButton>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
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
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">
                Eventrra Admin
              </span>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setNotificationsOpen(true);
                  setNotificationsLoading(true);
                  try {
                    const res = await api.getNotifications();
                    setNotifications(res.data || []);
                  } catch (e) {
                    setNotifications([]);
                  } finally {
                    setNotificationsLoading(false);
                  }
                }}
              >
                <Bell className="w-5 h-5" />
              </PremiumButton>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5" />
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
          {activeTab === 'providers' && renderProviders()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'analytics' && (
            <div className="text-center py-20">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600">Analytics Coming Soon</h3>
              <p className="text-slate-500">Advanced analytics and insights will be available here.</p>
            </div>
          )}
        </motion.div>

        {/* Users Modal */}
        {usersModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">{usersModalTitle}</h3>
                <button onClick={() => setUsersModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="p-4">
                {usersLoading ? (
                  <div className="p-6 text-center text-slate-500">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="text-slate-600 text-sm">
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Role</th>
                          <th className="py-2 pr-4">Approved</th>
                          <th className="py-2 pr-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(usersList || []).map((u, i) => (
                          <tr key={u.uid || i} className="border-t border-slate-100 text-slate-800">
                            <td className="py-2 pr-4">{u.name || u.businessName || '-'}</td>
                            <td className="py-2 pr-4">{u.email}</td>
                            <td className="py-2 pr-4 capitalize">{(u.role || '').replace('_',' ')}</td>
                            <td className="py-2 pr-4">{u.approved ? 'Yes' : 'No'}</td>
                            <td className="py-2 pr-4">{formatDate(u.createdAt)}</td>
                          </tr>
                        ))}
                        {(!usersList || usersList.length === 0) && (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-slate-500">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 text-right">
                <button onClick={() => setUsersModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Provider Details Modal */}
        {providerModalOpen && selectedProvider && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Provider Details</h3>
                <button onClick={() => setProviderModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {(selectedProvider.name || selectedProvider.businessName || 'P').charAt(0)}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{selectedProvider.name || selectedProvider.businessName || 'Provider'}</div>
                    <div className="text-slate-600">{selectedProvider.email}</div>
                    <div className="text-slate-500 text-sm capitalize">{(selectedProvider.role || '').replace('_',' ')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Submitted</div>
                    <div className="font-semibold text-slate-900">{formatDate(selectedProvider.createdAt)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Approved</div>
                    <div className="font-semibold text-slate-900">{selectedProvider.approved ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Phone</div>
                    <div className="font-semibold text-slate-900">{selectedProvider.phone || '-'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Location</div>
                    <div className="font-semibold text-slate-900">{selectedProvider.location || '-'}</div>
                  </div>
                </div>
                {selectedProvider.businessName && (
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Business Name</div>
                    <div className="font-semibold text-slate-900">{selectedProvider.businessName}</div>
                  </div>
                )}
                {(selectedProvider.categories && selectedProvider.categories.length > 0) && (
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Categories</div>
                    <div className="font-semibold text-slate-900">{selectedProvider.categories.join(', ')}</div>
                  </div>
                )}
                {(selectedProvider.serviceAreas && selectedProvider.serviceAreas.length > 0) && (
                  <div className="p-4 rounded-xl bg-slate-50">
                    <div className="text-slate-500 text-sm">Service Areas</div>
                    <div className="font-semibold text-slate-900">{selectedProvider.serviceAreas.join(', ')}</div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleRejectProvider(selectedProvider)}
                  disabled={providerActionLoading}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold disabled:opacity-50"
                >
                  {providerActionLoading ? 'Working...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApproveProvider(selectedProvider)}
                  disabled={providerActionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold disabled:opacity-50"
                >
                  {providerActionLoading ? 'Working...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {notificationsOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
                <button onClick={() => setNotificationsOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="p-4">
                {notificationsLoading ? (
                  <div className="p-6 text-center text-slate-500">Loading...</div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {(notifications || []).map((n, i) => (
                      <div key={n.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="font-semibold text-slate-900">{n.title || n.type || 'Notification'}</div>
                        <div className="text-slate-700 text-sm">{n.message || n.content || '-'}</div>
                        <div className="text-slate-500 text-xs mt-1">{formatDate(n.createdAt)}</div>
                      </div>
                    ))}
                    {(!notifications || notifications.length === 0) && (
                      <div className="p-6 text-center text-slate-500">No notifications</div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 text-right">
                <button onClick={() => setNotificationsOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Settings</h3>
                <button onClick={() => setSettingsOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900">Admin Account</div>
                  <div className="text-slate-600 text-sm">{user?.email}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-2">Actions</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => { await logout(); window.location.href = '/auth/login'; }}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 text-right">
                <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
