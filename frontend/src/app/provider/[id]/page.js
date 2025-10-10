'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Heart, 
  Share, 
  MessageCircle, 
  Phone, 
  Mail,
  Camera,
  Video,
  Award,
  CheckCircle,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';

const ProviderProfile = ({ params }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - in real app, this would come from API
  const provider = {
    id: params.id,
    name: 'Elite Wedding Planners',
    category: 'Wedding Planning',
    rating: 4.9,
    reviews: 127,
    location: 'Mumbai, Maharashtra',
    price: '₹50,000+',
    description: 'We specialize in creating magical, unforgettable weddings that reflect your unique love story. With over 10 years of experience, we bring your dream wedding to life.',
    coverImage: 'https://images.unsplash.com/photo-1519167758481-83f1426cc6a3?w=1200',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    isVerified: true,
    isFeatured: true,
    followers: 1250,
    following: 89,
    joinedDate: '2020-03-15',
    languages: ['English', 'Hindi', 'Marathi'],
    specialties: ['Destination Weddings', 'Intimate Ceremonies', 'Cultural Weddings', 'Corporate Events'],
    portfolio: [
      {
        id: 1,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
        title: 'Beach Wedding Setup',
        likes: 45,
        comments: 12
      },
      {
        id: 2,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400',
        title: 'Garden Wedding Ceremony',
        likes: 67,
        comments: 8
      },
      {
        id: 3,
        type: 'video',
        url: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
        title: 'Wedding Highlights',
        likes: 89,
        comments: 15
      },
      {
        id: 4,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519167758481-83f1426cc6a3?w=400',
        title: 'Reception Setup',
        likes: 34,
        comments: 6
      },
      {
        id: 5,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
        title: 'Birthday Celebration',
        likes: 23,
        comments: 4
      },
      {
        id: 6,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
        title: 'Corporate Event',
        likes: 56,
        comments: 9
      }
    ],
    packages: [
      {
        name: 'Basic Package',
        price: '₹50,000',
        features: ['Venue Selection', 'Basic Decoration', 'Photography', 'Catering'],
        duration: '1 Day'
      },
      {
        name: 'Premium Package',
        price: '₹1,00,000',
        features: ['Complete Planning', 'Premium Decoration', 'Professional Photography', 'Multi-cuisine Catering', 'Entertainment'],
        duration: '2 Days',
        popular: true
      },
      {
        name: 'Luxury Package',
        price: '₹2,00,000',
        features: ['Luxury Planning', 'Custom Decoration', 'Cinematic Photography', 'Fine Dining', 'Live Music', 'Transportation'],
        duration: '3 Days'
      }
    ],
    reviews: [
      {
        id: 1,
        user: 'Sarah Johnson',
        rating: 5,
        date: '2024-01-15',
        comment: 'Absolutely amazing! They made our wedding day perfect. Every detail was taken care of.',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'
      },
      {
        id: 2,
        user: 'Mike Chen',
        rating: 5,
        date: '2024-01-10',
        comment: 'Professional, creative, and reliable. Highly recommend for any special event.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
      },
      {
        id: 3,
        user: 'Emily Davis',
        rating: 4,
        date: '2024-01-05',
        comment: 'Great service and attention to detail. Made our corporate event a huge success.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
      }
    ]
  };

  const tabs = [
    { id: 'about', label: 'About', icon: Users },
    { id: 'portfolio', label: 'Portfolio', icon: Camera },
    { id: 'packages', label: 'Packages', icon: Award },
    { id: 'reviews', label: 'Reviews', icon: Star }
  ];

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
                <span className="text-white font-bold text-lg">🎉</span>
              </div>
              <span className="text-2xl font-bold text-gradient">
                Eventrra
              </span>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <PremiumButton variant="ghost" size="sm">
                Sign In
              </PremiumButton>
              <PremiumButton variant="primary" size="sm">
                Get Started
              </PremiumButton>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Section */}
        <motion.div
          className="relative h-96 rounded-3xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src={provider.coverImage}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-end space-x-6">
              <motion.img
                src={provider.profileImage}
                alt={provider.name}
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl"
                whileHover={{ scale: 1.05 }}
              />
              <div className="flex-1 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold">{provider.name}</h1>
                  {provider.isVerified && (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  )}
                  {provider.isFeatured && (
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-xl text-white/90 mb-4">{provider.category}</p>
                <div className="flex items-center space-x-6 text-white/80">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">{provider.rating}</span>
                    <span>({provider.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>{provider.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{provider.followers} followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-4">
            <PremiumButton 
              variant="primary" 
              size="lg"
              className="px-8"
            >
              Book Now
            </PremiumButton>
            <PremiumButton 
              variant="secondary" 
              size="lg"
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg">
              <MessageCircle className="w-5 h-5" />
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg">
              <Heart className="w-5 h-5" />
            </PremiumButton>
            <PremiumButton variant="ghost" size="lg">
              <Share className="w-5 h-5" />
            </PremiumButton>
          </div>
          
          <div className="flex items-center space-x-4">
            <PremiumButton variant="ghost" size="sm">
              <Instagram className="w-5 h-5" />
            </PremiumButton>
            <PremiumButton variant="ghost" size="sm">
              <Facebook className="w-5 h-5" />
            </PremiumButton>
            <PremiumButton variant="ghost" size="sm">
              <Twitter className="w-5 h-5" />
            </PremiumButton>
            <PremiumButton variant="ghost" size="sm">
              <Linkedin className="w-5 h-5" />
            </PremiumButton>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
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
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PremiumCard className="p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">About Us</h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    {provider.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {provider.languages.map((language, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </div>
              
              <div className="space-y-6">
                <PremiumCard className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">+91 98765 43210</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">contact@eliteweddings.com</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{provider.location}</span>
                    </div>
                  </div>
                </PremiumCard>
                
                <PremiumCard className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Experience</span>
                      <span className="font-semibold text-slate-900">10+ years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Events Completed</span>
                      <span className="font-semibold text-slate-900">500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Member Since</span>
                      <span className="font-semibold text-slate-900">2020</span>
                    </div>
                  </div>
                </PremiumCard>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {provider.portfolio.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <PremiumCard className="overflow-hidden" hoverEffect="lift">
                      <div className="relative h-64">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{item.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{item.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Packages & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {provider.packages.map((pkg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <PremiumCard 
                      className={`p-8 h-full ${
                        pkg.popular ? 'ring-2 ring-indigo-500' : ''
                      }`}
                      hoverEffect="lift"
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                            Most Popular
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                        <div className="text-4xl font-bold text-indigo-600 mb-2">{pkg.price}</div>
                        <div className="text-slate-500">{pkg.duration}</div>
                      </div>
                      
                      <ul className="space-y-3 mb-8">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <PremiumButton 
                        variant={pkg.popular ? 'primary' : 'secondary'} 
                        size="lg" 
                        className="w-full"
                      >
                        Choose Package
                        <ArrowRight className="w-5 h-5" />
                      </PremiumButton>
                    </PremiumCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Customer Reviews</h2>
              <div className="space-y-6">
                {provider.reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <PremiumCard className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={review.avatar}
                          alt={review.user}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{review.user}</h4>
                            <div className="flex items-center space-x-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 mb-2">{review.comment}</p>
                          <div className="text-sm text-slate-500">{review.date}</div>
                        </div>
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProviderProfile;
