'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { 
  ArrowLeft,
  Sparkles,
  Settings,
  LogOut,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  Calendar,
  Award,
  Camera,
  Edit3,
  User,
  AlertCircle
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';

export const dynamic = 'force-dynamic';

const ServiceProviderProfileInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  // Load provider data from API
  useEffect(() => {
    const loadProviderData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get provider ID from URL parameters
        const providerId = searchParams.get('id');
        
        if (!providerId) {
          setError('Provider ID is required');
          setLoading(false);
          return;
        }

        console.log('Loading provider data for ID:', providerId);
        
        // Fetch provider data from API
        const response = await api.services.getProvider(providerId);
        console.log('Provider API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null');
        
        // Handle different response structures
        let providerData = null;
        if (response) {
          if (response.data && response.message) {
            // Backend response format: { message: "...", data: {...} }
            providerData = response.data;
          } else if (response.error) {
            // Error response
            setError(response.message || response.error || 'Provider not found');
            setLoading(false);
            return;
          } else if (response.id || response.businessName || response.name) {
            // Direct provider data
            providerData = response;
          } else {
            console.log('Unexpected response structure:', response);
            setError('Invalid response format');
            setLoading(false);
            return;
          }
        }
        
        if (providerData) {
          console.log('Provider data to transform:', providerData);
          console.log('Provider data keys:', Object.keys(providerData));
          
          // Transform the data to match our component structure
          const transformedProvider = {
            id: providerData.id || providerData.uid,
            name: providerData.name || providerData.businessName,
            businessName: providerData.businessName || providerData.name,
            email: providerData.email,
            phone: providerData.phone,
            location: providerData.location,
            website: providerData.website,
            profilePicture: providerData.profilePicture || providerData.picture || 'https://via.placeholder.com/150',
            coverPicture: providerData.coverPicture || 'https://via.placeholder.com/800x300',
            category: providerData.category || (providerData.categories && providerData.categories.length > 0 ? providerData.categories[0] : ''),
            categories: providerData.categories || (providerData.category ? [providerData.category] : []),
            specialties: providerData.specialties || [],
            rating: providerData.rating || 0,
            totalReviews: providerData.totalReviews || 0,
            totalEvents: providerData.totalEvents || providerData.totalBookings || 0,
            yearsExperience: providerData.yearsExperience || providerData.experience || 0,
            about: providerData.about || providerData.description || '',
            services: providerData.services || [],
            socialMedia: providerData.socialMedia || {},
            totalServices: providerData.totalServices || 0
          };
          
          console.log('Transformed provider:', transformedProvider);
          setProvider(transformedProvider);
        } else {
          setError('Provider not found');
        }

        // Mock posts data (keep as requested)
        setPosts([
          {
            id: 1,
            image: 'https://via.placeholder.com/400x400',
            caption: 'Beautiful wedding setup at the Grand Ballroom! ✨ #WeddingPlanning #EventDecor',
            likes: 245,
            comments: 18,
            timestamp: '2 hours ago',
            liked: false
          },
          {
            id: 2,
            image: 'https://via.placeholder.com/400x400',
            caption: 'Corporate event success! Thank you to our amazing team 🎉 #CorporateEvents #TeamWork',
            likes: 189,
            comments: 12,
            timestamp: '1 day ago',
            liked: true
          },
          {
            id: 3,
            image: 'https://via.placeholder.com/400x400',
            caption: 'Birthday party magic in the making! 🎂🎈 #BirthdayParty #EventPlanning',
            likes: 156,
            comments: 8,
            timestamp: '2 days ago',
            liked: false
          },
          {
            id: 4,
            image: 'https://via.placeholder.com/400x400',
            caption: 'Another successful product launch event! 🚀 #ProductLaunch #CorporateEvents',
            likes: 203,
            comments: 15,
            timestamp: '3 days ago',
            liked: true
          },
          {
            id: 5,
            image: 'https://via.placeholder.com/400x400',
            caption: 'Elegant anniversary celebration setup 💕 #Anniversary #EventDecor',
            likes: 178,
            comments: 22,
            timestamp: '4 days ago',
            liked: false
          },
          {
            id: 6,
            image: 'https://via.placeholder.com/400x400',
            caption: 'Conference hall ready for 500+ attendees! 📊 #Conference #CorporateEvents',
            likes: 134,
            comments: 9,
            timestamp: '5 days ago',
            liked: false
          }
        ]);

      } catch (error) {
        console.error('Error loading provider data:', error);
        setError(error.message || 'Failed to load provider data');
      } finally {
        setLoading(false);
      }
    };

    loadProviderData();
  }, [searchParams]);

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked, 
            likes: post.liked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleMessage = async () => {
    try {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (!provider) {
        console.error('No provider data available');
        return;
      }

      const providerId = provider.id;

      // Create or get existing chat room
      const response = await api.chat.createOrGetRoom(providerId);
      
      if (response.success && response.data) {
        const roomId = response.data.id;
        // Navigate to customer messages page with specific room
        router.push(`/customer/messages?room=${roomId}&partner=${providerId}`);
      } else {
        // Fallback: navigate to messages page
        router.push('/customer/messages');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Fallback: navigate to messages page
      router.push('/customer/messages');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-lg text-gray-600 mb-6">{error || 'The requested provider profile could not be found.'}</p>
          <PremiumButton onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </PremiumButton>
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
            <div className="flex items-center space-x-4">
              <PremiumButton 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </PremiumButton>
              
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
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">Provider Profile</span>
              </div>
              <PremiumButton variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </PremiumButton>
              <PremiumButton variant="ghost" size="sm">
                <LogOut className="w-5 h-5" />
              </PremiumButton>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PremiumCard className="mb-8 overflow-hidden">
            {/* Cover Picture */}
            <div className="relative h-48 md:h-64">
              <img 
                src={provider.coverPicture} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            
            {/* Profile Info */}
            <div className="relative px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16">
                {/* Profile Picture */}
                <div className="relative">
                  <img 
                    src={provider.profilePicture} 
                    alt={provider.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                {/* Basic Info */}
                <div className="flex-1 mt-4 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{provider.businessName}</h1>
                      <p className="text-lg text-gray-600 mb-2">
                        {provider.category || 
                         (provider.categories && provider.categories.length > 0 ? provider.categories.join(' • ') : '')}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{provider.rating}</span>
                          <span className="ml-1">({provider.totalReviews} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{provider.totalEvents} events</span>
                        </div>
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          <span>{provider.yearsExperience} years experience</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-4 md:mt-0">
                      <PremiumButton variant="primary" onClick={handleMessage}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </PremiumButton>
                      <PremiumButton variant="outline">
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </PremiumButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts Feed - 60-70% width */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
              
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <PremiumCard className="overflow-hidden">
                      {/* Post Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={provider.profilePicture} 
                            alt={provider.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{provider.businessName}</h3>
                            <p className="text-sm text-gray-600">{post.timestamp}</p>
                          </div>
                        </div>
                        <PremiumButton variant="ghost" size="sm">
                          <MoreHorizontal className="w-5 h-5" />
                        </PremiumButton>
                      </div>
                      
                      {/* Post Image */}
                      <div className="relative">
                        <img 
                          src={post.image} 
                          alt="Post" 
                          className="w-full h-96 object-cover"
                        />
                      </div>
                      
                      {/* Post Actions */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleLike(post.id)}
                              className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                            >
                              <Heart 
                                className={`w-6 h-6 ${post.liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                              />
                              <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors">
                              <MessageCircle className="w-6 h-6" />
                              <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <button className="text-gray-600 hover:text-indigo-600 transition-colors">
                              <Share className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Post Caption */}
                        <p className="text-gray-900">
                          <span className="font-semibold">{provider.businessName}</span>{' '}
                          {post.caption}
                        </p>
                        
                        {/* View Comments */}
                        {post.comments > 0 && (
                          <button className="text-sm text-gray-500 hover:text-gray-700 mt-2">
                            View all {post.comments} comments
                          </button>
                        )}
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - 30-40% width */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <PremiumCard className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {provider.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-5 h-5 mr-3 text-indigo-600" />
                        <span className="text-sm">{provider.email}</span>
                      </div>
                    )}
                    {provider.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-5 h-5 mr-3 text-indigo-600" />
                        <span className="text-sm">{provider.phone}</span>
                      </div>
                    )}
                    {provider.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-3 text-indigo-600" />
                        <span className="text-sm">{provider.location}</span>
                      </div>
                    )}
                    {provider.website && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="w-5 h-5 mr-3 text-indigo-600" />
                        <span className="text-sm">{provider.website}</span>
                      </div>
                    )}
                  </div>
                </PremiumCard>
              </motion.div>

              {/* Services */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <PremiumCard className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
                  <div className="space-y-2">
                    {provider.services && provider.services.length > 0 ? (
                      provider.services.map((service, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3" />
                          {typeof service === 'string' ? service : service.name || service.title || 'Service'}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No services</div>
                    )}
                  </div>
                </PremiumCard>
              </motion.div>

              {/* About */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <PremiumCard className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {provider.about || 'No description available.'}
                  </p>
                  
                  {provider.specialties && provider.specialties.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </PremiumCard>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceProviderProfilePage = () => {
  return (
    <Suspense fallback={null}>
      <ServiceProviderProfileInner />
    </Suspense>
  );
};

export default ServiceProviderProfilePage;