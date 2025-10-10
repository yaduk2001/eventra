'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Calendar, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
  Heart,
  MessageCircle
} from 'lucide-react';
import PremiumButton from './ui/PremiumButton';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/services', label: 'Services', icon: Search },
    { href: '/booking', label: 'Book', icon: Calendar },
    { href: '/dashboard', label: 'Dashboard', icon: User },
    { href: '/admin', label: 'Admin', icon: Settings }
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav 
        className="hidden lg:flex fixed top-0 left-0 w-64 h-full bg-white/90 backdrop-blur-md border-r border-slate-200/20 z-50"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col w-full p-6">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3 mb-12"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">
              Eventrra
            </span>
          </motion.div>

          {/* Navigation Items */}
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={item.href}>
                  <motion.div
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      isActive(item.href)
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* User Actions */}
          <div className="mt-auto space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
              <div>
                <p className="font-semibold text-slate-900">John Doe</p>
                <p className="text-sm text-slate-600">Customer</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <PremiumButton variant="ghost" size="sm" className="flex-1">
                <Bell className="w-4 h-4" />
              </PremiumButton>
              <PremiumButton variant="ghost" size="sm" className="flex-1">
                <Heart className="w-4 h-4" />
              </PremiumButton>
              <PremiumButton variant="ghost" size="sm" className="flex-1">
                <MessageCircle className="w-4 h-4" />
              </PremiumButton>
            </div>

            <PremiumButton variant="ghost" size="lg" className="w-full">
              <LogOut className="w-5 h-5" />
              Sign Out
            </PremiumButton>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.nav 
        className="lg:hidden fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/20 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">
              Eventrra
            </span>
          </motion.div>

          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="px-4 pb-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <motion.div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isActive(item.href)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.nav>

      {/* Content Spacer for Desktop */}
      <div className="hidden lg:block w-64" />
    </>
  );
};

export default Navigation;
