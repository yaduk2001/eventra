'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, Users, DollarSign, CheckCircle, Loader2, Edit2, Trash2 } from 'lucide-react';
import PremiumCard from './PremiumCard';
import PremiumButton from './PremiumButton';

const AIStaffRecommendationModal = ({
    isOpen,
    onClose,
    recommendations = [],
    booking = {},
    onApprove,
    isLoading = false
}) => {
    const [isApproving, setIsApproving] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [localRecommendations, setLocalRecommendations] = useState(recommendations);

    // Sync local recommendations with prop changes
    useEffect(() => {
        console.log('Modal received recommendations:', recommendations);
        setLocalRecommendations(recommendations);
    }, [recommendations]);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            console.log('Approving recommendations:', JSON.stringify(localRecommendations, null, 2));
            console.log('Job types in recommendations:', localRecommendations.map(rec => ({ jobName: rec.jobName, jobType: rec.jobType })));
            await onApprove(localRecommendations);
        } catch (error) {
            console.error('Error approving recommendations:', error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleEdit = (index) => {
        setEditingIndex(index);
        const recommendation = localRecommendations[index];

        // Determine job type - check for freelancer indicators
        let jobType = recommendation.jobType || 'staff';
        if (recommendation.hourlyRate || recommendation.category || recommendation.duration) {
            jobType = 'freelancer';
        }

        console.log('Editing recommendation:', recommendation);
        console.log('Determined job type:', jobType);

        // Initialize edit form with proper date/time handling and job type
        setEditForm({
            ...recommendation,
            eventDate: recommendation.eventDate || booking.eventDate,
            startTime: recommendation.startTime || '09:00',
            jobType: jobType
        });
    };

    const handleSaveEdit = () => {
        const updatedRecommendations = [...localRecommendations];

        // Combine date and time into a proper datetime
        let combinedDateTime = editForm.eventDate;

        if (editForm.startTime) {
            const [hours, minutes] = editForm.startTime.split(':');
            const date = new Date(editForm.eventDate);
            date.setHours(parseInt(hours), parseInt(minutes));
            combinedDateTime = date.toISOString();
        }

        const updatedJob = {
            ...editForm,
            eventDate: combinedDateTime,
            dateTime: combinedDateTime, // Also set dateTime for compatibility
            jobType: editForm.jobType || 'staff' // Ensure jobType is always set
        };

        console.log('Saving job with data:', JSON.stringify(updatedJob, null, 2));
        console.log('Job type being saved:', updatedJob.jobType);
        console.log('Is freelancer?', updatedJob.jobType === 'freelancer');

        updatedRecommendations[editingIndex] = updatedJob;

        setLocalRecommendations(updatedRecommendations);
        setEditingIndex(null);
        setEditForm({});
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditForm({});
    };

    const handleDelete = (index) => {
        const updatedRecommendations = localRecommendations.filter((_, i) => i !== index);
        setLocalRecommendations(updatedRecommendations);
    };

    const handleInputChange = (field, value) => {
        console.log('Input change:', field, '=', value);
        setEditForm(prev => {
            const updated = {
                ...prev,
                [field]: value
            };

            // Handle job type changes
            if (field === 'jobType') {
                console.log('Job type changing from', prev.jobType, 'to', value);
                if (value === 'staff') {
                    // Convert from freelancer to staff
                    updated.pay = updated.hourlyRate || 800;
                    delete updated.hourlyRate;
                    delete updated.category;
                    delete updated.duration;
                } else if (value === 'freelancer') {
                    // Convert from staff to freelancer
                    updated.hourlyRate = updated.pay || 1000;
                    updated.category = updated.category || 'General';
                    updated.duration = updated.duration || '4 hours';
                    delete updated.pay;
                }
            }

            console.log('Updated form:', updated);
            return updated;
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">AI Staff Recommendations</h2>
                                    <p className="text-purple-100">
                                        {booking.eventType} • {new Date(booking.eventDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">AI is analyzing your event details...</p>
                                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">Event Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-gray-600 text-xs uppercase tracking-wide">Event Type</span>
                                            <span className="font-medium text-gray-900 mt-1">{booking.eventType}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600 text-xs uppercase tracking-wide">Date</span>
                                            <span className="font-medium text-gray-900 mt-1">{new Date(booking.eventDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600 text-xs uppercase tracking-wide">Location</span>
                                            <span className="font-medium text-gray-900 mt-1">{booking.location}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600 text-xs uppercase tracking-wide">Guests</span>
                                            <span className="font-medium text-gray-900 mt-1">{booking.guestCount || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        AI Recommended Positions ({localRecommendations.length})
                                    </h3>
                                    <div className="grid gap-4">
                                        {localRecommendations.map((rec, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <PremiumCard className="p-4" hoverEffect="lift">
                                                    {editingIndex === index ? (
                                                        // Edit Mode
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Job Name
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={editForm.jobName || ''}
                                                                    onChange={(e) => handleInputChange('jobName', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Job Type
                                                                </label>
                                                                <select
                                                                    value={editForm.jobType || 'staff'}
                                                                    onChange={(e) => handleInputChange('jobType', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                >
                                                                    <option value="staff">Staff</option>
                                                                    <option value="freelancer">Freelancer</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Description
                                                                </label>
                                                                <textarea
                                                                    value={editForm.description || ''}
                                                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        Event Date
                                                                    </label>
                                                                    <input
                                                                        type="date"
                                                                        value={editForm.eventDate ? new Date(editForm.eventDate).toISOString().split('T')[0] : ''}
                                                                        onChange={(e) => handleInputChange('eventDate', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        Start Time
                                                                    </label>
                                                                    <input
                                                                        type="time"
                                                                        value={editForm.startTime || '09:00'}
                                                                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        Spots Needed
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={editForm.spotsNeeded || ''}
                                                                        onChange={(e) => handleInputChange('spotsNeeded', parseInt(e.target.value) || 1)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        {editForm.jobType === 'freelancer' ? 'Hourly Rate (₹)' : 'Pay (₹)'}
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={editForm.jobType === 'freelancer' ? (editForm.hourlyRate || '') : (editForm.pay || '')}
                                                                        onChange={(e) => handleInputChange(editForm.jobType === 'freelancer' ? 'hourlyRate' : 'pay', parseInt(e.target.value) || 0)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {editForm.jobType === 'freelancer' && (
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Category
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.category || ''}
                                                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                            Duration
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.duration || ''}
                                                                            onChange={(e) => handleInputChange('duration', e.target.value)}
                                                                            placeholder="e.g., 4 hours, 1 day"
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex gap-2 pt-2">
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // View Mode
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                                                    {rec.jobName}
                                                                </h4>
                                                                {rec.description && (
                                                                    <p className="text-gray-600 text-sm mb-3">
                                                                        {rec.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="w-4 h-4" />
                                                                        <span>{rec.spotsNeeded} {rec.spotsNeeded === 1 ? 'spot' : 'spots'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <DollarSign className="w-4 h-4" />
                                                                        <span>
                                                                            {rec.jobType === 'freelancer'
                                                                                ? `₹${rec.hourlyRate}/hour`
                                                                                : `₹${rec.pay} per person`
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4" />
                                                                        <span>
                                                                            {rec.eventDate ? new Date(rec.eventDate).toLocaleDateString() : 'Date not set'}
                                                                            {rec.startTime && ` at ${rec.startTime}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${(rec.jobType === 'staff' || !rec.jobType)
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-green-100 text-green-700'
                                                                            }`}>
                                                                            {rec.jobType === 'freelancer' ? 'Freelancer' : 'Staff'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4 flex flex-col gap-2">
                                                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                                                    AI Recommended
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleEdit(index)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(index)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </PremiumCard>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!isLoading && (
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <p>Total positions: <span className="font-semibold">{localRecommendations.length}</span></p>
                                <p>Total spots: <span className="font-semibold">
                                    {localRecommendations.reduce((sum, rec) => sum + rec.spotsNeeded, 0)}
                                </span></p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <PremiumButton
                                    onClick={handleApprove}
                                    disabled={isApproving || localRecommendations.length === 0}
                                    className="px-6 py-2"
                                >
                                    {isApproving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Creating Jobs...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve & Create Jobs
                                        </>
                                    )}
                                </PremiumButton>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIStaffRecommendationModal;
