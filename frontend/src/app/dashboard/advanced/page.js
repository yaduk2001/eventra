'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  MessageSquare,
  Phone,
  Video,
  Camera,
  Heart,
  Users,
  Bell,
  Settings,
  LogOut,
  Plus,
  Eye,
  Calendar,
  Truck,
  Utensils,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChatInterface from '../../../components/Chat/ChatInterface';
import VideoCall from '../../../components/Calling/VideoCall';
import SocialFeed from '../../../components/Social/SocialFeed';

export default function AdvancedDashboardPage() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bidRequests, setBidRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatRoom, setChatRoom] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user && userProfile) {
      fetchDashboardData();
    }
  }, [user, userProfile, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if we're in browser environment
      if (typeof window === 'undefined') return;
      
      // Verify user has a valid token before making authenticated requests
      if (!user) {
        console.log('No authenticated user, skipping dashboard data fetch');
        return;
      }

      try {
        const token = await user.getIdToken(false);
        if (!token) {
          console.log('No valid token available, skipping dashboard data fetch');
          return;
        }
      } catch (tokenError) {
        console.error('Error getting auth token:', tokenError);
        return;
      }
      
      // Fetch notifications
      try {
        const notificationsResponse = await api.getNotifications({ limit: 5 });
        setNotifications(notificationsResponse.data || []);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }

      // Fetch bookings
      try {
        const bookingsResponse = await api.getBookings({ limit: 5 });
        setBookings(bookingsResponse.data || []);
      } catch (error) {
        console.error('Error loading bookings:', error);
        setBookings([]);
      }

      // Fetch bid requests for service providers
      if (userProfile.role !== 'customer') {
        try {
          const bidRequestsResponse = await api.getBidRequests({ limit: 5 });
          setBidRequests(bidRequestsResponse.data || []);
        } catch (error) {
          console.error('Error loading bid requests:', error);
          setBidRequests([]);
        }
      }

      // Fetch online users
      try {
        const onlineUsersResponse = await api.getOnlineUsers();
        setOnlineUsers(onlineUsersResponse.data || []);
      } catch (error) {
        console.error('Error loading online users:', error);
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast for authentication issues
      if (!error.message.includes('401') && !error.message.includes('Unauthorized') && !error.message.includes('No token provided')) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const startChat = async (participantId) => {
    try {
      const response = await api.createChatRoom(participantId, 'direct');
      if (response.success) {
        setChatRoom(response.data.roomId);
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const startCall = async (participantId, type) => {
    try {
      const response = await api.initiateCall(participantId, type);
      if (response.success) {
        setActiveCall({
          callId: response.data.callId,
          callerId: user.uid,
          callerName: userProfile.name,
          type: response.data.type
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const getUserRoleIcon = (role) => {
    switch (role) {
      case 'customer': return <Users className="w-5 h-5" />;
      case 'event_company': return <Calendar className="w-5 h-5" />;
      case 'caterer': return <Utensils className="w-5 h-5" />;
      case 'photographer': return <Camera className="w-5 h-5" />;
      case 'transport': return <Truck className="w-5 h-5" />;
      case 'admin': return <Settings className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getUserRoleColor = (role) => {
    switch (role) {
      case 'customer': return 'bg-blue-500';
      case 'event_company': return 'bg-purple-500';
      case 'caterer': return 'bg-green-500';
      case 'photographer': return 'bg-pink-500';
      case 'transport': return 'bg-orange-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">🎉 Eventrra</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {userProfile.name || user.displayName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Dashboard</h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'social' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span>Social Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'calls' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Phone className="w-5 h-5" />
                <span>Calls</span>
              </button>
            </nav>
          </div>

          {/* Online Users */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Online Users</h3>
            <div className="space-y-2">
              {onlineUsers.slice(0, 5).map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {onlineUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{onlineUser.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{onlineUser.role}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startChat(onlineUser.id)}
                      className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Start Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startCall(onlineUser.id, 'audio')}
                      className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startCall(onlineUser.id, 'video')}
                      className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Bell className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Notifications</p>
                      <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Bookings</p>
                      <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Online Users</p>
                      <p className="text-2xl font-semibold text-gray-900">{onlineUsers.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.title}</p>
                          <p className="text-xs text-gray-500">{booking.eventDate}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex">
              {chatRoom ? (
                <ChatInterface
                  roomId={chatRoom}
                  currentUser={user}
                  onClose={() => setChatRoom(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h3>
                    <p className="text-gray-500 mb-4">Select a user from the sidebar to start chatting</p>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <div className="flex-1 overflow-y-auto">
              <SocialFeed />
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="flex-1 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Call History</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">Call history will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Call Modal */}
      {activeCall && (
        <VideoCall
          callId={activeCall.callId}
          callerId={activeCall.callerId}
          callerName={activeCall.callerName}
          type={activeCall.type}
          onEndCall={() => setActiveCall(null)}
          currentUser={user}
        />
      )}
    </div>
  );
}
