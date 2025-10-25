'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip, Mic, ArrowLeft, Image, FileAudio, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatInterface = ({ roomId, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Debug logging
  console.log('ChatInterface props:', { 
    roomId, 
    currentUser: !!currentUser, 
    currentUserId: currentUser?.uid,
    currentUserName: currentUser?.name,
    onClose: !!onClose 
  });

  // Debug function to check room details
  const debugRoomDetails = async () => {
    if (!roomId) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('All user chat rooms:', data);
        
        // Find the current room
        const currentRoom = data.data?.find(room => room.roomId === roomId);
        if (currentRoom) {
          console.log('Current room details:', currentRoom);
          console.log('Room participants:', currentRoom.participants);
          console.log('Is current user in participants?', currentRoom.participants?.includes(currentUser?.uid));
        } else {
          console.log('Current room not found in user rooms list');
        }
      }
    } catch (error) {
      console.error('Error debugging room details:', error);
    }
  };

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    console.log('Connecting to socket server:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Join user room
      newSocket.emit('join-user-room', {
        uid: currentUser.uid,
        name: currentUser.name
      });

      // Join chat room
      if (roomId) {
        console.log('Joining chat room:', roomId);
        newSocket.emit('join-chat-room', roomId);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('new_message', (data) => {
      if (data.roomId === roomId) {
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

    newSocket.on('user-typing', (data) => {
      if (data.roomId === roomId) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...prev.filter(user => user.userId !== data.userId), data];
          } else {
            return prev.filter(user => user.userId !== data.userId);
          }
        });
      }
    });

    setSocket(newSocket);

    // Load chat history
    if (roomId) {
      loadMessages();
      debugRoomDetails(); // Debug room details
    }

    return () => {
      newSocket.close();
    };
  }, [roomId, currentUser]);

  const loadMessages = async () => {
    try {
      if (!roomId) {
        console.warn('loadMessages called without a valid roomId');
        setMessages([]);
        return;
      }
      console.log('Loading messages for room:', roomId);
      console.log('Current user ID:', currentUser?.uid);
      console.log('Current user name:', currentUser?.name);
      
      const token = await currentUser.getIdToken();
      console.log('Auth token for loading messages:', !!token);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/room/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Load messages response status:', response.status);
      
      // Handle different response types
      if (response.status === 204 || response.status === 200) {
        // Try to parse JSON, but don't fail if it's empty
        let data = {};
        let responseText = '';
        
        try {
          responseText = await response.text();
          if (responseText.trim()) {
            data = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.log('Response is not JSON, treating as empty messages list');
          data = { success: true, data: [] };
        }
        
        console.log('Load messages response data:', data);
        
        if (data.success !== false) {
          // Sort messages by timestamp (oldest first, newest last)
          const sortedMessages = (data.data || []).sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timeA - timeB;
          });
          setMessages(sortedMessages);
          scrollToBottom();
          return;
        }
      }
      
      // If we get here, there was an error
      console.error('Failed to load messages - Status:', response.status);
      
      // Try to get error details
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
        
        // If it's a 403 error, the user is not a participant
        if (response.status === 403) {
          console.error('User is not a participant in this room. RoomId:', roomId, 'UserId:', currentUser?.uid);
          console.log('Setting empty messages array for demo purposes');
          setMessages([]); // Set empty array for demo
          toast.error('You are not a participant in this chat room. Messages will be shown locally only.');
        }
      } catch (_) {
        console.error('Could not parse error response');
      }
      
      setMessages([]); // Set empty array instead of showing error
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]); // Set empty array instead of showing error
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('Cannot send message: no message content');
      return;
    }

    console.log('Sending message:', { 
      roomId, 
      content: newMessage.trim(), 
      socketConnected: isConnected,
      currentUserId: currentUser?.uid,
      currentUserName: currentUser?.name
    });

    try {
      const token = await currentUser.getIdToken();
      console.log('Auth token obtained:', !!token);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId,
          content: newMessage.trim(),
          type: 'text'
        })
      });

      console.log('API response status:', response.status);

      // Handle response - be more lenient with success
      if (response.ok) {
        setNewMessage('');
        console.log('Message sent successfully');
        
        // Always add message locally for immediate feedback
        const sentMessage = {
          id: `local-${Date.now()}`,
          roomId,
          senderId: currentUser.uid,
          senderName: currentUser.name || 'You',
          content: newMessage.trim(),
          type: 'text',
          mediaUrl: null,
          metadata: {},
          timestamp: new Date().toISOString(),
          readBy: [currentUser.uid],
          delivered: true
        };
        setMessages(prev => [...prev, sentMessage]);
        scrollToBottom();
      } else {
        // Handle 403 error specifically
        if (response.status === 403) {
          console.error('User not a participant - adding message locally anyway');
          setNewMessage('');
          
          // Add message locally even if not a participant (for demo purposes)
          const sentMessage = {
            id: `local-${Date.now()}`,
            roomId,
            senderId: currentUser.uid,
            senderName: currentUser.name || 'You',
            content: newMessage.trim(),
            type: 'text',
            mediaUrl: null,
            metadata: {},
            timestamp: new Date().toISOString(),
            readBy: [currentUser.uid],
            delivered: false // Mark as not delivered since we're not a participant
          };
          setMessages(prev => [...prev, sentMessage]);
          scrollToBottom();
          
          toast.error('Message added locally (not sent to server - you are not a participant in this room)');
          return;
        }
        
        // Only show error for actual failures
        let errorMessage = `Failed to send message (status ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (_) {
          // ignore parse errors
        }
        console.error('Send message failed:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing-start', { roomId });
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { roomId });
      setIsTyping(false);
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const startCall = (type) => {
    // This would integrate with the calling system
    console.log(`Starting ${type} call`);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-send the file
      sendMediaMessage(file);
    }
  };

  // Handle media message sending
  const sendMediaMessage = async (file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 
                        file.type.startsWith('video/') ? 'video' : 'audio');

      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Add media message locally
        const mediaMessage = {
          id: `local-${Date.now()}`,
          roomId,
          senderId: currentUser.uid,
          senderName: currentUser.name || 'You',
          content: `[${file.type.startsWith('image/') ? 'Image' : 
                     file.type.startsWith('video/') ? 'Video' : 'Audio'}]`,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'audio',
          mediaUrl: data.data?.mediaUrl || URL.createObjectURL(file),
          metadata: {},
          timestamp: new Date().toISOString(),
          readBy: [currentUser.uid],
          delivered: true
        };
        setMessages(prev => [...prev, mediaMessage]);
        scrollToBottom();
        setSelectedFile(null);
      } else {
        toast.error('Failed to upload media');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    }
  };

  // Start audio recording
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
        sendMediaMessage(audioBlob);
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

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Messages"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {roomId?.split('_')[1]?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Chat Room</h3>
            <p className="text-sm text-gray-500">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => startCall('audio')}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => startCall('video')}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === currentUser.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
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
                message.senderId === currentUser.uid ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
                {!message.delivered && message.senderId === currentUser.uid && (
                  <span className="ml-1 text-yellow-300">⚠️</span>
                )}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">
                {typingUsers.map(user => user.userId).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
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
            disabled={!newMessage.trim()}
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

export default ChatInterface;
