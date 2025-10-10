'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Globe, Instagram, Facebook, Twitter, Plus, Trash2, Save, Sparkles, Briefcase, DollarSign, Star, FileText, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import PremiumButton from '../../../components/ui/PremiumButton';
import PremiumCard from '../../../components/ui/PremiumCard';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

const FreelancerRegistrationPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    
    // Professional Information
    title: '',
    bio: '',
    hourlyRate: '',
    experience: '',
    skills: [],
    
    // Portfolio
    portfolio: [],
    
    // Social Media
    instagram: '',
    facebook: '',
    twitter: '',
    
    // Availability
    availability: 'available',
    
    // Certifications
    certifications: []
  });

  const skillCategories = [
    'Photography', 'Videography', 'Event Planning', 'Catering', 'Transportation',
    'Decoration', 'Music & DJ', 'Photography Editing', 'Video Editing', 'Graphic Design',
    'Marketing', 'Coordination', 'Management', 'Customer Service', 'Other'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillAdd = (skill) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill.trim()]
      });
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleCertificationAdd = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: '', issuer: '', date: '' }]
    });
  };

  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index][field] = value;
    setFormData({
      ...formData,
      certifications: newCertifications
    });
  };

  const handleCertificationRemove = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
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
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare freelancer profile data
      const freelancerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        title: formData.title,
        bio: formData.bio,
        hourlyRate: formData.hourlyRate,
        experience: formData.experience,
        skills: formData.skills,
        portfolio: formData.portfolio,
        socialMedia: {
          instagram: formData.instagram,
          facebook: formData.facebook,
          twitter: formData.twitter
        },
        availability: formData.availability,
        certifications: formData.certifications,
        userType: 'freelancer',
        profileComplete: true,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        completed: true,
        updatedAt: new Date().toISOString()
      };

      // Update user profile with freelancer data
      await api.updateUserProfile(freelancerData);
      
      toast.success('Freelancer profile completed successfully!');
      
      // Redirect to freelancer dashboard
      window.location.href = '/freelancer/dashboard';
      
    } catch (error) {
      console.error('Error saving freelancer profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Name *
          </label>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Enter your first name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
              required
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
              placeholder="+91 98765 43210"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Location *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="City, State"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Information</h2>
        <p className="text-gray-600">Tell us about your professional background</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Professional Title *
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="e.g., Event Photographer"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hourly Rate *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g., ₹2,500"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Bio *
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows="4"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Tell us about your experience and expertise..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Years of Experience *
        </label>
        <input
          name="experience"
          value={formData.experience}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="e.g., 5 years"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Skills *
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.skills.map((skill, index) => (
            <span key={index} className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
              <span>{skill}</span>
              <button
                onClick={() => handleSkillRemove(skill)}
                className="text-indigo-500 hover:text-indigo-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add a skill..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSkillAdd(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.target.previousElementSibling;
              handleSkillAdd(input.value);
              input.value = '';
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-2">Popular skills:</p>
          <div className="flex flex-wrap gap-2">
            {skillCategories.slice(0, 8).map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillAdd(skill)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio & Social Media</h2>
        <p className="text-gray-600">Showcase your work and connect your social accounts</p>
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
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Certifications & Availability</h2>
        <p className="text-gray-600">Add your certifications and set your availability</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Certifications
        </label>
        {formData.certifications.map((cert, index) => (
          <PremiumCard key={index} className="p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Certification {index + 1}</h3>
              <button
                onClick={() => handleCertificationRemove(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certification Name
                </label>
                <input
                  value={cert.name}
                  onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., Adobe Certified Expert"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issuing Organization
                </label>
                <input
                  value={cert.issuer}
                  onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., Adobe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Obtained
                </label>
                <input
                  type="date"
                  value={cert.date}
                  onChange={(e) => handleCertificationChange(index, 'date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </PremiumCard>
        ))}
        
        <PremiumButton
          variant="ghost"
          onClick={handleCertificationAdd}
          className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Certification
        </PremiumButton>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Availability Status
        </label>
        <select
          name="availability"
          value={formData.availability}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        >
          <option value="available">Available for new projects</option>
          <option value="busy">Currently busy</option>
          <option value="unavailable">Not available</option>
        </select>
      </div>
    </div>
  );

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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as a Freelancer</h1>
          <p className="text-gray-600">Complete your profile to start finding amazing freelance opportunities</p>
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
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
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

export default FreelancerRegistrationPage;
