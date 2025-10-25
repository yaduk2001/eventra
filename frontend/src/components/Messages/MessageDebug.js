'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const MessageDebug = () => {
  const { user } = useAuth();
  const [availablePartners, setAvailablePartners] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use the new messaging API that works for all roles
      const usersResponse = await api.getUsersForMessaging();
      setAvailablePartners(usersResponse.data || []);
      
      // Load chat rooms
      const roomsResponse = await api.getChatRooms(1, 100);
      setChatRooms(roomsResponse.data || []);
      
      console.log('Users for Messaging:', usersResponse.data);
      console.log('Chat Rooms:', roomsResponse.data);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load debug data');
    } finally {
      setLoading(false);
    }
  };

  const categorizeUsers = (users) => {
    const categories = {
      customers: [],
      serviceProviders: [],
      jobSeekers: [],
      freelancers: []
    };

    // Users are already filtered by the backend API, so just categorize them
    users.forEach(user => {
      switch (user.role) {
        case 'customer':
          categories.customers.push(user);
          break;
        case 'event_company':
        case 'caterer':
        case 'transport':
        case 'photographer':
          categories.serviceProviders.push(user);
          break;
        case 'jobseeker':
          categories.jobSeekers.push(user);
          break;
        case 'freelancer':
          categories.freelancers.push(user);
          break;
      }
    });

    return categories;
  };

  const testCreateRoom = async (partnerId) => {
    try {
      const response = await api.createChatRoom(partnerId, 'direct');
      console.log('Room created:', response);
      toast.success('Room created successfully');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const categories = categorizeUsers(availablePartners);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Message System Debug</h1>
      
      <div className="mb-4">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Partners */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Available Partners ({availablePartners.length})</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-green-600">Customers ({categories.customers.length})</h3>
              {categories.customers.map(user => (
                <div key={user.id} className="ml-4 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-600">{user.email}</div>
                  <div className="text-gray-500">Role: {user.role}</div>
                  <button
                    onClick={() => testCreateRoom(user.id)}
                    className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Create Room
                  </button>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-medium text-blue-600">Service Providers ({categories.serviceProviders.length})</h3>
              {categories.serviceProviders.map(user => (
                <div key={user.id} className="ml-4 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-600">{user.email}</div>
                  <div className="text-gray-500">Role: {user.role}</div>
                  <button
                    onClick={() => testCreateRoom(user.id)}
                    className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Create Room
                  </button>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-medium text-purple-600">Job Seekers ({categories.jobSeekers.length})</h3>
              {categories.jobSeekers.map(user => (
                <div key={user.id} className="ml-4 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-600">{user.email}</div>
                  <div className="text-gray-500">Role: {user.role}</div>
                  <button
                    onClick={() => testCreateRoom(user.id)}
                    className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Create Room
                  </button>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-medium text-orange-600">Freelancers ({categories.freelancers.length})</h3>
              {categories.freelancers.map(user => (
                <div key={user.id} className="ml-4 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-600">{user.email}</div>
                  <div className="text-gray-500">Role: {user.role}</div>
                  <button
                    onClick={() => testCreateRoom(user.id)}
                    className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Create Room
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Rooms */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Existing Chat Rooms ({chatRooms.length})</h2>
          
          {chatRooms.length === 0 ? (
            <p className="text-gray-500">No chat rooms found</p>
          ) : (
            <div className="space-y-2">
              {chatRooms.map(room => (
                <div key={room.roomId} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">Room: {room.roomId}</div>
                  <div className="text-gray-600">
                    Participants: {room.participants?.map(p => p.name || p.id).join(', ')}
                  </div>
                  {room.lastMessage && (
                    <div className="text-gray-500">
                      Last message: {room.lastMessage.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current User Info */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Current User Info</h3>
        <div className="text-sm">
          <div>UID: {user?.uid}</div>
          <div>Name: {user?.name}</div>
          <div>Email: {user?.email}</div>
          <div>Role: {user?.role}</div>
        </div>
      </div>

      {/* Filtering Logic Summary */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Filtering Logic Applied</h3>
        <div className="text-sm space-y-1">
          {user?.role === 'admin' && (
            <div>✅ <strong>Admin:</strong> Can chat with everyone except themselves</div>
          )}
          {user?.role === 'customer' && (
            <div>✅ <strong>Customer:</strong> Can only chat with approved service providers</div>
          )}
          {['event_company', 'caterer', 'transport', 'photographer'].includes(user?.role) && (
            <div>✅ <strong>Service Provider:</strong> Can chat with customers, job seekers, and freelancers</div>
          )}
          {['jobseeker', 'freelancer'].includes(user?.role) && (
            <div>✅ <strong>Job Seeker/Freelancer:</strong> Can only see service providers who contacted them first</div>
          )}
          <div className="mt-2 text-gray-600">
            Total users in database: {availablePartners.length} | 
            Filtered users: {Object.values(categories).flat().length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDebug;
