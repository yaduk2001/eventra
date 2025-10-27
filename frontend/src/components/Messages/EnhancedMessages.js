'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  MessageCircle, 
  Users, 
  UserCheck, 
  Briefcase, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Mic, 
  Camera, 
  Image, 
  FileAudio, 
  X, 
  Search, 
  Filter,
  MoreVertical,
  Smile,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import PremiumButton from '../ui/PremiumButton';
import PremiumCard from '../ui/PremiumCard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const EnhancedMessages = ({ onClose, initialRoomId, initialPartnerId }) => {
  const { user, userProfile } = useAuth();
  
  // Set default tab based on user role
  const getDefaultTab = () => {
    const userRole = user?.role || userProfile?.role;
    console.log('getDefaultTab - user:', user);
    console.log('getDefaultTab - userProfile:', userProfile);
    console.log('getDefaultTab - userRole:', userRole);
    
    if (!userRole) return 'customers';
    
    if (userRole === 'customer') {
      return 'service-providers'; // Customers should see service providers
    } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(userRole)) {
      return 'customers'; // Service providers should see customers
    } else if (['jobseeker', 'freelancer'].includes(userRole)) {
      return 'service-providers'; // Job seekers/freelancers should see service providers
    } else if (userRole === 'admin') {
      return 'customers'; // Admin can see everyone, start with customers
    }
    
    return 'customers';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // State for different user categories
  const [customers, setCustomers] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [jobSeekers, setJobSeekers] = useState([]);
  const [freelancers, setFreelancers] = useState([]);

  // Define tabs for different user categories
  const tabs = [
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'service-providers',
      label: 'Service Providers',
      icon: UserCheck,
      color: 'green'
    },
    {
      id: 'job-seekers',
      label: 'Job Seekers & Freelancers',
      icon: Briefcase,
      color: 'purple'
    }
  ];

  useEffect(() => {
    if (user?.uid) {
      loadUsers();
      initializeSocket();
    }
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user?.uid]);

  // Update active tab when user changes
  useEffect(() => {
    const userRole = user?.role || userProfile?.role;
    if (userRole) {
      const defaultTab = getDefaultTab();
      console.log('Setting activeTab to:', defaultTab);
      setActiveTab(defaultTab);
    }
  }, [user?.role, userProfile?.role]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Handle initial partner selection
  useEffect(() => {
    if (initialPartnerId && (customers.length > 0 || serviceProviders.length > 0 || jobSeekers.length > 0)) {
      // Find the partner in all user categories
      const allUsers = [...customers, ...serviceProviders, ...jobSeekers];
      const partner = allUsers.find(user => user.id === initialPartnerId);
      
      if (partner) {
        console.log('Found initial partner:', partner);
        setSelectedUser(partner);
        
        // Set the appropriate tab based on partner's role
        if (partner.role === 'customer') {
          setActiveTab('customers');
        } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(partner.role)) {
          setActiveTab('service-providers');
        } else if (['jobseeker', 'freelancer'].includes(partner.role)) {
          setActiveTab('job-seekers');
        }
      } else {
        console.log('Initial partner not found in loaded users:', initialPartnerId);
        // Try to fetch the specific user if not found in the list
        fetchSpecificUser(initialPartnerId);
      }
    }
  }, [initialPartnerId, customers, serviceProviders, jobSeekers]);

  const fetchSpecificUser = async (userId) => {
    try {
      // Try to get user details from the backend
      const response = await api.getUsersForMessaging();
      const allUsers = response.data || [];
      const user = allUsers.find(u => u.id === userId);
      
      if (user) {
        console.log('Found specific user:', user);
        setSelectedUser(user);
        
        // Add to appropriate category if not already there
        if (user.role === 'customer' && !customers.find(c => c.id === userId)) {
          setCustomers(prev => [...prev, user]);
          setActiveTab('customers');
        } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(user.role) && 
                   !serviceProviders.find(sp => sp.id === userId)) {
          setServiceProviders(prev => [...prev, user]);
          setActiveTab('service-providers');
        } else if (['jobseeker', 'freelancer'].includes(user.role) && 
                   !jobSeekers.find(js => js.id === userId)) {
          setJobSeekers(prev => [...prev, user]);
          setActiveTab('job-seekers');
        }
      } else {
        console.error('Could not find user with ID:', userId);
        toast.error('Could not find the user to start conversation with');
      }
    } catch (error) {
      console.error('Error fetching specific user:', error);
      toast.error('Failed to load user details');
    }
  };

  const initializeSocket = () => {
    if (!user?.uid) {
      console.log('User not available for socket initialization');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    console.log('Initializing socket with URL:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      newSocket.emit('join-user-room', {
        uid: user.uid,
        name: user.name
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('new_message', (data) => {
      console.log('Received new message:', data);
      if (selectedUser && data.roomId === getRoomId(selectedUser.id)) {
        setMessages(prev => {
          const updated = [...prev, data.message];
          // Sort messages by timestamp to ensure correct order
          return updated.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timeA - timeB;
          });
        });
        scrollToBottom();
      }
    });

    setSocket(newSocket);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Use the new messaging-specific API that works for all roles
      const usersResponse = await api.getUsersForMessaging();
      const allUsers = usersResponse.data || [];
      
      console.log('Users for messaging response:', usersResponse);
      console.log('All users:', allUsers);
      
      // Get existing chat rooms
      const chatRoomsResponse = await api.getChatRooms(1, 100);
      const rooms = chatRoomsResponse.data || [];
      
      console.log('Chat rooms response:', chatRoomsResponse);
      console.log('Rooms data:', rooms);
      console.log('Current user UID:', user.uid);
      
      // Create a map of existing conversations
      const existingConversations = new Map();
      rooms.forEach(room => {
        console.log('Processing room:', room);
        console.log('Room participants:', room.participants);
        
        // room.participants is an array of participant details from backend
        const otherParticipant = room.participants.find(p => p.id !== user.uid);
        console.log('Other participant found:', otherParticipant);
        
        if (otherParticipant) {
          existingConversations.set(otherParticipant.id, {
            lastMessage: room.lastMessage,
            unreadCount: room.unreadCount || 0,
            roomId: room.roomId || room.id
          });
        }
      });
      
      console.log('Existing conversations map:', existingConversations);

      // Add users from existing conversations to allUsers if they're not already there
      const userIds = new Set(allUsers.map(u => u.id));
      rooms.forEach(room => {
        room.participants.forEach(participant => {
          if (participant.id !== user.uid && !userIds.has(participant.id)) {
            allUsers.push(participant);
            userIds.add(participant.id);
          }
        });
      });

      console.log('All users after adding conversation participants:', allUsers);

      // Categorize users based on their roles
      const categorizedUsers = {
        customers: [],
        serviceProviders: [],
        jobSeekers: [],
        freelancers: []
      };

      allUsers.forEach(userData => {
        const conversationData = existingConversations.get(userData.id);
        const enrichedUserData = {
          ...userData,
          lastMessage: conversationData?.lastMessage || null,
          unreadCount: conversationData?.unreadCount || 0,
          roomId: conversationData?.roomId || null
        };

        switch (userData.role) {
          case 'customer':
            categorizedUsers.customers.push(enrichedUserData);
            break;
          case 'event_company':
          case 'caterer':
          case 'transport':
          case 'photographer':
            categorizedUsers.serviceProviders.push(enrichedUserData);
            break;
          case 'jobseeker':
            categorizedUsers.jobSeekers.push(enrichedUserData);
            break;
          case 'freelancer':
            categorizedUsers.freelancers.push(enrichedUserData);
            break;
        }
      });

      console.log('Categorized users:', categorizedUsers);
      console.log('Final customers:', categorizedUsers.customers);
      console.log('Final service providers:', categorizedUsers.serviceProviders);
      console.log('Final job seekers:', [...categorizedUsers.jobSeekers, ...categorizedUsers.freelancers]);
      console.log('Current user role:', user?.role);
      console.log('Default tab should be:', getDefaultTab());
      console.log('Current activeTab:', activeTab);
      
      setCustomers(categorizedUsers.customers);
      setServiceProviders(categorizedUsers.serviceProviders);
      setJobSeekers([...categorizedUsers.jobSeekers, ...categorizedUsers.freelancers]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      // First, try to create or get the room
      let roomId = getRoomId(userId);
      
      try {
        // Try to get existing room first
        const response = await api.getChatMessages(roomId);
        // Sort messages by timestamp (oldest first, newest last)
        const sortedMessages = (response.data || []).sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return timeA - timeB;
        });
        setMessages(sortedMessages);
        scrollToBottom();
        return;
      } catch (roomError) {
        // If room doesn't exist, create it
        console.log('Room does not exist, creating new room...');
        try {
          const roomResponse = await api.createChatRoom(userId, 'direct');
          roomId = roomResponse.data.roomId;
          
          // Now try to load messages
          const response = await api.getChatMessages(roomId);
          // Sort messages by timestamp (oldest first, newest last)
          const sortedMessages = (response.data || []).sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timeA - timeB;
          });
          setMessages(sortedMessages);
          scrollToBottom();
        } catch (createError) {
          console.error('Error creating room:', createError);
          toast.error('Failed to create chat room');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    }
  };

  const getRoomId = (userId) => {
    const participants = [user.uid, userId].sort();
    return `room_${participants.join('_')}`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      let roomId = getRoomId(selectedUser.id);
      
      // Ensure room exists before sending message
      try {
        await api.getChatMessages(roomId);
      } catch (roomError) {
        // Room doesn't exist, create it
        console.log('Creating room before sending message...');
        const roomResponse = await api.createChatRoom(selectedUser.id, 'direct');
        roomId = roomResponse.data.roomId;
      }
      
      if (selectedFile) {
        await sendMediaMessage(selectedFile, roomId);
      } else {
        const messageContent = newMessage.trim();
        await api.sendMessage({
          roomId,
          content: messageContent,
          type: 'text'
        });
        setNewMessage('');
        
        // Reload messages to get the actual saved message
        setTimeout(async () => {
          try {
            const response = await api.getChatMessages(roomId);
            // Sort messages by timestamp (oldest first, newest last)
            const sortedMessages = (response.data || []).sort((a, b) => {
              const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
              const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
              return timeA - timeB;
            });
            setMessages(sortedMessages);
            scrollToBottom();
          } catch (error) {
            console.error('Error reloading messages after send:', error);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendMediaMessage = async (file, roomId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 
                        file.type.startsWith('video/') ? 'video' : 'audio');

      const response = await api.uploadMedia(formData);
      
      await api.sendMessage({
        roomId,
        content: `[${file.type.startsWith('image/') ? 'Image' : 
                   file.type.startsWith('video/') ? 'Video' : 'Audio'}]`,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'audio',
        mediaUrl: response.data.mediaUrl
      });

      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending media message:', error);
      toast.error('Failed to send media message');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        sendMediaMessage(audioBlob, getRoomId(selectedUser.id));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrentUsers = () => {
    let users;
    switch (activeTab) {
      case 'customers':
        users = customers;
        break;
      case 'service-providers':
        users = serviceProviders;
        break;
      case 'job-seekers':
        users = jobSeekers;
        break;
      default:
        users = [];
    }
    console.log(`getCurrentUsers() - activeTab: ${activeTab}, returning:`, users);
    return users;
  };

  const filteredUsers = getCurrentUsers().filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserList = () => (
    <div className="w-1/3 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadUsers}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
            <p className="text-gray-600">Start a conversation with someone!</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-blue-100 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={async () => {
                  setSelectedUser(user);
                  // Load messages for this user
                  await loadMessages(user.id);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{user.name}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {user.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  <div className="text-right">
                    {user.unreadCount > 0 && (
                      <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                        {user.unreadCount}
                      </span>
                    )}
                    {user.lastMessage && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(user.lastMessage.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderChatArea = () => {
    if (!selectedUser) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-600">Choose someone to start chatting with</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedUser.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {selectedUser.role?.replace('_', ' ')} • {isConnected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user.uid
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {/* Media Content */}
                {message.type === 'image' && message.mediaUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.mediaUrl} 
                      alt="Shared image" 
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
                
                {message.type === 'video' && message.mediaUrl && (
                  <div className="mb-2">
                    <video 
                      src={message.mediaUrl} 
                      controls 
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '200px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                
                {message.type === 'audio' && message.mediaUrl && (
                  <div className="mb-2">
                    <audio 
                      src={message.mediaUrl} 
                      controls 
                      className="w-full"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                {/* Text Content */}
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            {/* File Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full transition-colors"
              title="Upload file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Image Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full transition-colors"
              title="Upload image"
            >
              <Image className="w-5 h-5" />
            </button>
            
            {/* Camera Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full transition-colors"
              title="Take photo"
            >
              <Camera className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            
            {/* Audio Recording Button */}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title={isRecording ? 'Stop recording' : 'Record audio'}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="mt-2 flex items-center space-x-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Recording... Click mic to stop</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-white rounded-lg shadow-lg overflow-hidden">
      {renderUserList()}
      {renderChatArea()}
    </div>
  );
};

export default EnhancedMessages;
