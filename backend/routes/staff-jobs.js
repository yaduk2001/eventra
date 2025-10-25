const express = require('express');
const router = express.Router();
const { firebaseHelpers } = require('../config/firebase');
const { verifyToken, checkRole } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Fallback recommendations when AI is not available
function getFallbackRecommendations(booking) {
  const eventType = booking.eventType?.toLowerCase() || '';
  const guestCount = booking.guestCount || 50;

  let recommendations = [];

  // Basic staff recommendations based on event type
  if (eventType.includes('wedding')) {
    recommendations = [
      {
        jobName: 'Event Coordinator',
        jobType: 'staff',
        spotsNeeded: Math.max(1, Math.ceil(guestCount / 100)),
        description: 'Coordinate event flow and manage timeline',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Setup & Cleanup Staff',
        jobType: 'staff',
        spotsNeeded: Math.max(2, Math.ceil(guestCount / 50)),
        description: 'Handle venue setup and post-event cleanup',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Security Personnel',
        jobType: 'staff',
        spotsNeeded: Math.max(1, Math.ceil(guestCount / 75)),
        description: 'Ensure guest safety and manage access',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Wedding Photographer',
        jobType: 'freelancer',
        spotsNeeded: 1,
        description: 'Capture wedding moments and ceremonies',
        category: 'Photography',
        hourlyRate: 2000,
        duration: '8 hours',
        eventDate: booking.eventDate,
        bookingId: booking.id
      }
    ];
  } else if (eventType.includes('corporate') || eventType.includes('conference')) {
    recommendations = [
      {
        jobName: 'Registration Staff',
        jobType: 'staff',
        spotsNeeded: Math.max(2, Math.ceil(guestCount / 50)),
        description: 'Handle guest registration and check-in',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Technical Support',
        jobType: 'staff',
        spotsNeeded: Math.max(1, Math.ceil(guestCount / 100)),
        description: 'Manage AV equipment and technical needs',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Event Photographer',
        jobType: 'freelancer',
        spotsNeeded: 1,
        description: 'Document corporate event proceedings',
        category: 'Photography',
        hourlyRate: 1500,
        duration: '6 hours',
        eventDate: booking.eventDate,
        bookingId: booking.id
      }
    ];
  } else if (eventType.includes('birthday') || eventType.includes('party')) {
    recommendations = [
      {
        jobName: 'Party Host',
        jobType: 'staff',
        spotsNeeded: Math.max(1, Math.ceil(guestCount / 30)),
        description: 'Engage guests and manage party activities',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Setup & Cleanup Staff',
        jobType: 'staff',
        spotsNeeded: Math.max(2, Math.ceil(guestCount / 40)),
        description: 'Handle decorations and post-party cleanup',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'DJ/Entertainment',
        jobType: 'freelancer',
        spotsNeeded: 1,
        description: 'Provide music and entertainment',
        category: 'Entertainment',
        hourlyRate: 1200,
        duration: '4 hours',
        eventDate: booking.eventDate,
        bookingId: booking.id
      }
    ];
  } else {
    // Generic recommendations for any event
    recommendations = [
      {
        jobName: 'Event Assistant',
        jobType: 'staff',
        spotsNeeded: Math.max(2, Math.ceil(guestCount / 50)),
        description: 'General event support and guest assistance',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Setup & Cleanup Staff',
        jobType: 'staff',
        spotsNeeded: Math.max(1, Math.ceil(guestCount / 75)),
        description: 'Handle venue preparation and cleanup',
        eventDate: booking.eventDate,
        pay: 800,
        bookingId: booking.id
      },
      {
        jobName: 'Event Photographer',
        jobType: 'freelancer',
        spotsNeeded: 1,
        description: 'Document the event with professional photography',
        category: 'Photography',
        hourlyRate: 1500,
        duration: '6 hours',
        eventDate: booking.eventDate,
        bookingId: booking.id
      }
    ];
  }

  return recommendations;
}

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

// AI Staff Recommendation endpoint
router.post('/ai-recommendation', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Get booking details
    const booking = await firebaseHelpers.getDocument('bookings', bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking belongs to provider
    if (booking.providerId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to booking'
      });
    }

    // Check if Google API key is configured
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_ai_api_key_here') {
      // Provide fallback recommendations based on event type
      const fallbackRecommendations = getFallbackRecommendations(booking);

      res.json({
        success: true,
        data: {
          booking: {
            id: booking.id,
            eventType: booking.eventType,
            eventDate: booking.eventDate,
            location: booking.location,
            guestCount: booking.guestCount,
            requirements: booking.requirements
          },
          recommendations: fallbackRecommendations,
          isFallback: true
        }
      });
      return;
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create prompt for AI
    const prompt = `
    Based on the following event details, recommend the types of positions needed and classify them as either "staff" (more permanent/ongoing roles) or "freelancer" (more temporary/project-based roles).
    
    Event Details:
    - Event Type: ${booking.eventType}
    - Date: ${booking.eventDate}
    - Location: ${booking.location}
    - Guest Count: ${booking.guestCount || 'Not specified'}
    - Requirements: ${booking.requirements || 'No specific requirements'}
    - Budget: ₹${booking.price}
    
    Classification Guidelines:
    - STAFF: Permanent roles like event coordinators, security personnel, setup/cleanup teams, registration staff
    - FREELANCER: Temporary roles like photographers, DJs, performers, specialized vendors, consultants
    
    Please provide your recommendations in the following JSON format:
    {
      "recommendations": [
        {
          "jobName": "Job Title",
          "jobType": "staff" or "freelancer",
          "spotsNeeded": number,
          "description": "Brief description of responsibilities",
          "category": "Appropriate category for the job",
          "hourlyRate": number (for freelancer jobs),
          "duration": "Project duration" (for freelancer jobs)
        }
      ]
    }
    
    Consider the event type, guest count, and typical staffing needs. Be practical and realistic in your recommendations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse AI response
    let recommendations;
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
        console.log('AI Response parsed successfully:', JSON.stringify(recommendations, null, 2));
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', aiResponse);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI recommendations',
        error: parseError.message
      });
    }

    // Add event date to each recommendation
    const recommendationsWithDate = recommendations.recommendations.map(rec => ({
      ...rec,
      eventDate: booking.eventDate,
      bookingId: bookingId,
      // Only set pay for staff jobs, preserve hourlyRate for freelancer jobs
      ...(rec.jobType === 'staff' ? { pay: rec.pay || 800 } : {})
    }));

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          eventType: booking.eventType,
          eventDate: booking.eventDate,
          location: booking.location,
          guestCount: booking.guestCount,
          requirements: booking.requirements
        },
        recommendations: recommendationsWithDate,
        isFallback: false
      }
    });

  } catch (error) {
    console.error('AI staff recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI staff recommendations',
      error: error.message
    });
  }
});

// Bulk create jobs from AI recommendations (both staff and freelancer)
router.post('/bulk-create', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { recommendations } = req.body;
    const providerId = req.user.uid;

    if (!recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({
        success: false,
        message: 'Recommendations array is required'
      });
    }

    const createdStaffJobs = [];
    const createdFreelancerJobs = [];

    for (const rec of recommendations) {
      console.log('Processing recommendation:', JSON.stringify(rec, null, 2));
      console.log('Job type:', rec.jobType, 'Type of jobType:', typeof rec.jobType);

      // Determine job type - check for freelancer indicators if jobType is not set
      let jobType = rec.jobType;
      if (!jobType && (rec.hourlyRate || rec.category || rec.duration)) {
        jobType = 'freelancer';
        console.log('Auto-detected freelancer job based on fields');
      } else if (!jobType) {
        jobType = 'staff';
        console.log('Defaulting to staff job');
      }

      console.log('Final job type:', jobType);

      if (jobType === 'staff') {
        // Create staff job
        const staffJobData = {
          providerId,
          jobName: rec.jobName,
          dateTime: rec.eventDate,
          endDateTime: new Date(new Date(rec.eventDate).getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
          pay: rec.pay || 800,
          spotsNeeded: rec.spotsNeeded,
          spotsApplied: 0,
          spotsApproved: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const result = await firebaseHelpers.createDocument('staff_jobs', staffJobData);
        createdStaffJobs.push({ id: result.id, ...staffJobData });
      } else if (jobType === 'freelancer') {
        // Create freelancer job
        const freelancerJobData = {
          providerId,
          title: rec.jobName,
          description: rec.description,
          category: rec.category || 'General',
          location: 'Event Location', // You might want to get this from booking
          hourlyRate: rec.hourlyRate || 1000,
          duration: rec.duration || '4 hours',
          requirements: [rec.description],
          startDate: rec.eventDate,
          endDate: rec.eventDate,
          startHour: rec.startTime || '09:00',
          endHour: rec.endTime || '17:00',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const result = await firebaseHelpers.createDocument('job_postings', freelancerJobData);
        createdFreelancerJobs.push({ id: result.id, ...freelancerJobData });
      }
    }

    const totalJobs = createdStaffJobs.length + createdFreelancerJobs.length;

    const responseData = {
      success: true,
      message: `${totalJobs} jobs created successfully (${createdStaffJobs.length} staff, ${createdFreelancerJobs.length} freelancer)`,
      data: {
        staffJobs: createdStaffJobs,
        freelancerJobs: createdFreelancerJobs,
        total: totalJobs
      }
    };

    console.log('Bulk create response data:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('Bulk create jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create jobs',
      error: error.message
    });
  }
});

// Delete staff job
router.delete('/:jobId', verifyToken, checkRole(['event_company', 'caterer', 'transport', 'photographer']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const providerId = req.user.uid;

    // Verify job exists and belongs to provider
    const job = await firebaseHelpers.getDocument('staff_jobs', jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this job'
      });
    }

    // Delete the job
    await firebaseHelpers.deleteDocument('staff_jobs', jobId);

    // Also delete all related applications
    const allApplications = await firebaseHelpers.getCollection('staff_applications') || [];
    const jobApplications = allApplications.filter(app => app.jobId === jobId);

    for (const application of jobApplications) {
      await firebaseHelpers.deleteDocument('staff_applications', application.id);
    }

    res.json({
      success: true,
      message: 'Staff job deleted successfully'
    });

  } catch (error) {
    console.error('Delete staff job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff job',
      error: error.message
    });
  }
});

module.exports = router;