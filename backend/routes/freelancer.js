const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole } = require('../middleware/auth');

// Get freelancer profile
router.get('/profile', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await firebaseHelpers.getDocument('users', userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get freelancer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get freelancer profile',
      error: error.message
    });
  }
});

// Update freelancer profile
router.put('/profile', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const userId = req.user.uid;
    const profileData = req.body;

    // Update user profile
    await firebaseHelpers.updateDocument('users', userId, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update freelancer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Get available jobs
router.get('/jobs', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const { category, location, rate_min, rate_max } = req.query;
    
    // Get all job postings
    let allJobs = await firebaseHelpers.getCollection('job_postings') || [];

    // Also consider open customer bid requests targeted to freelancers and backfill missing job_postings
    try {
      const bidRequests = await firebaseHelpers.getCollection('bidRequests');
      const freelancerRequests = (bidRequests || []).filter(br => br.status === 'open' && br.needWholeTeam === false);

      // Build a map of existing job postings keyed by bidRequestId for quick lookup
      const existingByBidRequestId = new Map();
      for (const job of allJobs) {
        if (job.bidRequestId) existingByBidRequestId.set(job.bidRequestId, job);
      }

      for (const br of freelancerRequests) {
        if (!existingByBidRequestId.has(br.id)) {
          const jobData = {
            providerId: br.customerId,
            title: br.eventName || `${br.eventType} Event`,
            description: br.requirements || `${br.eventType} event on ${br.eventDate}`,
            category: br.eventType || 'other',
            location: br.location,
            hourlyRate: null,
            duration: 'Per event',
            requirements: [],
            startDate: br.eventDate,
            endDate: null,
            status: 'active',
            bidRequestId: br.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const created = await firebaseHelpers.createDocument('job_postings', jobData);
          allJobs.push({ id: created.id, ...jobData });
          existingByBidRequestId.set(br.id, { id: created.id, ...jobData });
        }
      }
    } catch (backfillErr) {
      console.error('Backfill freelancer jobs from bidRequests failed:', backfillErr);
      // Non-fatal; continue with whatever jobs exist
    }
    
    // Filter jobs
    let filteredJobs = allJobs.filter(job => job.status === 'active');
    
    if (category) {
      filteredJobs = filteredJobs.filter(job => 
        job.category?.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (rate_min) {
      filteredJobs = filteredJobs.filter(job => 
        parseFloat(job.hourlyRate || 0) >= parseFloat(rate_min)
      );
    }
    
    if (rate_max) {
      filteredJobs = filteredJobs.filter(job => 
        parseFloat(job.hourlyRate || 0) <= parseFloat(rate_max)
      );
    }

    res.json({
      success: true,
      data: filteredJobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: error.message
    });
  }
});

// Apply to job
router.post('/jobs/:jobId/apply', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, proposedRate, availability } = req.body;
    const freelancerId = req.user.uid;

    // Check if already applied
    const existingApplications = await firebaseHelpers.getCollection('job_applications') || [];
    const alreadyApplied = existingApplications.find(app => 
      app.jobId === jobId && app.freelancerId === freelancerId
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
      freelancerId,
      coverLetter,
      proposedRate,
      availability,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('job_applications', applicationData);

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply to job',
      error: error.message
    });
  }
});

// Get freelancer applications
router.get('/applications', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const freelancerId = req.user.uid;
    
    // Get all applications for this freelancer
    const allApplications = await firebaseHelpers.getCollection('job_applications') || [];
    const freelancerApplications = allApplications.filter(app => app.freelancerId === freelancerId);

    // Get job details for each application
    const applicationsWithJobs = await Promise.all(
      freelancerApplications.map(async (application) => {
        const job = await firebaseHelpers.getDocument('job_postings', application.jobId);
        return {
          ...application,
          job: job || null
        };
      })
    );

    res.json({
      success: true,
      data: applicationsWithJobs
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  }
});

// Get freelancer portfolio
router.get('/portfolio', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const freelancerId = req.user.uid;
    
    // Get portfolio items
    const allPortfolio = await firebaseHelpers.getCollection('portfolio') || [];
    const freelancerPortfolio = allPortfolio.filter(item => item.freelancerId === freelancerId);

    res.json({
      success: true,
      data: freelancerPortfolio
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio',
      error: error.message
    });
  }
});

// Add portfolio item
router.post('/portfolio', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const freelancerId = req.user.uid;
    const { title, description, imageUrl, category, tags } = req.body;

    const portfolioItem = {
      freelancerId,
      title,
      description,
      imageUrl,
      category,
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('portfolio', portfolioItem);

    res.json({
      success: true,
      message: 'Portfolio item added successfully'
    });
  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add portfolio item',
      error: error.message
    });
  }
});

// Search freelancers (for service providers)
router.get('/search', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { skills, location, rate_min, rate_max, availability } = req.query;
    
    // Get all freelancers
    const allUsers = await firebaseHelpers.getCollection('users') || [];
    const freelancers = allUsers.filter(user => 
      user.role === 'freelancer' && user.approved
    );
    
    // Filter freelancers
    let filteredFreelancers = freelancers;
    
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim().toLowerCase());
      filteredFreelancers = filteredFreelancers.filter(freelancer =>
        freelancer.skills?.some(skill => 
          skillArray.some(searchSkill => 
            skill.toLowerCase().includes(searchSkill)
          )
        )
      );
    }
    
    if (location) {
      filteredFreelancers = filteredFreelancers.filter(freelancer =>
        freelancer.location?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (rate_min) {
      filteredFreelancers = filteredFreelancers.filter(freelancer =>
        parseFloat(freelancer.hourlyRate || 0) >= parseFloat(rate_min)
      );
    }
    
    if (rate_max) {
      filteredFreelancers = filteredFreelancers.filter(freelancer =>
        parseFloat(freelancer.hourlyRate || 0) <= parseFloat(rate_max)
      );
    }
    
    if (availability) {
      filteredFreelancers = filteredFreelancers.filter(freelancer =>
        freelancer.availability === availability
      );
    }

    res.json({
      success: true,
      data: filteredFreelancers
    });
  } catch (error) {
    console.error('Search freelancers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search freelancers',
      error: error.message
    });
  }
});

// Start collaboration (onboarding) for accepted applications
router.post('/collaborations', verifyToken, checkRole(['freelancer']), async (req, res) => {
  try {
    const freelancerId = req.user.uid;
    const { applicationId } = req.body;
    
    // Get the application to verify it's accepted
    const allApplications = await firebaseHelpers.getCollection('job_applications') || [];
    const application = allApplications.find(app => app.id === applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    if (application.freelancerId !== freelancerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only start collaboration for your own applications'
      });
    }
    
    if (application.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Can only start collaboration for accepted applications'
      });
    }
    
    // Get job details
    const job = await firebaseHelpers.getDocument('job_postings', application.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Create collaboration record
    const collaborationData = {
      freelancerId,
      providerId: job.providerId,
      jobId: application.jobId,
      applicationId,
      status: 'active',
      startDate: new Date().toISOString(),
      hourlyRate: job.hourlyRate,
      monthlyPay: job.monthlyPay,
      duration: job.duration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const collaboration = await firebaseHelpers.createDocument('collaborations', collaborationData);
    
    // Update application status to 'onboarded'
    await firebaseHelpers.updateDocument('job_applications', applicationId, {
      status: 'onboarded',
      collaborationId: collaboration.id,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Collaboration started successfully',
      data: collaboration
    });
  } catch (error) {
    console.error('Start collaboration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start collaboration',
      error: error.message
    });
  }
});

module.exports = router;
