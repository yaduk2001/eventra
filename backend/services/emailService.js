const nodemailer = require('nodemailer');
const { firebaseHelpers } = require('../config/firebase');

// Email rate limits
const RATE_LIMITS = {
    customer: {
        maxEmailsPerBatch: 100,
        cooldownMinutes: 5
    },
    provider: {
        maxEmailsPerBatch: 500,
        cooldownMinutes: 5
    },
    event_company: {
        maxEmailsPerBatch: 500,
        cooldownMinutes: 5
    },
    caterer: {
        maxEmailsPerBatch: 500,
        cooldownMinutes: 5
    },
    photographer: {
        maxEmailsPerBatch: 500,
        cooldownMinutes: 5
    },
    transport: {
        maxEmailsPerBatch: 500,
        cooldownMinutes: 5
    }
};

class EmailService {
    constructor() {
        // Configure SMTP transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Verify SMTP connection
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP Server is ready to send emails');
        } catch (error) {
            console.error('❌ SMTP Server connection failed:', error.message);
            console.log('⚠️  Emails may not send without proper SMTP configuration');
        }
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Sanitize email content to prevent injection
    sanitizeContent(content) {
        if (typeof content !== 'string') return '';
        // Remove potential script tags and encode HTML entities
        return content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    // Send a single email
    async sendEmail(to, subject, body, userId = null) {
        try {
            // Validate email
            if (!this.validateEmail(to)) {
                throw new Error(`Invalid email address: ${to}`);
            }

            // Sanitize content
            const sanitizedSubject = this.sanitizeContent(subject);
            const sanitizedBody = this.sanitizeContent(body);

            const mailOptions = {
                from: `"${process.env.SMTP_FROM_NAME || 'Eventrra'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
                to: to,
                subject: sanitizedSubject,
                text: sanitizedBody,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${sanitizedBody.replace(/\n/g, '<br>')}
        </div>`
            };

            const result = await this.transporter.sendMail(mailOptions);

            // Log successful email
            if (userId) {
                await this.logEmail({
                    userId,
                    recipient: to,
                    subject: sanitizedSubject,
                    status: 'sent',
                    messageId: result.messageId,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: true,
                messageId: result.messageId,
                recipient: to
            };
        } catch (error) {
            console.error('Error sending email to', to, ':', error.message);

            // Log failed email
            if (userId) {
                await this.logEmail({
                    userId,
                    recipient: to,
                    subject: subject || '',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: false,
                recipient: to,
                error: error.message
            };
        }
    }

    // Send bulk emails with rate limiting
    async sendBulkEmails(recipients, subject, body, userId, userRole) {
        try {
            // Get rate limits for user role
            const rateLimit = RATE_LIMITS[userRole] || RATE_LIMITS.customer;

            // Check if batch size exceeds limit
            if (recipients.length > rateLimit.maxEmailsPerBatch) {
                throw new Error(`Maximum ${rateLimit.maxEmailsPerBatch} emails allowed per batch for ${userRole}`);
            }

            // Check cooldown period
            const lastEmailJob = await this.getLastEmailJob(userId);
            if (lastEmailJob) {
                const cooldownMs = rateLimit.cooldownMinutes * 60 * 1000;
                const timeSinceLastEmail = Date.now() - new Date(lastEmailJob.timestamp).getTime();

                if (timeSinceLastEmail < cooldownMs) {
                    const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastEmail) / 60000);
                    throw new Error(`Please wait ${remainingMinutes} more minute(s) before sending another batch`);
                }
            }

            // Validate and deduplicate emails
            const validEmails = [...new Set(recipients)]
                .filter(email => this.validateEmail(email));

            const invalidEmails = recipients.length - validEmails.length;

            if (validEmails.length === 0) {
                throw new Error('No valid email addresses found');
            }

            // Create email job record
            const jobId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const jobData = {
                jobId,
                userId,
                userRole,
                subject,
                totalRecipients: validEmails.length,
                invalidEmails,
                status: 'processing',
                createdAt: new Date().toISOString()
            };

            await firebaseHelpers.createDocument('emailJobs', jobData, jobId);

            // Send emails with delay to avoid overwhelming SMTP server
            const results = [];
            const BATCH_SIZE = 10; // Send 10 emails at a time
            const DELAY_MS = 2000; // 2 seconds delay between batches

            for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
                const batch = validEmails.slice(i, i + BATCH_SIZE);

                const batchResults = await Promise.all(
                    batch.map(email => this.sendEmail(email, subject, body, userId))
                );

                results.push(...batchResults);

                // Add delay between batches (except for last batch)
                if (i + BATCH_SIZE < validEmails.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            // Update job status
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            await firebaseHelpers.updateDocument('emailJobs', jobId, {
                status: 'completed',
                successful,
                failed,
                completedAt: new Date().toISOString()
            });

            return {
                success: true,
                jobId,
                totalSent: successful,
                failed: failed,
                invalidEmails,
                message: `Successfully sent ${successful} email(s). ${failed > 0 ? `${failed} failed.` : ''} ${invalidEmails > 0 ? `${invalidEmails} invalid email(s) skipped.` : ''}`
            };
        } catch (error) {
            console.error('Error in sendBulkEmails:', error);
            throw error;
        }
    }

    // Log email to Firestore
    async logEmail(emailData) {
        try {
            await firebaseHelpers.createDocument('emailLogs', emailData);
        } catch (error) {
            console.error('Error logging email:', error);
        }
    }

    // Get last email job for a user
    async getLastEmailJob(userId) {
        try {
            const jobs = await firebaseHelpers.getCollection('emailJobs');
            const userJobs = jobs
                .filter(job => job.userId === userId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return userJobs.length > 0 ? userJobs[0] : null;
        } catch (error) {
            console.error('Error getting last email job:', error);
            return null;
        }
    }

    // Get email history for a user
    async getEmailHistory(userId, limit = 50) {
        try {
            const jobs = await firebaseHelpers.getCollection('emailJobs');
            const userJobs = jobs
                .filter(job => job.userId === userId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, limit);

            return userJobs;
        } catch (error) {
            console.error('Error getting email history:', error);
            return [];
        }
    }

    // Get email job status
    async getEmailJobStatus(jobId) {
        try {
            const job = await firebaseHelpers.getDocument('emailJobs', jobId);
            return job;
        } catch (error) {
            console.error('Error getting email job status:', error);
            return null;
        }
    }
}

module.exports = new EmailService();

