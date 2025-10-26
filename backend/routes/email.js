const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { firebaseHelpers } = require('../config/firebase');
const emailService = require('../services/emailService');

// Configure multer for CSV file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Parse CSV file and extract email addresses
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const emails = [];
        const errors = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Handle various CSV column names for email
                let email = row.email || row.Email || row.EMAIL || row.to || row.To || row.TO;

                if (email && typeof email === 'string') {
                    email = email.trim();
                    if (email) {
                        emails.push(email);
                    }
                } else if (Object.values(row).length > 0) {
                    // If no email column found, assume first column is email
                    const firstValue = Object.values(row)[0];
                    if (firstValue && typeof firstValue === 'string') {
                        const trimmed = firstValue.trim();
                        if (trimmed.includes('@')) {
                            emails.push(trimmed);
                        }
                    }
                }
            })
            .on('end', () => {
                // Clean up file
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });

                if (emails.length === 0) {
                    reject(new Error('No email addresses found in CSV file'));
                } else {
                    resolve(emails);
                }
            })
            .on('error', (error) => {
                fs.unlink(filePath, () => { }); // Try to clean up
                reject(error);
            });
    });
}

// Send bulk emails from CSV upload
router.post('/send-bulk', verifyToken, upload.single('csv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Missing file',
                message: 'Please upload a CSV file'
            });
        }

        const { subject, body } = req.body;

        if (!subject || !body) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Subject and body are required'
            });
        }

        // Parse CSV to extract email addresses
        const emails = await parseCSV(req.file.path);

        // Get user role from database
        const user = await firebaseHelpers.getDocument('users', req.user.uid);
        const userRole = user ? user.role : 'customer';

        // Send bulk emails
        const result = await emailService.sendBulkEmails(
            emails,
            subject,
            body,
            req.user.uid,
            userRole
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in send-bulk:', error);

        // Clean up file if it exists
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }

        res.status(500).json({
            error: 'Failed to send bulk emails',
            message: error.message
        });
    }
});

// Get email history for authenticated user
router.get('/history', verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await emailService.getEmailHistory(req.user.uid, limit);

        res.status(200).json({
            success: true,
            data: history,
            count: history.length
        });
    } catch (error) {
        console.error('Error getting email history:', error);
        res.status(500).json({
            error: 'Failed to get email history',
            message: error.message
        });
    }
});

// Get email job status
router.get('/status/:jobId', verifyToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await emailService.getEmailJobStatus(jobId);

        if (!job) {
            return res.status(404).json({
                error: 'Job not found',
                message: 'Email job not found'
            });
        }

        // Check if job belongs to user
        if (job.userId !== req.user.uid) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have access to this job'
            });
        }

        res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        console.error('Error getting email job status:', error);
        res.status(500).json({
            error: 'Failed to get email job status',
            message: error.message
        });
    }
});

// Get CSV template
router.get('/template', (req, res) => {
    try {
        const csvContent = 'email\njohn@example.com\njane@example.com';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="email_template.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error('Error generating CSV template:', error);
        res.status(500).json({
            error: 'Failed to generate CSV template',
            message: error.message
        });
    }
});

module.exports = router;

