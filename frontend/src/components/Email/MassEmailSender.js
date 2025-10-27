'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Upload,
    FileText,
    Mail,
    Send,
    CheckCircle,
    AlertCircle,
    X,
    Download,
    Info
} from 'lucide-react';
import PremiumCard from '../ui/PremiumCard';
import PremiumButton from '../ui/PremiumButton';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const MassEmailSender = () => {
    const [csvFile, setCsvFile] = useState(null);
    const [previewEmails, setPreviewEmails] = useState([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [emailHistory, setEmailHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const fileInputRef = useRef(null);
    const maxBodyLength = 2000;

    // Handle CSV file upload
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        setCsvFile(file);

        // Parse CSV file to preview emails
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            const emails = [];

            lines.forEach((line, index) => {
                if (index === 0 && line.toLowerCase().includes('email')) {
                    // Skip header row
                    return;
                }
                // Extract email from line (first column or comma-separated)
                const email = line.split(',')[0].trim();
                if (email && email.includes('@')) {
                    emails.push(email);
                }
            });

            setPreviewEmails(emails);
            toast.success(`Found ${emails.length} email addresses in CSV`);
        };

        reader.readAsText(file);
    };

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            const event = {
                target: { files: [file] }
            };
            handleFileChange(event);
        } else {
            toast.error('Please drop a CSV file');
        }
    };

    // Download CSV template
    const downloadTemplate = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email/template`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'email_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Template downloaded');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Failed to download template');
        }
    };

    // Load email history
    const loadEmailHistory = async () => {
        try {
            const history = await api.email.getEmailHistory();
            setEmailHistory(history);
            setShowHistory(true);
        } catch (error) {
            console.error('Error loading email history:', error);
            toast.error('Failed to load email history');
        }
    };

    // Send bulk emails
    const handleSendEmails = async () => {
        if (!csvFile) {
            toast.error('Please upload a CSV file');
            return;
        }

        if (!subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }

        if (!body.trim()) {
            toast.error('Please enter email body');
            return;
        }

        if (body.length > maxBodyLength) {
            toast.error(`Email body must be less than ${maxBodyLength} characters`);
            return;
        }

        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append('csv', csvFile);
            formData.append('subject', subject);
            formData.append('body', body);

            const result = await api.email.sendBulkEmail(formData);

            if (result.success) {
                toast.success(result.data.message);

                // Reset form
                setCsvFile(null);
                setPreviewEmails([]);
                setSubject('');
                setBody('');
                fileInputRef.current.value = '';

                // Refresh history
                await loadEmailHistory();
            } else {
                toast.error(result.message || 'Failed to send emails');
            }
        } catch (error) {
            console.error('Error sending emails:', error);
            toast.error(error.message || 'Failed to send emails');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Main Form */}
            <PremiumCard className="p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Mass Emails</h2>
                    <p className="text-gray-600">
                        Upload a CSV file with email addresses and send personalized emails to all recipients.
                    </p>
                </div>

                {/* CSV Upload Section */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload CSV File
                    </label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                    />

                    <motion.div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {csvFile ? (
                            <div className="flex items-center justify-center space-x-3">
                                <FileText className="w-8 h-8 text-indigo-600" />
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">{csvFile.name}</p>
                                    <p className="text-xs text-gray-500">{previewEmails.length} email addresses found</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCsvFile(null);
                                        setPreviewEmails([]);
                                        fileInputRef.current.value = '';
                                    }}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-600 font-medium">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    CSV file with email addresses
                                </p>
                            </div>
                        )}
                    </motion.div>

                    <div className="flex items-center space-x-2 mt-2">
                        <Info className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500">
                            Need a template?{' '}
                            <button
                                onClick={downloadTemplate}
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Download CSV template
                            </button>
                        </p>
                    </div>
                </div>

                {/* Email Preview */}
                {previewEmails.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6"
                    >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Recipients ({previewEmails.length})
                        </label>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                                {previewEmails.slice(0, 10).map((email, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium"
                                    >
                                        <Mail className="w-3 h-3 mr-1" />
                                        {email}
                                    </span>
                                ))}
                                {previewEmails.length > 10 && (
                                    <span className="text-xs text-gray-500">+{previewEmails.length - 10} more</span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Subject Field */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        maxLength={100}
                    />
                </div>

                {/* Body Field */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Body
                        <span className="text-gray-400 font-normal ml-2">
                            ({body.length}/{maxBodyLength} characters)
                        </span>
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Enter your email message here..."
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        maxLength={maxBodyLength}
                    />
                </div>

                {/* Send Button */}
                <div className="flex items-center space-x-3">
                    <PremiumButton
                        onClick={handleSendEmails}
                        disabled={isSending || !csvFile || !subject || !body}
                        loading={isSending}
                        className="flex items-center space-x-2"
                    >
                        <Send className="w-5 h-5" />
                        <span>{isSending ? 'Sending...' : 'Send Emails'}</span>
                    </PremiumButton>

                    <PremiumButton
                        variant="ghost"
                        onClick={loadEmailHistory}
                        className="flex items-center space-x-2"
                    >
                        <FileText className="w-5 h-5" />
                        <span>View History</span>
                    </PremiumButton>
                </div>
            </PremiumCard>

            {/* Email History Modal */}
            {showHistory && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowHistory(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">Email History</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {emailHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500">No email history found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {emailHistory.map((job) => (
                                    <PremiumCard key={job.jobId} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">{job.subject}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Sent to {job.totalRecipients} recipients
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(job.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    job.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {job.status}
                                                </div>
                                                {job.successful !== undefined && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {job.successful} successful, {job.failed || 0} failed
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </PremiumCard>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default MassEmailSender;

