'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Phone, Video, Mic, MicOff, VideoOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

const VideoCall = ({ callId, callerId, callerName, type, onEndCall, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Join user room
    newSocket.emit('join-user-room', {
      uid: currentUser.uid,
      name: currentUser.name
    });

    // WebRTC event handlers
    newSocket.on('webrtc-offer', handleOffer);
    newSocket.on('webrtc-answer', handleAnswer);
    newSocket.on('webrtc-ice-candidate', handleIceCandidate);
    newSocket.on('call-accepted', handleCallAccepted);
    newSocket.on('call-rejected', handleCallRejected);
    newSocket.on('call-ended', handleCallEnded);

    // Initialize call
    initializeCall();

    return () => {
      newSocket.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(iceServers);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            recipientId: callerId,
            callId
          });
        }
      };

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current.connectionState === 'connected') {
          setIsConnected(true);
          setCallStatus('connected');
          callStartTimeRef.current = Date.now();
          startCallTimer();
        }
      };

      // Send offer if we're the caller
      if (currentUser.uid === callerId) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        
        socket.emit('webrtc-offer', {
          offer,
          callerId: currentUser.uid,
          recipientId: callerId,
          callId
        });
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to initialize call');
      onEndCall();
    }
  };

  const handleOffer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', {
        answer,
        callerId: data.callerId,
        recipientId: currentUser.uid,
        callId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const handleCallAccepted = (data) => {
    setCallStatus('connected');
    callStartTimeRef.current = Date.now();
    startCallTimer();
  };

  const handleCallRejected = (data) => {
    toast.error('Call was rejected');
    onEndCall();
  };

  const handleCallEnded = (data) => {
    toast.info('Call ended');
    onEndCall();
  };

  const startCallTimer = () => {
    const timer = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);

    return () => clearInterval(timer);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    try {
      // End call via API
      await fetch(`/api/calling/end/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
      onEndCall();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
        {/* Call Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {callerName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{callerName}</h3>
              <p className="text-sm text-gray-500">
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'connected' && `Call duration: ${formatDuration(callDuration)}`}
              </p>
            </div>
          </div>
          <button
            onClick={endCall}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
          {/* Remote Video */}
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Local Video */}
          {localStream && type === 'video' && (
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Status Overlay */}
          {callStatus === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-4 mt-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isVideoOff ? 'Turn on video' : 'Turn off video'}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={endCall}
            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="End call"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
