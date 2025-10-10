'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { auth } from '../../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { debugAuthFlow } from '../../../utils/authFlowTest';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: process.env.NODE_ENV !== 'production' ? 'admin@gmail.com' : '',
    password: process.env.NODE_ENV !== 'production' ? 'Admin@123' : ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      console.log('User signed in successfully:', user.uid);

      // Immediate admin override: if this is the admin account, go straight to admin panel
      if (user?.email && user.email.toLowerCase() === 'admin@gmail.com') {
        toast.success('Admin login successful! Redirecting...');
        window.location.href = '/admin';
        return;
      }
      
      // Wait for auth token to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get user profile from backend to determine role and redirect
      try {
        console.log('Fetching user profile for redirect...');
        const profileResponse = await api.getUserProfile();
        const userProfile = profileResponse.data;
        
        console.log('User profile retrieved:', userProfile);
        
        // Debug the authentication flow
        const debugResult = debugAuthFlow(user, userProfile, 'LoginPage');
        console.log('Debug result:', debugResult);
        
        toast.success('Login successful!');
        
        // Redirect based on user role and profile completion status
        if (userProfile.role === 'customer') {
          console.log('Redirecting customer to dashboard');
          window.location.href = '/customer/dashboard';
        } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(userProfile.role)) {
          // Service provider logic
          const isProfileComplete = userProfile.profileComplete || userProfile.completed;
          
          if (!isProfileComplete) {
            console.log('Service provider profile incomplete, redirecting to onboarding');
            // Store role in localStorage for onboarding page
            localStorage.setItem('userRole', userProfile.role);
            // Add a small delay to ensure AuthContext is updated
            setTimeout(() => {
              window.location.href = '/provider/onboarding';
            }, 500);
          } else {
            console.log('Service provider profile complete, redirecting to dashboard');
            setTimeout(() => {
              window.location.href = '/provider/dashboard';
            }, 500);
          }
        } else if (userProfile.role === 'freelancer') {
          console.log('Redirecting freelancer to dashboard');
          window.location.href = '/freelancer/dashboard';
        } else if (userProfile.role === 'jobseeker') {
          console.log('Redirecting jobseeker to dashboard');
          window.location.href = '/jobseeker/dashboard';
        } else if (userProfile.role === 'admin') {
          console.log('Redirecting admin to admin panel');
          window.location.href = '/admin';
        } else {
          console.log('Unknown role, defaulting to customer dashboard');
          window.location.href = '/customer/dashboard';
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        
        // If signed-in user is admin but profile missing/unavailable, still allow access
        if (user?.email && user.email.toLowerCase() === 'admin@gmail.com') {
          toast.success('Admin login successful! Redirecting...');
          window.location.href = '/admin';
          return;
        }

        // Handle different error scenarios
        if (profileError.message.includes('404') || profileError.message.includes('not found')) {
          console.log('Profile not found - new user needs to complete profile setup');
          
          // For new users without profiles, we need to determine their intended role
          // Check if they registered as a service provider by looking at the URL or localStorage
          const intendedRole = localStorage.getItem('userRole') || 'customer';
          
          if (['event_company', 'caterer', 'transport', 'photographer'].includes(intendedRole)) {
            console.log('New service provider detected, redirecting to onboarding');
            toast.success('Login successful! Please complete your service provider profile...');
            // Store role for onboarding page
            localStorage.setItem('userRole', intendedRole);
            setTimeout(() => {
              window.location.href = '/provider/onboarding';
            }, 500);
          } else {
            console.log('New customer detected, redirecting to customer dashboard');
            toast.success('Login successful! Setting up your account...');
            setTimeout(() => {
              window.location.href = '/customer/dashboard';
            }, 500);
          }
        } else if (profileError.message.includes('Unable to connect to server')) {
          console.warn('Backend server unavailable, redirecting to customer dashboard');
          toast.success('Login successful! (Server temporarily unavailable)');
          window.location.href = '/customer/dashboard';
        } else {
          console.log('Profile fetch failed, redirecting to customer dashboard');
          toast.success('Login successful! Redirecting...');
          window.location.href = '/customer/dashboard';
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center space-x-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Eventrra
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome back</h1>
          <p className="text-lg text-gray-600">Sign in to your account to continue</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Remember me</span>
                </label>
                <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all font-semibold text-gray-700">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  </svg>
                  Google
                </button>
                <button className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all font-semibold text-gray-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-lg">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
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

export default LoginPage;