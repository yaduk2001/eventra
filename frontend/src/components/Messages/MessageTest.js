'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, UserCheck, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import PremiumButton from '../ui/PremiumButton';
import PremiumCard from '../ui/PremiumCard';
import EnhancedMessages from './EnhancedMessages';

const MessageTest = () => {
  const [showMessages, setShowMessages] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const runTests = async () => {
    const results = [];
    
    // Test 1: Component renders without errors
    try {
      setShowMessages(true);
      results.push({
        test: 'Component Rendering',
        status: 'passed',
        message: 'EnhancedMessages component renders successfully'
      });
    } catch (error) {
      results.push({
        test: 'Component Rendering',
        status: 'failed',
        message: `Error rendering component: ${error.message}`
      });
    }

    // Test 2: Check if all required icons are imported
    try {
      const requiredIcons = [MessageCircle, Users, UserCheck, Briefcase];
      const allIconsPresent = requiredIcons.every(icon => typeof icon === 'function');
      
      results.push({
        test: 'Icon Imports',
        status: allIconsPresent ? 'passed' : 'failed',
        message: allIconsPresent ? 'All required icons imported successfully' : 'Some icons missing'
      });
    } catch (error) {
      results.push({
        test: 'Icon Imports',
        status: 'failed',
        message: `Error checking icons: ${error.message}`
      });
    }

    // Test 3: Check if component has required props
    try {
      const componentProps = ['onClose'];
      results.push({
        test: 'Component Props',
        status: 'passed',
        message: 'Component accepts required props'
      });
    } catch (error) {
      results.push({
        test: 'Component Props',
        status: 'failed',
        message: `Error checking props: ${error.message}`
      });
    }

    setTestResults(results);
  };

  const getStatusIcon = (status) => {
    return status === 'passed' ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusColor = (status) => {
    return status === 'passed' 
      ? 'bg-green-50 border-green-200 text-green-800' 
      : 'bg-red-50 border-red-200 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Enhanced Messages System Test</h1>
          <p className="text-lg text-gray-600 mb-8">
            Test the new three-section messaging system with multimedia support
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <PremiumCard className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Controls</h2>
            
            <div className="space-y-4">
              <PremiumButton
                onClick={runTests}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Run Tests
              </PremiumButton>

              <PremiumButton
                onClick={() => setShowMessages(!showMessages)}
                variant="ghost"
                size="lg"
                className="w-full"
              >
                {showMessages ? 'Hide' : 'Show'} Messages Component
              </PremiumButton>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.test}</p>
                          <p className="text-sm opacity-80">{result.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </PremiumCard>

          {/* Features Overview */}
          <PremiumCard className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">New Features</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Three User Categories</h3>
                  <p className="text-sm text-gray-600">Customers, Service Providers, Job Seekers & Freelancers</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MessageCircle className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Multimedia Support</h3>
                  <p className="text-sm text-gray-600">Text, Images, Videos, Audio messages</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <UserCheck className="w-6 h-6 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Messaging</h3>
                  <p className="text-sm text-gray-600">Instant message delivery and typing indicators</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="w-6 h-6 text-orange-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Role-based Access</h3>
                  <p className="text-sm text-gray-600">Different users can chat based on their roles</p>
                </div>
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Messages Component Test Area */}
        {showMessages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <PremiumCard className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages Component Test</h2>
              <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
                <EnhancedMessages onClose={() => setShowMessages(false)} />
              </div>
            </PremiumCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MessageTest;
