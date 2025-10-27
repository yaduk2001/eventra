const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole } = require('../middleware/auth');

// Post a job (for service providers)
router.post('/jobs', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const providerId = req.user.uid;
    const { 
      title, 
      description, 
      category, 
      location, 
      hourlyRate, 
      monthlyPay,
      duration, 
      requirements, 
      startDate, 
      endDate,
      startHour,
      endHour
    } = req.body;

    const jobData = {
      providerId,
      title,
      description,
      category,
      location,
      hourlyRate,
      monthlyPay,
      duration,
      requirements: requirements || [],
      startDate,
      endDate,
      startHour,
      endHour,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('job_postings', jobData);

    res.json({
      success: true,
      message: 'Job posted successfully'
    });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post job',
      error: error.message
    });
  }
});

// Get provider's posted jobs
router.get('/jobs', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const providerId = req.user.uid;
    
    // Get all job postings
    const allJobs = await firebaseHelpers.getCollection('job_postings') || [];
    const providerJobs = allJobs.filter(job => job.providerId === providerId);

    res.json({
      success: true,
      data: providerJobs
    });
  } catch (error) {
    console.error('Get provider jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: error.message
    });
  }
});

// Delete a job (for service providers)
router.delete('/jobs/:jobId', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const providerId = req.user.uid;
    
    // Verify job exists and belongs to provider
    const job = await firebaseHelpers.getDocument('job_postings', jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own jobs'
      });
    }
    
    // Delete the job
    await firebaseHelpers.deleteDocument('job_postings', jobId);
    
    // Also delete all applications for this job
    const allApplications = await firebaseHelpers.getCollection('job_applications') || [];
    const jobApplications = allApplications.filter(app => app.jobId === jobId);
    
    // Delete each application
    for (const application of jobApplications) {
      await firebaseHelpers.deleteDocument('job_applications', application.id);
    }
    
    res.json({
      success: true,
      message: 'Job and associated applications deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

// Get applications for a specific job
router.get('/jobs/:jobId/applications', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const providerId = req.user.uid;
    
    // Verify job belongs to provider
    const job = await firebaseHelpers.getDocument('job_postings', jobId);
    if (!job || job.providerId !== providerId) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get applications for this job
    const allApplications = await firebaseHelpers.getCollection('job_applications') || [];
    const jobApplications = allApplications.filter(app => app.jobId === jobId);

    // Get freelancer details for each application
    const applicationsWithFreelancers = await Promise.all(
      jobApplications.map(async (application) => {
        const freelancer = await firebaseHelpers.getDocument('users', application.freelancerId);
        return {
          ...application,
          freelancer: freelancer || null
        };
      })
    );

    res.json({
      success: true,
      data: applicationsWithFreelancers
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  }
});

// Accept freelancer application
router.patch('/applications/:applicationId/accept', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const providerId = req.user.uid;
    
    // Get application
    const application = await firebaseHelpers.getDocument('job_applications', applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Verify job belongs to provider
    const job = await firebaseHelpers.getDocument('job_postings', application.jobId);
    if (!job || job.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Update application status
    await firebaseHelpers.updateDocument('job_applications', applicationId, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create collaboration record
    const collaborationData = {
      providerId,
      freelancerId: application.freelancerId,
      jobId: application.jobId,
      status: 'active',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await firebaseHelpers.createDocument('collaborations', collaborationData);

    res.json({
      success: true,
      message: 'Application accepted successfully'
    });
  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept application',
      error: error.message
    });
  }
});

// Reject freelancer application
router.patch('/applications/:applicationId/reject', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;
    const providerId = req.user.uid;
    
    // Get application
    const application = await firebaseHelpers.getDocument('job_applications', applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Verify job belongs to provider
    const job = await firebaseHelpers.getDocument('job_postings', application.jobId);
    if (!job || job.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Update application status
    await firebaseHelpers.updateDocument('job_applications', applicationId, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || 'Application rejected',
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Application rejected successfully'
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message
    });
  }
});

// Get provider's collaborations
router.get('/collaborations', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const providerId = req.user.uid;
    
    // Get all collaborations
    const allCollaborations = await firebaseHelpers.getCollection('collaborations') || [];
    const providerCollaborations = allCollaborations.filter(collab => collab.providerId === providerId);

    // Get freelancer details for each collaboration
    const collaborationsWithFreelancers = await Promise.all(
      providerCollaborations.map(async (collaboration) => {
        const freelancer = await firebaseHelpers.getDocument('users', collaboration.freelancerId);
        const job = await firebaseHelpers.getDocument('job_postings', collaboration.jobId);
        return {
          ...collaboration,
          freelancer: freelancer || null,
          job: job || null
        };
      })
    );

    res.json({
      success: true,
      data: collaborationsWithFreelancers
    });
  } catch (error) {
    console.error('Get collaborations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collaborations',
      error: error.message
    });
  }
});

// Rate freelancer
router.post('/collaborations/:collaborationId/rate', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { rating, review } = req.body;
    const providerId = req.user.uid;
    
    // Get collaboration
    const collaboration = await firebaseHelpers.getDocument('collaborations', collaborationId);
    if (!collaboration || collaboration.providerId !== providerId) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    // Create rating
    const ratingData = {
      collaborationId,
      providerId,
      freelancerId: collaboration.freelancerId,
      rating,
      review,
      createdAt: new Date().toISOString()
    };
    
    await firebaseHelpers.createDocument('freelancer_ratings', ratingData);
    
    // Update freelancer's average rating
    const allRatings = await firebaseHelpers.getCollection('freelancer_ratings') || [];
    const freelancerRatings = allRatings.filter(r => r.freelancerId === collaboration.freelancerId);
    const averageRating = freelancerRatings.reduce((sum, r) => sum + r.rating, 0) / freelancerRatings.length;
    
    await firebaseHelpers.updateDocument('users', collaboration.freelancerId, {
      rating: averageRating,
      reviewCount: freelancerRatings.length,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Rate freelancer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
});

// Get freelancer details
router.get('/freelancers/:freelancerId', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { freelancerId } = req.params;
    
    // Get freelancer profile
    const freelancer = await firebaseHelpers.getDocument('users', freelancerId);
    if (!freelancer || freelancer.role !== 'freelancer') {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found'
      });
    }
    
    // Get freelancer portfolio
    const allPortfolio = await firebaseHelpers.getCollection('portfolio') || [];
    const freelancerPortfolio = allPortfolio.filter(item => item.freelancerId === freelancerId);
    
    // Get freelancer ratings
    const allRatings = await firebaseHelpers.getCollection('freelancer_ratings') || [];
    const freelancerRatings = allRatings.filter(rating => rating.freelancerId === freelancerId);

    res.json({
      success: true,
      data: {
        ...freelancer,
        portfolio: freelancerPortfolio,
        ratings: freelancerRatings
      }
    });
  } catch (error) {
    console.error('Get freelancer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get freelancer details',
      error: error.message
    });
  }
});

module.exports = router;
