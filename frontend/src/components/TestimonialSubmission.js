'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, X, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const TestimonialSubmission = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    serviceProviderId: '',
    bookingId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStarClick = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (formData.comment.trim().length < 10) {
      toast.error('Please write at least 10 characters for your comment');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.testimonials.createTestimonial({
        rating: formData.rating,
        comment: formData.comment.trim(),
        serviceProviderId: formData.serviceProviderId || null,
        bookingId: formData.bookingId || null
      });
      
      toast.success('Testimonial submitted successfully! It will be reviewed before being published.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      
      // Check if it's a backend connection error
      if (error.message.includes('HTTP error! status: 404') || error.message.includes('Unable to connect to server')) {
        toast.error('Backend server is not running. Please start the backend server to submit testimonials.');
      } else {
        toast.error('Failed to submit testimonial. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Share Your Experience</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              How would you rate your experience? *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || formData.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm text-gray-600">
                {formData.rating > 0 && (
                  <span className="font-medium">
                    {formData.rating === 1 && 'Poor'}
                    {formData.rating === 2 && 'Fair'}
                    {formData.rating === 3 && 'Good'}
                    {formData.rating === 4 && 'Very Good'}
                    {formData.rating === 5 && 'Excellent'}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-gray-800 mb-3">
              Tell us about your experience *
            </label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Share your thoughts about your experience with Eventrra..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/500 characters (minimum 10)
            </p>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="serviceProviderId" className="block text-sm font-semibold text-gray-800 mb-2">
                Service Provider (Optional)
              </label>
              <input
                id="serviceProviderId"
                name="serviceProviderId"
                type="text"
                value={formData.serviceProviderId}
                onChange={handleInputChange}
                placeholder="If this testimonial is about a specific service provider"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="bookingId" className="block text-sm font-semibold text-gray-800 mb-2">
                Booking ID (Optional)
              </label>
              <input
                id="bookingId"
                name="bookingId"
                type="text"
                value={formData.bookingId}
                onChange={handleInputChange}
                placeholder="If this testimonial is about a specific booking"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Review Process</p>
                <p>Your testimonial will be reviewed by our team before being published. This helps us maintain quality and authenticity.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-semibold hover:text-gray-900 transition-colors border-2 border-gray-200 rounded-2xl hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.rating === 0 || formData.comment.trim().length < 10}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Testimonial</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TestimonialSubmission;
