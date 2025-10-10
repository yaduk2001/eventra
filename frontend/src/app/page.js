'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Star, 
  Users, 
  Calendar, 
  Camera, 
  Truck, 
  Utensils, 
  Building, 
  Heart, 
  ArrowRight, 
  CheckCircle, 
  Sparkles,
  Play,
  Award,
  Shield,
  Globe,
  Zap,
  ChevronRight,
  Menu,
  X,
  Plus,
  MessageSquare
} from 'lucide-react';
import PremiumButton from '../components/ui/PremiumButton';
import PremiumCard from '../components/ui/PremiumCard';
import TestimonialSubmission from '../components/TestimonialSubmission';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);
  const { user } = useAuth();

  // Load user testimonials
  useEffect(() => {
    const loadTestimonials = async () => {
      setIsLoadingTestimonials(true);
      try {
        const response = await api.testimonials.getTestimonials(6, false);
        setUserTestimonials(response.data || []);
      } catch (error) {
        console.error('Error loading testimonials:', error);
        // Keep dummy testimonials if API fails - this is expected if backend is not running
        console.log('Using dummy testimonials - backend not available');
      } finally {
        setIsLoadingTestimonials(false);
      }
    };

    loadTestimonials();
  }, []);

  const handleTestimonialSuccess = () => {
    // Reload testimonials after successful submission
    const loadTestimonials = async () => {
      try {
        const response = await api.testimonials.getTestimonials(6, false);
        setUserTestimonials(response.data || []);
      } catch (error) {
        console.error('Error reloading testimonials:', error);
      }
    };
    loadTestimonials();
  };

  const categories = [
    { name: 'Wedding Planning', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { name: 'Corporate Events', icon: Building, color: 'from-blue-500 to-indigo-500' },
    { name: 'Photography', icon: Camera, color: 'from-purple-500 to-violet-500' },
    { name: 'Catering', icon: Utensils, color: 'from-orange-500 to-red-500' },
    { name: 'Transportation', icon: Truck, color: 'from-green-500 to-emerald-500' },
    { name: 'Entertainment', icon: Star, color: 'from-yellow-500 to-amber-500' }
  ];

  const featuredCompanies = [
    {
      name: 'Elite Wedding Planners',
      rating: 4.9,
      reviews: 127,
      image: 'https://images.unsplash.com/photo-1519167758481-83f1426cc6a3?w=400',
      services: ['Wedding Planning', 'Event Coordination'],
      price: '₹50,000+'
    },
    {
      name: 'Royal Catering',
      rating: 4.8,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      services: ['Catering', 'Food Service'],
      price: '₹15,000+'
    },
    {
      name: 'LensCraft Photography',
      rating: 4.9,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
      services: ['Photography', 'Videography'],
      price: '₹25,000+'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Professionals',
      description: 'All service providers are thoroughly vetted and verified'
    },
    {
      icon: Zap,
      title: 'Direct Communication',
      description: 'Connect directly with service providers for personalized quotes and custom packages'
    },
    {
      icon: Globe,
      title: 'Wide Coverage',
      description: 'Find professionals in 50+ cities across India'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Bride',
      content: 'Eventrra made my wedding planning so much easier. Found the perfect photographer and caterer!',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Corporate Event Manager',
      content: 'Amazing platform for corporate events. Highly professional service providers.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Event Planner',
      content: 'As a service provider, Eventrra has helped me grow my business significantly.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/95 border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Eventrra
              </span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Services</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Contact</a>
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <button className="px-6 py-2.5 text-gray-700 font-semibold hover:text-gray-900 transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden py-4 border-t border-gray-100"
            >
              <div className="flex flex-col space-y-4">
                <a href="#services" className="text-gray-600 hover:text-gray-900 font-medium">Services</a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">About</a>
                <a href="#contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</a>
                <div className="flex flex-col space-y-3 pt-4">
                  <Link href="/auth/login" className="w-full">
                    <button className="w-full px-6 py-3 text-gray-700 font-semibold hover:text-gray-900 transition-colors border border-gray-200 rounded-xl hover:bg-gray-50">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/register" className="w-full">
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
                      Get Started
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Trusted by 10,000+ customers
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-gray-900">Create</span>
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Unforgettable
                  </span>
                  <br />
                  <span className="text-gray-900">Events</span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Connect with the world's best event professionals. From intimate gatherings to grand celebrations, 
                  we make your vision come to life.
                </p>
              </div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
                  <Search className="w-6 h-6 text-gray-400 ml-4" />
                  <input
                    type="text"
                    placeholder="What kind of event are you planning?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-4 text-lg border-0 focus:outline-none focus:ring-0"
                  />
                  <PremiumButton variant="primary" size="lg" className="mr-2">
                    Search
                  </PremiumButton>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/auth/register">
                  <PremiumButton variant="primary" size="xl" className="flex items-center justify-center">
                    Start Planning
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </PremiumButton>
                </Link>
                <Link href="/services">
                  <PremiumButton variant="ghost" size="xl" className="flex items-center justify-center">
                    <Play className="w-5 h-5 mr-2" />
                    Browse Services
                  </PremiumButton>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex items-center space-x-8 pt-8"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Event Professionals</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600">Cities</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Floating Elements */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-96 lg:h-[600px]"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl"
                >
                  <Heart className="w-16 h-16 text-white" />
                </motion.div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [0, -30, 0],
                  x: [0, 20, 0]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute top-20 right-10 w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <Camera className="w-8 h-8 text-white" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 30, 0],
                  x: [0, -15, 0]
                }}
                transition={{ 
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute bottom-20 left-10 w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <Utensils className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Event Categories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing event services across all categories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <PremiumCard className="p-8 text-center group cursor-pointer" hoverEffect="lift">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600">Professional services for your special events</p>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Event Professionals</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover verified professionals who set their own services and pricing
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCompanies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <PremiumCard className="overflow-hidden" hoverEffect="lift">
                  <img
                    src={company.image}
                    alt={company.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold text-gray-700">{company.rating}</span>
                        <span className="text-sm text-gray-500">({company.reviews})</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {company.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full mr-2"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-indigo-600">{company.price}</span>
                      <PremiumButton variant="primary" size="sm">
                        View Profile
                      </PremiumButton>
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl font-bold text-gray-900 mb-4"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: "linear-gradient(45deg, #1f2937, #10b981, #06b6d4, #1f2937)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Why Choose Eventrra?
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Connect directly with professionals who control their own services and pricing
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -15,
                  scale: 1.08,
                  rotateY: 8,
                  rotateX: 8
                }}
                className="text-center group cursor-pointer relative"
              >
                {/* Animated Background Card */}
                <motion.div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(16, 185, 129, 0.05), rgba(6, 182, 212, 0.05))",
                      "linear-gradient(45deg, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05))",
                      "linear-gradient(45deg, rgba(20, 184, 166, 0.05), rgba(16, 185, 129, 0.05))"
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <motion.div 
                  className="relative"
                  whileHover={{
                    rotateY: 15,
                    rotateX: 15,
                    scale: 1.15
                  }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
                >
                  {/* Super Fast Light Effects BEHIND the icon */}
                  <motion.div
                    className="absolute inset-0 w-32 h-32 rounded-3xl mx-auto mb-6 opacity-0 group-hover:opacity-100"
                    animate={{
                      background: [
                        "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)",
                        "radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)",
                        "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)",
                        "radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)",
                        "radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)"
                      ]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Fast Rotating Light Ring */}
                  <motion.div
                    className="absolute inset-0 w-32 h-32 rounded-3xl mx-auto mb-6 opacity-0 group-hover:opacity-60"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-full h-full border-2 border-white/40 rounded-3xl" />
                  </motion.div>
                  
                  {/* Fast Pulsing Light */}
                  <motion.div
                    className="absolute inset-0 w-28 h-28 rounded-3xl mx-auto mb-6 opacity-0 group-hover:opacity-40"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      background: "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)"
                    }}
                  />
                  
                  {/* Fast Moving Light Spots */}
                  <motion.div
                    className="absolute inset-0 w-32 h-32 rounded-3xl mx-auto mb-6 opacity-0 group-hover:opacity-50"
                    animate={{
                      background: [
                        "radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.7) 0%, transparent 40%)",
                        "radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.7) 0%, transparent 40%)",
                        "radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.7) 0%, transparent 40%)",
                        "radial-gradient(circle at 10% 50%, rgba(255, 255, 255, 0.7) 0%, transparent 40%)",
                        "radial-gradient(circle at 90% 50%, rgba(255, 255, 255, 0.7) 0%, transparent 40%)"
                      ]
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Animated Gradient Icon Container */}
                  <motion.div 
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
                    animate={{
                      background: [
                        "linear-gradient(45deg, #10b981, #06b6d4, #14b8a6)",
                        "linear-gradient(45deg, #06b6d4, #14b8a6, #10b981)",
                        "linear-gradient(45deg, #14b8a6, #10b981, #06b6d4)"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    whileHover={{
                      boxShadow: [
                        "0 25px 50px -12px rgba(16, 185, 129, 0.4)",
                        "0 25px 50px -12px rgba(6, 182, 212, 0.4)",
                        "0 25px 50px -12px rgba(20, 184, 166, 0.4)"
                      ]
                    }}
                  >
                    <motion.div
                      whileHover={{ 
                        scale: 1.2,
                        rotate: 360
                      }}
                      transition={{ duration: 0.6, type: "spring" }}
                      className="relative"
                    >
                      {/* Multicolor Gradient Background for Icon */}
                      <motion.div
                        className="absolute inset-0 w-12 h-12 rounded-full"
                        animate={{
                          background: [
                            "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)",
                            "linear-gradient(45deg, #feca57, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)",
                            "linear-gradient(45deg, #96ceb4, #feca57, #ff6b6b, #4ecdc4, #45b7d1)",
                            "linear-gradient(45deg, #45b7d1, #96ceb4, #feca57, #ff6b6b, #4ecdc4)",
                            "linear-gradient(45deg, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff6b6b)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          WebkitMask: "url(#icon-mask)",
                          mask: "url(#icon-mask)"
                        }}
                      />
                      
                      {/* Animated Rainbow Border */}
                      <motion.div
                        className="absolute inset-0 w-12 h-12 rounded-full border-2"
                        animate={{
                          borderColor: [
                            "#ff6b6b",
                            "#4ecdc4", 
                            "#45b7d1",
                            "#96ceb4",
                            "#feca57",
                            "#ff6b6b"
                          ]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Multicolor Glow Effect */}
                      <motion.div
                        className="absolute inset-0 w-12 h-12 rounded-full opacity-0 group-hover:opacity-60 blur-sm"
                        animate={{
                          background: [
                            "radial-gradient(circle, #ff6b6b 0%, transparent 70%)",
                            "radial-gradient(circle, #4ecdc4 0%, transparent 70%)",
                            "radial-gradient(circle, #45b7d1 0%, transparent 70%)",
                            "radial-gradient(circle, #96ceb4 0%, transparent 70%)",
                            "radial-gradient(circle, #feca57 0%, transparent 70%)"
                          ]
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      <feature.icon className="w-12 h-12 text-white drop-shadow-lg relative z-10" />
                    </motion.div>
                  </motion.div>
                  
                  {/* Multiple Glow Effects */}
                  <motion.div
                    className="absolute inset-0 w-24 h-24 rounded-3xl mx-auto opacity-0 group-hover:opacity-30 blur-2xl"
                    animate={{
                      background: [
                        "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)",
                        "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)",
                        "radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    whileHover={{
                      scale: 1.5,
                      opacity: 0.5
                    }}
                  />
                  
                  <motion.div
                    className="absolute inset-0 w-24 h-24 rounded-3xl mx-auto opacity-0 group-hover:opacity-20 blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.5
                    }}
                    style={{
                      background: "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)"
                    }}
                  />
                </motion.div>
                
                <motion.h3 
                  className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors duration-300 relative"
                  whileHover={{ 
                    scale: 1.08,
                    y: -2
                  }}
                  animate={{
                    textShadow: [
                      "0 0 0px rgba(16, 185, 129, 0)",
                      "0 0 10px rgba(16, 185, 129, 0.3)",
                      "0 0 0px rgba(16, 185, 129, 0)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {feature.title}
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300"
                  whileHover={{ 
                    scale: 1.03,
                    y: -1
                  }}
                >
                  {feature.description}
                </motion.p>
                
                {/* Enhanced Floating Particles */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${
                        i % 3 === 0 ? 'bg-emerald-400' : 
                        i % 3 === 1 ? 'bg-cyan-400' : 'bg-teal-400'
                      }`}
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${30 + (i * 10)}%`
                      }}
                      animate={{
                        y: [0, -30, 0],
                        x: [0, Math.sin(i) * 20, 0],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </motion.div>
                
                {/* Pulsing Ring Effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-emerald-300/50"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600">Real stories from real customers</p>
            
            {/* Add Testimonial Button for logged-in users */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6"
              >
                <button
                  onClick={() => setShowTestimonialModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Share Your Experience
                </button>
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Show user testimonials first, then dummy testimonials */}
            {userTestimonials.length > 0 ? (
              userTestimonials.map((testimonial, index) => (
                <motion.div
                  key={`user-${testimonial.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <PremiumCard className="p-8">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-4">
                        {testimonial.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.userName}</h4>
                        <p className="text-sm text-gray-600">Verified Customer</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">"{testimonial.comment}"</p>
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </PremiumCard>
                </motion.div>
              ))
            ) : (
              // Show dummy testimonials if no user testimonials
              testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <PremiumCard className="p-8">
                    <div className="flex items-center mb-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </PremiumCard>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating Light Shapes */}
        <motion.div
          className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-40"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-40"
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-8 h-8 bg-gradient-to-br from-indigo-200 to-blue-200 rounded-full opacity-40"
          animate={{
            y: [0, -25, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="relative"
          >
            {/* Main Title */}
            <motion.h2 
              className="text-5xl font-bold text-gray-900 mb-6 relative"
              whileHover={{
                scale: 1.02,
                y: -2
              }}
            >
              Ready to Plan Your Event?
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p 
              className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join thousands of satisfied customers who trust Eventrra for their special occasions.
            </motion.p>
            
            {/* Button Container */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Primary Button */}
              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.02
                }}
                whileTap={{
                  scale: 0.98
                }}
                transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
                className="relative group"
              >
                <Link href="/services">
                  <motion.button 
                    className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl group-hover:shadow-2xl transition-all duration-300 flex items-center gap-3"
                    whileHover={{
                      boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)"
                    }}
                  >
                    <span>Browse Services</span>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                </Link>
              </motion.div>
              
              {/* Secondary Button */}
              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.02
                }}
                whileTap={{
                  scale: 0.98
                }}
                transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
                className="relative group"
              >
                <Link href="/auth/register">
                  <motion.button 
                    className="relative border-2 border-indigo-600 text-indigo-600 px-12 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-600 hover:text-white transition-all duration-300"
                    whileHover={{
                      boxShadow: "0 20px 40px rgba(99, 102, 241, 0.2)"
                    }}
                  >
                    Become a Partner
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">Eventrra</span>
              </div>
              <p className="text-gray-400">
                Connecting you with the best event professionals for unforgettable experiences.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Wedding Planning</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Corporate Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Photography</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Catering</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Eventrra. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Testimonial Submission Modal */}
      {showTestimonialModal && (
        <TestimonialSubmission
          onClose={() => setShowTestimonialModal(false)}
          onSuccess={handleTestimonialSuccess}
        />
      )}
    </div>
  );
};

export default LandingPage;
