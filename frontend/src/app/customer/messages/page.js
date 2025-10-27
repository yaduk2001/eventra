'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Sparkles,
  Settings,
  LogOut,
  MessageCircle
} from 'lucide-react';
import PremiumButton from '../../../components/ui/PremiumButton';
import EnhancedMessages from '../../../components/Messages/EnhancedMessages';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export const dynamic = 'force-dynamic';

const CustomerMessages = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  // Get URL parameters for initial room and partner
  const initialRoomId = searchParams.get('room');
  const initialPartnerId = searchParams.get('partner');

  useEffect(() => {
    // Check authentication
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setLoading(false);
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-600">Loading messages...</p>
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
                <MessageCircle className="w-5 h-5 text-slate-600" />
                <span className="text-slate-600">Messages</span>
              </div>
              <Link href="/customer/dashboard">
                <PremiumButton variant="ghost" size="sm">
                  Dashboard
                </PremiumButton>
              </Link>
              <PremiumButton variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </PremiumButton>
              <PremiumButton variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </PremiumButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages Component */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="h-[calc(100vh-200px)]"
        >
          <EnhancedMessages 
            initialRoomId={initialRoomId}
            initialPartnerId={initialPartnerId}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerMessages;