'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Award, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CertificateTemplate from '../../components/CertificateTemplate';
import PremiumCard from '../../components/ui/PremiumCard';
import PremiumButton from '../../components/ui/PremiumButton';
import { useAuth } from '../../contexts/AuthContext';

export default function CertificatePage() {
    const [certificateName, setCertificateName] = useState('');
    const [eventName, setEventName] = useState('');
    const [certificateDate, setCertificateDate] = useState(new Date().toISOString().split('T')[0]);
    const { user, userProfile } = useAuth();

    // Set default name from user profile
    const defaultName = userProfile?.displayName || userProfile?.businessName || userProfile?.companyName || user?.displayName || 'John Doe';

    // Determine the correct dashboard URL based on user role
    const getDashboardUrl = () => {
        const userRole = user?.role || userProfile?.role;
        if (userRole === 'customer') {
            return '/customer/dashboard';
        } else if (['event_company', 'caterer', 'transport', 'photographer'].includes(userRole)) {
            return '/provider/dashboard';
        } else if (['jobseeker', 'freelancer'].includes(userRole)) {
            return '/freelancer/dashboard';
        } else if (userRole === 'admin') {
            return '/admin';
        }
        return '/dashboard'; // fallback
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href={getDashboardUrl()}>
                                <motion.button
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                                    whileHover={{ x: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>Back to Dashboard</span>
                                </motion.button>
                            </Link>
                            <div className="h-6 w-px bg-gray-300" />
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Certificate Generator</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Certificate Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <PremiumCard className="p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Create Certificate</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Recipient Name
                                    </label>
                                    <input
                                        type="text"
                                        value={certificateName}
                                        onChange={(e) => setCertificateName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Event/Service Name
                                    </label>
                                    <input
                                        type="text"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                        placeholder="Sample Event"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Certificate Date
                                    </label>
                                    <input
                                        type="date"
                                        value={certificateDate}
                                        onChange={(e) => setCertificateDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-start space-x-3">
                                        <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-1">Pro Tips</h4>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                <li>• Use full names for professional certificates</li>
                                                <li>• Include specific event or service details</li>
                                                <li>• Download as PDF for printing or PNG for digital use</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </motion.div>

                    {/* Certificate Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <PremiumCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Preview</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <Download className="w-4 h-4" />
                                    <span>Click to download</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 overflow-auto max-h-[600px]">
                                <CertificateTemplate
                                    name={certificateName || 'John Doe'}
                                    eventName={eventName || 'Sample Event'}
                                    date={certificateDate}
                                />
                            </div>

                            {!certificateName && !eventName && (
                                <div className="mt-4 text-center text-gray-500 text-sm">
                                    Fill in the form to see your certificate preview
                                </div>
                            )}
                        </PremiumCard>
                    </motion.div>
                </div>

                {/* Features Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-12"
                >
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Certificate Features</h3>
                        <p className="text-gray-600">Professional certificates with premium quality</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PremiumCard className="p-6 text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Multiple Formats</h4>
                            <p className="text-gray-600">Download as PDF for printing or PNG for digital use</p>
                        </PremiumCard>

                        <PremiumCard className="p-6 text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Professional Design</h4>
                            <p className="text-gray-600">Beautiful, professional certificate templates</p>
                        </PremiumCard>

                        <PremiumCard className="p-6 text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Custom Branding</h4>
                            <p className="text-gray-600">Personalize with names and event details</p>
                        </PremiumCard>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
