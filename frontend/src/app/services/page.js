'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, Filter, Star, MapPin, Clock, Users, Heart, Share, Eye, SlidersHorizontal } from 'lucide-react';
import PremiumButton from '../../components/ui/PremiumButton';
import PremiumCard from '../../components/ui/PremiumCard';

const ServicesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');

  const categories = [
    { id: 'all', label: 'All Services', icon: '🎉' },
    { id: 'wedding', label: 'Wedding Planning', icon: '💒' },
    { id: 'photography', label: 'Photography', icon: '📸' },
    { id: 'catering', label: 'Catering', icon: '🍽️' },
    { id: 'transport', label: 'Transportation', icon: '🚗' },
    { id: 'corporate', label: 'Corporate Events', icon: '🏢' },
    { id: 'birthday', label: 'Birthday Parties', icon: '🎂' }
  ];

  const services = [
    {
      id: 1,
      name: 'Elite Wedding Planners',
      category: 'wedding',
      rating: 4.9,
      reviews: 127,
      price: '₹50,000',
      location: 'Mumbai, Maharashtra',
      image: 'https://images.unsplash.com/photo-1519167758481-83f1426cc6a3?w=400',
      description: 'Complete wedding planning and coordination services',
      features: ['Venue Selection', 'Vendor Management', 'Day Coordination'],
      isVerified: true,
      isFeatured: true
    },
    {
      id: 2,
      name: 'Royal Catering Services',
      category: 'catering',
      rating: 4.8,
      reviews: 89,
      price: '₹15,000',
      location: 'Delhi, Delhi',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      description: 'Premium catering for all occasions',
      features: ['Multi-cuisine', 'Live Counters', 'Professional Staff'],
      isVerified: true,
      isFeatured: false
    },
    {
      id: 3,
      name: 'LensCraft Photography',
      category: 'photography',
      rating: 4.9,
      reviews: 156,
      price: '₹25,000',
      location: 'Bangalore, Karnataka',
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
      description: 'Professional photography and videography',
      features: ['Pre-wedding', 'Wedding Day', 'Post-production'],
      isVerified: true,
      isFeatured: true
    },
    {
      id: 4,
      name: 'Luxury Transport Co.',
      category: 'transport',
      rating: 4.7,
      reviews: 73,
      price: '₹8,000',
      location: 'Chennai, Tamil Nadu',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      description: 'Premium transportation services',
      features: ['Luxury Cars', 'Professional Drivers', '24/7 Service'],
      isVerified: true,
      isFeatured: false
    },
    {
      id: 5,
      name: 'Corporate Events Hub',
      category: 'corporate',
      rating: 4.6,
      reviews: 45,
      price: '₹30,000',
      location: 'Pune, Maharashtra',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
      description: 'Professional corporate event management',
      features: ['Conference Setup', 'AV Management', 'Catering'],
      isVerified: true,
      isFeatured: false
    },
    {
      id: 6,
      name: 'Birthday Bash Specialists',
      category: 'birthday',
      rating: 4.8,
      reviews: 92,
      price: '₹12,000',
      location: 'Kolkata, West Bengal',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
      description: 'Fun and memorable birthday celebrations',
      features: ['Theme Decoration', 'Entertainment', 'Cake & Food'],
      isVerified: true,
      isFeatured: true
    }
  ];

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <motion.div 
            className="lg:w-80"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PremiumCard className="p-8" glass>
              <div className="flex items-center space-x-2 mb-8">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">Filters</h3>
              </div>
              
              {/* Search */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Category
                </label>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all ${
                        selectedCategory === category.id
                          ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                          : 'hover:bg-slate-100 text-slate-700 border-2 border-transparent'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-sm font-semibold">{category.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Price Range
                </label>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm font-semibold text-slate-600">
                    <span>₹0</span>
                    <span className="text-indigo-600">₹{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-3">
                  Discover Amazing Services
                </h1>
                <p className="text-slate-600 text-lg">
                  {filteredServices.length} premium services found
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-100 text-indigo-700 shadow-md' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="w-5 h-5 grid grid-cols-2 gap-1">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all ${
                    viewMode === 'list' 
                      ? 'bg-indigo-100 text-indigo-700 shadow-md' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="w-5 h-5 flex flex-col space-y-1">
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Services Grid */}
            <motion.div 
              className={`grid gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PremiumCard 
                    className="overflow-hidden h-full" 
                    hoverEffect="lift"
                  >
                    {/* Service Image */}
                    <div className="relative h-56">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex space-x-2">
                        {service.isFeatured && (
                          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            Featured
                          </span>
                        )}
                        {service.isVerified && (
                          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            Verified
                          </span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <motion.button
                          className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Share className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Service Info */}
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            {service.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-slate-600">
                            <MapPin className="w-5 h-5" />
                            <span className="font-medium">{service.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-indigo-600">
                            {service.price}
                          </div>
                          <div className="text-sm text-slate-500 font-medium">starting from</div>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                        {service.description}
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        {service.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      
                      {/* Rating and Reviews */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            <span className="font-bold text-slate-900 text-lg">
                              {service.rating}
                            </span>
                          </div>
                          <span className="text-slate-500 font-medium">
                            ({service.reviews} reviews)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-500">
                          <Eye className="w-5 h-5" />
                          <span className="font-medium">1.2k views</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-4">
                        <PremiumButton 
                          variant="primary" 
                          size="md" 
                          className="flex-1"
                        >
                          View Details
                        </PremiumButton>
                        <PremiumButton 
                          variant="secondary" 
                          size="md"
                        >
                          Contact
                        </PremiumButton>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Load More */}
            <motion.div 
              className="text-center mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <PremiumButton variant="ghost" size="lg">
                Load More Services
              </PremiumButton>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
