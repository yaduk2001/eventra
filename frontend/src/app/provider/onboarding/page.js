'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Globe, Instagram, Facebook, Twitter, Plus, Trash2, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { auth } from '../../../lib/firebase';
import toast from 'react-hot-toast';
import { debugAuthFlow } from '../../../utils/authFlowTest';

const ProviderOnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, userProfile, refreshUserProfile } = useAuth();
  
  // Debug logging and profile completion check
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    console.log('=== Onboarding Page State ===');
    console.log('Loading:', loading);
    console.log('User:', user ? `${user.uid} (${user.email})` : 'null');
    console.log('UserProfile:', userProfile);
    console.log('User role from localStorage:', typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'N/A (SSR)');
    console.log('Registration complete:', typeof window !== 'undefined' ? localStorage.getItem('registrationComplete') : 'N/A (SSR)');
    
    // Run comprehensive debug test
    if (!loading) {
      try {
        const debugResult = debugAuthFlow(user, userProfile, 'ProviderOnboarding');
        
        // Check if user is actually a provider
        const providerRoles = ['event_company', 'caterer', 'transport', 'photographer'];
        const userRole = userProfile?.role || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null);
        
        // If user is not a provider, redirect them to their appropriate dashboard
        if (user && userRole && !providerRoles.includes(userRole)) {
          console.log('User is not a service provider, redirecting to appropriate dashboard');
          const redirectPath = userRole === 'customer' ? '/customer/dashboard' : 
                              userRole === 'freelancer' ? '/freelancer/dashboard' :
                              userRole === 'jobseeker' ? '/jobseeker/dashboard' :
                              userRole === 'admin' ? '/admin' : '/customer/dashboard';
          toast.success('Redirecting to your dashboard...');
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 1000);
          return;
        }
        
        // If user is authenticated and has a complete profile, redirect to dashboard
        if (user && userProfile && (userProfile.profileComplete || userProfile.completed)) {
          if (providerRoles.includes(userProfile.role)) {
            console.log('User has complete profile, redirecting to dashboard');
            toast.success('Profile already complete! Redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/provider/dashboard';
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Debug flow error:', error);
      }
    }
  }, [user, userProfile, loading]);
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    category: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    
    // Social Media
    instagram: '',
    facebook: '',
    twitter: '',
    
    // Services
    services: [
      { name: '', description: '', price: '', duration: '' }
    ],
    
    // Portfolio
    portfolio: [],
    
    // Availability
    availability: {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '18:00', available: true },
      sunday: { start: '09:00', end: '18:00', available: false }
    },
    
    // Additional fields that were missing
    pricing: {},
    certifications: [],
    insurance: '',
    experience: '',
    teamSize: '',
    languages: [],
    serviceAreas: [],
    specialties: [],
    equipment: [],
    references: []
  });

  // Auto-populate form with existing profile data and user email
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (user && user.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
    
    // Pre-populate form with existing profile data if available
    if (userProfile && !formData.companyName) {
      console.log('Pre-populating form with existing profile data');
      console.log('UserProfile data:', userProfile);
      console.log('UserProfile phone field:', userProfile.phone);
      console.log('UserProfile email field:', userProfile.email);
      
      setFormData(prev => ({
        ...prev,
        companyName: userProfile.businessName || '',
        category: userProfile.category || '',
        description: userProfile.description || '',
        location: userProfile.location || '',
        phone: userProfile.phone || '',
        email: userProfile.email || user?.email || '',
        website: userProfile.website || '',
        instagram: userProfile.socialMedia?.instagram || '',
        facebook: userProfile.socialMedia?.facebook || '',
        twitter: userProfile.socialMedia?.twitter || '',
        services: userProfile.services || [{ name: '', description: '', price: '', duration: '' }],
        portfolio: userProfile.portfolio || [],
        availability: userProfile.availability || prev.availability
      }));
    }
  }, [user, userProfile, formData.email, formData.companyName]);

  const categories = [
    'Wedding Planning',
    'Photography & Videography',
    'Catering',
    'Transportation',
    'Venue Management',
    'Entertainment',
    'Decor & Styling',
    'Event Coordination',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({
      ...formData,
      services: newServices
    });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', description: '', price: '', duration: '' }]
    });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      services: newServices
    });
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          [field]: value
        }
      }
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit called');
    console.log('User:', user);
    console.log('Form data:', formData);
    console.log('Current step:', currentStep);
    
    if (!user) {
      console.log('❌ No user found');
      toast.error('Please log in to continue');
      return;
    }

    // Basic validation for required fields
    console.log('🔍 Validating form data...');
    console.log('📋 Field values:');
    console.log('  - Company name:', `"${formData.companyName}" (length: ${formData.companyName.length})`);
    console.log('  - Category:', `"${formData.category}"`);
    console.log('  - Description:', `"${formData.description}" (length: ${formData.description.length})`);
    console.log('  - Phone:', `"${formData.phone}" (length: ${formData.phone.length})`);
    console.log('  - Email:', `"${formData.email}" (length: ${formData.email.length})`);
    console.log('  - User email:', user?.email);
    
    if (!formData.companyName.trim()) {
      console.log('❌ Company name validation failed - empty or whitespace only');
      toast.error('Company name is required');
      return;
    }
    console.log('✅ Company name validation passed');
    
    if (!formData.category) {
      console.log('❌ Category validation failed - no category selected');
      toast.error('Please select a category');
      return;
    }
    console.log('✅ Category validation passed');
    
    if (!formData.description.trim()) {
      console.log('❌ Description validation failed - empty or whitespace only');
      toast.error('Description is required');
      return;
    }
    console.log('✅ Description validation passed');
    // Location is now optional
    // if (!formData.location.trim()) {
    //   console.log('❌ Location validation failed');
    //   toast.error('Location is required');
    //   return;
    // }
    if (!formData.phone.trim()) {
      console.log('❌ Phone validation failed - empty or whitespace only');
      toast.error('Phone number is required');
      return;
    }
    console.log('✅ Phone validation passed');
    
    // Use logged-in user's email if form email is empty
    const emailToUse = formData.email.trim() || user.email;
    if (!emailToUse) {
      console.log('❌ Email validation failed - no email available');
      console.log('  - Form email:', `"${formData.email}"`);
      console.log('  - User email:', user?.email);
      toast.error('Email is required');
      return;
    }
    console.log('✅ Email validation passed, using:', emailToUse);
    console.log('🎉 All validations passed - proceeding with submission');

    setIsSubmitting(true);
    
    try {
      console.log('Submitting provider profile data...');
      
      // Test backend connectivity first
      try {
        await api.health();
        console.log('Backend connectivity confirmed');
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        throw new Error('Unable to connect to server. Please make sure the backend is running.');
      }

      // Validate authentication token
      if (!user || !auth.currentUser) {
        throw new Error('Authentication required. Please log in again.');
      }

      try {
        const token = await auth.currentUser.getIdToken();
        if (!token) {
          throw new Error('Unable to get authentication token. Please log in again.');
        }
        console.log('Authentication token validated');
      } catch (tokenError) {
        console.error('Token validation failed:', tokenError);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Prepare provider profile data
      const providerData = {
        businessName: formData.companyName,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        phone: formData.phone,
        email: emailToUse,
        website: formData.website || '',
        socialMedia: {
          instagram: formData.instagram || '',
          facebook: formData.facebook || '',
          twitter: formData.twitter || ''
        },
        services: Array.isArray(formData.services) ? formData.services.filter(service => service && service.name && service.name.trim() !== '') : [],
        portfolio: Array.isArray(formData.portfolio) ? formData.portfolio.filter(item => item && item.url && item.url.trim() !== '') : [],
        availability: formData.availability,
        pricing: formData.pricing || {},
        certifications: Array.isArray(formData.certifications) ? formData.certifications.filter(cert => cert && cert.name && cert.name.trim() !== '') : [],
        insurance: formData.insurance || '',
        experience: formData.experience || '',
        teamSize: formData.teamSize || '',
        languages: Array.isArray(formData.languages) ? formData.languages : [],
        serviceAreas: Array.isArray(formData.serviceAreas) ? formData.serviceAreas : [],
        specialties: Array.isArray(formData.specialties) ? formData.specialties : [],
        equipment: Array.isArray(formData.equipment) ? formData.equipment : [],
        references: Array.isArray(formData.references) ? formData.references.filter(ref => ref && ref.name && ref.name.trim() !== '') : [],
        role: 'event_company', // Set the role for service providers
        profileComplete: true,
        completed: true,
        updatedAt: new Date().toISOString()
      };

      console.log('Provider data to submit:', providerData);

      // Update user profile with provider data
      const response = await api.updateUserProfile(providerData);
      console.log('Profile update response:', response);
      
      toast.success('Profile completed successfully! Redirecting to your dashboard...');
      
      // Refresh the user profile in AuthContext to get the updated data
      try {
        await refreshUserProfile();
        console.log('User profile refreshed successfully');
      } catch (refreshError) {
        console.warn('Failed to refresh profile, but continuing with redirect:', refreshError);
      }
      
      // Small delay to ensure the toast is visible and profile is refreshed
      setTimeout(() => {
        // Use router.push for better navigation
        window.location.href = '/provider/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Error saving provider profile:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // More specific error messages
      let errorMessage = 'Please try again.';
      if (error.message.includes('Unable to connect to server')) {
        errorMessage = 'Unable to connect to server. Please make sure you have an internet connection.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage = 'Invalid data provided. Please check your inputs.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Failed to save profile: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Enter your company name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="4"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Describe your business and what makes you unique..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="City, State (optional)"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address * (from your account)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="email"
              type="email"
              value={formData.email || user?.email || ''}
              readOnly
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
              placeholder="Loading email..."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">This email is from your logged-in account</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="https://yourcompany.com"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Services</h2>
        <p className="text-gray-600">Add the services you offer and set your pricing</p>
      </div>

      {formData.services.map((service, index) => (
        <PremiumCard key={index} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Service {index + 1}</h3>
            {formData.services.length > 1 && (
              <button
                onClick={() => removeService(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                value={service.name}
                onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., Wedding Photography Package"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price *
              </label>
              <input
                value={service.price}
                onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., ₹50,000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration
              </label>
              <input
                value={service.duration}
                onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., 8 hours"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={service.description}
                onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                rows="3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Describe what's included in this service..."
                required
              />
            </div>
          </div>
        </PremiumCard>
      ))}

      <PremiumButton
        variant="ghost"
        onClick={addService}
        className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Another Service
      </PremiumButton>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Media & Portfolio</h2>
        <p className="text-gray-600">Connect your social accounts and showcase your work</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Instagram
          </label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-500" />
            <input
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="@yourusername"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Facebook
          </label>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
            <input
              name="facebook"
              value={formData.facebook}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Your Facebook Page"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Twitter
          </label>
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              name="twitter"
              value={formData.twitter}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="@yourusername"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Portfolio Images
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Upload your best work</p>
          <p className="text-sm text-gray-500">Drag and drop images or click to browse</p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability</h2>
        <p className="text-gray-600">Set your working hours for each day</p>
      </div>

      <div className="space-y-4">
        {Object.entries(formData.availability).map(([day, schedule]) => (
          <PremiumCard key={day} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={schedule.available}
                  onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="font-semibold text-gray-900 capitalize">{day}</span>
              </div>
              
              {schedule.available && (
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start</label>
                    <input
                      type="time"
                      value={schedule.start}
                      onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End</label>
                    <input
                      type="time"
                      value={schedule.end}
                      onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </PremiumCard>
        ))}
      </div>
    </div>
  );

  // Redirect unauthenticated users (only after loading is complete and sufficient time has passed)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    let timeoutId;
    
    if (!loading && !user) {
      console.log('User not authenticated after loading complete, starting redirect timer');
      
      // Check if we have evidence that user should be here (from localStorage)
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      const registrationComplete = typeof window !== 'undefined' ? localStorage.getItem('registrationComplete') : null;
      
      if (userRole && ['event_company', 'caterer', 'transport', 'photographer'].includes(userRole)) {
        console.log('User role in localStorage suggests service provider, extending wait time');
        // Give more time for service providers as they might be coming from registration
        timeoutId = setTimeout(() => {
          if (!user) {
            console.log('User still not authenticated after extended timeout, redirecting to login');
            // Clear localStorage to prevent confusion
            localStorage.removeItem('userRole');
            localStorage.removeItem('registrationComplete');
            window.location.href = '/auth/login';
          }
        }, 8000); // Extended to 8 seconds for service providers coming from registration
      } else {
        // Use shorter delay for others
        timeoutId = setTimeout(() => {
          if (!user) {
            console.log('User still not authenticated after timeout, redirecting to login');
            window.location.href = '/auth/login';
          }
        }, 3000);
      }
    }
    
    // Clear timeout if user becomes available
    if (user && timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, loading]);

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show loading state if user is authenticated but profile is still loading
  if (user && userProfile === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your service provider profile...</p>
        </div>
      </div>
    );
  }

  // Show loading state if user is still being determined (prevent flash of login message)
  if (!user) {
    // Check if we have localStorage evidence that user should be here (only on client side)
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const isServiceProvider = userRole && ['event_company', 'caterer', 'transport', 'photographer'].includes(userRole);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isServiceProvider 
              ? "Verifying your service provider authentication..." 
              : "Verifying authentication..."
            }
          </p>
          {isServiceProvider && (
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we set up your profile...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Eventrra
            </span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Set up your business profile to start receiving bookings</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          className="flex items-center justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <PremiumCard className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                <PremiumButton
                  variant="ghost"
                  size="lg"
                  onClick={handlePrev}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Previous
                </PremiumButton>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <PremiumButton
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </PremiumButton>
              ) : (
                <PremiumButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    console.log('🔥 Complete Setup button clicked!');
                    handleSubmit();
                  }}
                  disabled={isSubmitting}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Saving Profile...' : 'Complete Setup'}
                </PremiumButton>
              )}
            </div>
          </PremiumCard>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ProviderOnboardingPage;
