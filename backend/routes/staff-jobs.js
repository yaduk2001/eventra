const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole } = require('../middleware/auth');

// Post a staff job (for service providers)
router.post('/', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const providerId = req.user.uid;
    const { 
      jobName, 
      dateTime, 
      endDateTime,
      pay, 
      spotsNeeded 
    } = req.body;

    // Debug: Log received data
    console.log('Received staff job data:', {
      jobName,
      dateTime,
      endDateTime,
      pay,
      spotsNeeded,
      payType: typeof pay,
      spotsType: typeof spotsNeeded
    });

    // Validate required fields
    if (!jobName || !dateTime || !pay || !spotsNeeded) {
      console.log('Missing required fields validation failed');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobName, dateTime, pay, spotsNeeded'
      });
    }

    // Validate date format and future date
    const jobDate = new Date(dateTime);
    console.log('Date validation:', {
      originalDateTime: dateTime,
      parsedDate: jobDate,
      isValidDate: !isNaN(jobDate.getTime()),
      isFutureDate: jobDate > new Date(),
      currentDate: new Date()
    });
    
    if (isNaN(jobDate.getTime())) {
      console.log('Invalid date format detected');
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please provide a valid ISO date string.'
      });
    }

    if (jobDate <= new Date()) {
      console.log('Date is not in the future');
      return res.status(400).json({
        success: false,
        message: 'Job date must be in the future'
      });
    }

    // Validate pay is a positive number
    const payAmount = parseFloat(pay);
    console.log('Pay validation:', {
      originalPay: pay,
      parsedPay: payAmount,
      isValidNumber: !isNaN(payAmount),
      isPositive: payAmount > 0
    });
    
    if (isNaN(payAmount) || payAmount <= 0) {
      console.log('Invalid pay amount detected');
      return res.status(400).json({
        success: false,
        message: 'Pay must be a positive number'
      });
    }

    // Validate spots needed is a positive integer
    const spots = parseInt(spotsNeeded);
    console.log('Spots validation:', {
      originalSpots: spotsNeeded,
      parsedSpots: spots,
      isValidNumber: !isNaN(spots),
      isInRange: spots > 0 && spots <= 100
    });
    
    if (isNaN(spots) || spots <= 0 || spots > 100) {
      console.log('Invalid spots needed detected');
      return res.status(400).json({
        success: false,
        message: 'Spots needed must be a positive integer between 1 and 100'
      });
    }

    const jobData = {
      providerId,
      jobName: jobName.trim(),
      dateTime: jobDate.toISOString(),
      endDateTime: endDateTime || new Date(jobDate.getTime() + 4 * 60 * 60 * 1000).toISOString(), // Default 4 hours later
      pay: payAmount,
      spotsNeeded: spots,
      spotsApplied: 0,
      spotsApproved: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Final job data to be saved:', jobData);

    const result = await firebaseHelpers.createDocument('staff_jobs', jobData);
    console.log('Firebase save result:', result);

    res.json({
      success: true,
      message: 'Staff job posted successfully',
      data: { id: result.id, ...jobData }
    });
  } catch (error) {
    console.error('Post staff job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post staff job',
      error: error.message
    });
  }
});

// Get provider's posted staff jobs
router.get('/', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const providerId = req.user.uid;
    
    // Get all staff jobs
    const allJobs = await firebaseHelpers.getCollection('staff_jobs') || [];
    const providerJobs = allJobs.filter(job => job.providerId === providerId);

    // Sort by creation date (newest first)
    providerJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: providerJobs
    });
  } catch (error) {
    console.error('Get provider staff jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff jobs',
      error: error.message
    });
  }
});

// Get available staff jobs (for jobseekers)
router.get('/available', verifyToken, checkRole(['jobseeker']), async (req, res) => {
  try {
    const { location } = req.query;
    
    // Get all active staff jobs
    const allJobs = await firebaseHelpers.getCollection('staff_jobs') || [];
    let availableJobs = allJobs.filter(job => 
      job.status === 'active' && 
      job.spotsApproved < job.spotsNeeded
    );
    
    // Filter by location if provided
    if (location) {
      availableJobs = availableJobs.filter(job => 
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Get provider details for each job
    const jobsWithProviders = await Promise.all(
      availableJobs.map(async (job) => {
        const provider = await firebaseHelpers.getDocument('users', job.providerId);
        return {
          ...job,
          provider: provider ? {
            name: provider.name,
            businessName: provider.businessName,
            location: provider.location
          } : null
        };
      })
    );

    // Sort by creation date (newest first)
    jobsWithProviders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: jobsWithProviders
    });
  } catch (error) {
    console.error('Get available staff jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available staff jobs',
      error: error.message
    });
  }
});

// Apply to staff job (for jobseekers)
router.post('/:jobId/apply', verifyToken, checkRole(['jobseeker']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobseekerId = req.user.uid;

    // Check if job exists and is active
    const job = await firebaseHelpers.getDocument('staff_jobs', jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active'
      });
    }

    // Check if already applied
    const existingApplications = await firebaseHelpers.getCollection('staff_applications') || [];
    const alreadyApplied = existingApplications.find(app => 
      app.jobId === jobId && app.jobseekerId === jobseekerId
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Create application
    const applicationData = {
      jobId,
      jobseekerId,
      providerId: job.providerId,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('staff_applications', applicationData);

    // Update job's applied count
    await firebaseHelpers.updateDocument('staff_jobs', jobId, {
      spotsApplied: (job.spotsApplied || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply to staff job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply to staff job',
      error: error.message
    });
  }
});

// Get applications for a specific staff job
router.get('/:jobId/applications', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const providerId = req.user.uid;
    
    // Verify job belongs to provider
    const job = await firebaseHelpers.getDocument('staff_jobs', jobId);
    if (!job || job.providerId !== providerId) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get applications for this job
    const allApplications = await firebaseHelpers.getCollection('staff_applications') || [];
    const jobApplications = allApplications.filter(app => app.jobId === jobId);

    // Get jobseeker details for each application
    const applicationsWithJobseekers = await Promise.all(
      jobApplications.map(async (application) => {
        const jobseeker = await firebaseHelpers.getDocument('users', application.jobseekerId);
        return {
          ...application,
          jobseeker: jobseeker ? {
            name: jobseeker.name,
            phone: jobseeker.phone,
            email: jobseeker.email,
            location: jobseeker.location,
            skills: jobseeker.skills,
            experience: jobseeker.experience
          } : null
        };
      })
    );

    // Sort by application date (newest first)
    applicationsWithJobseekers.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({
      success: true,
      data: applicationsWithJobseekers
    });
  } catch (error) {
    console.error('Get staff job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  }
});

// Approve jobseeker application
router.patch('/applications/:applicationId/approve', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const providerId = req.user.uid;
    
    // Get application
    const application = await firebaseHelpers.getDocument('staff_applications', applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Verify job belongs to provider
    const job = await firebaseHelpers.getDocument('staff_jobs', application.jobId);
    if (!job || job.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if job still has available spots
    if (job.spotsApproved >= job.spotsNeeded) {
      return res.status(400).json({
        success: false,
        message: 'No more spots available for this job'
      });
    }
    
    // Update application status
    await firebaseHelpers.updateDocument('staff_applications', applicationId, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update job's approved count
    await firebaseHelpers.updateDocument('staff_jobs', application.jobId, {
      spotsApproved: (job.spotsApproved || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    // Send notification to jobseeker (simple message)
    const notificationData = {
      userId: application.jobseekerId,
      type: 'job_approved',
      title: 'Job Application Approved',
      message: "You're in.",
      read: false,
      createdAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('notifications', notificationData);

    res.json({
      success: true,
      message: 'Application approved successfully'
    });
  } catch (error) {
    console.error('Approve staff application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message
    });
  }
});

// Disapprove jobseeker application
router.patch('/applications/:applicationId/disapprove', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const providerId = req.user.uid;
    
    // Get application
    const application = await firebaseHelpers.getDocument('staff_applications', applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Verify job belongs to provider
    const job = await firebaseHelpers.getDocument('staff_jobs', application.jobId);
    if (!job || job.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Update application status
    await firebaseHelpers.updateDocument('staff_applications', applicationId, {
      status: 'disapproved',
      disapprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Application disapproved successfully'
    });
  } catch (error) {
    console.error('Disapprove staff application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disapprove application',
      error: error.message
    });
  }
});

// Get jobseeker's applications
router.get('/my-applications', verifyToken, checkRole(['jobseeker']), async (req, res) => {
  try {
    const jobseekerId = req.user.uid;
    
    // Get all applications for this jobseeker
    const allApplications = await firebaseHelpers.getCollection('staff_applications') || [];
    const jobseekerApplications = allApplications.filter(app => app.jobseekerId === jobseekerId);

    // Get job details for each application
    const applicationsWithJobs = await Promise.all(
      jobseekerApplications.map(async (application) => {
        const job = await firebaseHelpers.getDocument('staff_jobs', application.jobId);
        const provider = job ? await firebaseHelpers.getDocument('users', job.providerId) : null;
        return {
          ...application,
          job: job || null,
          provider: provider ? {
            name: provider.name,
            businessName: provider.businessName,
            location: provider.location
          } : null
        };
      })
    );

    // Sort by application date (newest first)
    applicationsWithJobs.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({
      success: true,
      data: applicationsWithJobs
    });
  } catch (error) {
    console.error('Get jobseeker applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  }
});

module.exports = router;