'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Clock,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';
import PremiumButton from '../../components/ui/PremiumButton';
import PremiumCard from '../../components/ui/PremiumCard';

const BookingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    service: '',
    eventType: '',
    date: '',
    time: '',
    location: '',
    guests: '',
    budget: '',
    specialRequests: '',
    contactInfo: {
      name: '',
      email: '',
      phone: ''
    }
  });

  const steps = [
    { id: 1, title: 'Select Service', icon: Star },
    { id: 2, title: 'Event Details', icon: Calendar },
    { id: 3, title: 'Contact Info', icon: Users },
    { id: 4, title: 'Review & Confirm', icon: CheckCircle }
  ];

  const services = [
    {
      id: 1,
      name: 'Elite Wedding Planners',
      category: 'Wedding Planning',
      price: '₹50,000',
      rating: 4.9,
      reviews: 127,
      image: 'https://images.unsplash.com/photo-1519167758481-83f1426cc6a3?w=400',
      description: 'Complete wedding planning and coordination services'
    },
    {
      id: 2,
      name: 'Royal Catering Services',
      category: 'Catering',
      price: '₹15,000',
      rating: 4.8,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      description: 'Premium catering for all occasions'
    },
    {
      id: 3,
      name: 'LensCraft Photography',
      category: 'Photography',
      price: '₹25,000',
      rating: 4.9,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
      description: 'Professional photography and videography'
    }
  ];

  const eventTypes = [
    'Wedding',
    'Birthday Party',
    'Corporate Event',
    'Anniversary',
    'Graduation',
    'Baby Shower',
    'Other'
  ];

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Choose Your Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PremiumCard 
                    className={`cursor-pointer transition-all ${
                      formData.service === service.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => handleInputChange('service', service.id)}
                    hoverEffect="lift"
                  >
                    <div className="relative h-48 mb-4">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold">{service.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                      <p className="text-slate-600 mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-indigo-600">{service.price}</span>
                        <span className="text-sm text-slate-500">({service.reviews} reviews)</span>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Event Details</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => handleInputChange('eventType', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter event location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.guests}
                      onChange={(e) => handleInputChange('guests', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Budget Range
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select budget range</option>
                      <option value="under-50k">Under ₹50,000</option>
                      <option value="50k-1l">₹50,000 - ₹1,00,000</option>
                      <option value="1l-2l">₹1,00,000 - ₹2,00,000</option>
                      <option value="2l-5l">₹2,00,000 - ₹5,00,000</option>
                      <option value="above-5l">Above ₹5,00,000</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Special Requests
                </label>
                <textarea
                  placeholder="Any special requirements or requests..."
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Information</h2>
            <div className="max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.contactInfo.name}
                    onChange={(e) => handleInputChange('contactInfo.name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        const selectedService = services.find(s => s.id === formData.service);
        return (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Review & Confirm</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Booking Summary</h3>
                <PremiumCard className="p-6 mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={selectedService?.image}
                      alt={selectedService?.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedService?.name}</h4>
                      <p className="text-slate-600">{selectedService?.category}</p>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-slate-600">{selectedService?.rating} ({selectedService?.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                </PremiumCard>

                <PremiumCard className="p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Event Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{formData.date} at {formData.time}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{formData.location}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{formData.guests} guests</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">Budget: {formData.budget}</span>
                    </div>
                  </div>
                </PremiumCard>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Contact Information</h3>
                <PremiumCard className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{formData.contactInfo.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{formData.contactInfo.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-indigo-600" />
                      <span className="text-slate-600">{formData.contactInfo.phone}</span>
                    </div>
                  </div>
                </PremiumCard>

                {formData.specialRequests && (
                  <PremiumCard className="p-6 mt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Special Requests</h4>
                    <p className="text-slate-600">{formData.specialRequests}</p>
                  </PremiumCard>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">
                Eventrra
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    currentStep >= step.id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 text-slate-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </motion.div>
                
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-4 ${
                    currentStep > step.id ? 'bg-indigo-600' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <div className={`text-sm font-semibold ${
                  currentStep >= step.id ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div 
          className="flex items-center justify-between mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PremiumButton
            variant="ghost"
            size="lg"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </PremiumButton>

          {currentStep < 4 ? (
            <PremiumButton
              variant="primary"
              size="lg"
              onClick={nextStep}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </PremiumButton>
          ) : (
            <PremiumButton
              variant="primary"
              size="lg"
              className="flex items-center space-x-2"
            >
              <span>Confirm Booking</span>
              <CheckCircle className="w-5 h-5" />
            </PremiumButton>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BookingFlow;
