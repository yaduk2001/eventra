// Authentication Flow Test Utility
// This utility helps test and debug the service provider authentication flow

export const testAuthFlow = {
  // Test if user is properly authenticated
  checkAuthentication: (user) => {
    console.log('=== Authentication Check ===');
    console.log('User exists:', !!user);
    if (user) {
      console.log('User ID:', user.uid);
      console.log('User email:', user.email);
      console.log('Email verified:', user.emailVerified);
    }
    return !!user;
  },

  // Test if profile is properly loaded
  checkProfile: (userProfile) => {
    console.log('=== Profile Check ===');
    console.log('Profile exists:', !!userProfile);
    if (userProfile) {
      console.log('Profile role:', userProfile.role);
      console.log('Profile complete:', userProfile.profileComplete);
      console.log('Completed flag:', userProfile.completed);
      console.log('Business name:', userProfile.businessName);
    }
    return userProfile;
  },

  // Test if user is a service provider
  checkServiceProvider: (userProfile) => {
    console.log('=== Service Provider Check ===');
    const providerRoles = ['event_company', 'caterer', 'transport', 'photographer'];
    const isProvider = userProfile && providerRoles.includes(userProfile.role);
    console.log('Is service provider:', isProvider);
    console.log('User role:', userProfile?.role);
    return isProvider;
  },

  // Test if profile is complete
  checkProfileComplete: (userProfile) => {
    console.log('=== Profile Completion Check ===');
    const isComplete = userProfile && (userProfile.profileComplete || userProfile.completed);
    console.log('Profile complete:', isComplete);
    console.log('profileComplete flag:', userProfile?.profileComplete);
    console.log('completed flag:', userProfile?.completed);
    return isComplete;
  },

  // Determine where user should be redirected
  determineRedirect: (user, userProfile) => {
    console.log('=== Redirect Determination ===');
    
    if (!user) {
      console.log('Redirect: /auth/login (no user)');
      return '/auth/login';
    }

    // If no profile, check localStorage for role to determine correct redirect
    if (!userProfile) {
      console.log('No profile found, checking localStorage for role...');
      const roleFromStorage = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      console.log('Role from localStorage:', roleFromStorage);
      
      const providerRoles = ['event_company', 'caterer', 'transport', 'photographer'];
      
      // If role is a provider role, redirect to provider onboarding
      if (roleFromStorage && providerRoles.includes(roleFromStorage)) {
        console.log('Redirect: /provider/onboarding (provider role in localStorage, no profile)');
        return '/provider/onboarding';
      }
      
      // For other roles or no role, redirect to appropriate dashboard
      const redirect = roleFromStorage === 'customer' ? '/customer/dashboard' : 
                      roleFromStorage === 'freelancer' ? '/freelancer/dashboard' :
                      roleFromStorage === 'jobseeker' ? '/jobseeker/dashboard' :
                      roleFromStorage === 'admin' ? '/admin' : '/customer/dashboard';
      console.log(`Redirect: ${redirect} (no profile, using localStorage role: ${roleFromStorage || 'default customer'})`);
      return redirect;
    }

    const providerRoles = ['event_company', 'caterer', 'transport', 'photographer'];
    if (!providerRoles.includes(userProfile.role)) {
      const redirect = userProfile.role === 'customer' ? '/customer/dashboard' : 
                      userProfile.role === 'freelancer' ? '/freelancer/dashboard' :
                      userProfile.role === 'jobseeker' ? '/jobseeker/dashboard' :
                      userProfile.role === 'admin' ? '/admin' : '/customer/dashboard';
      console.log(`Redirect: ${redirect} (not a service provider)`);
      return redirect;
    }

    const isComplete = userProfile.profileComplete || userProfile.completed;
    if (!isComplete) {
      console.log('Redirect: /provider/onboarding (profile incomplete)');
      return '/provider/onboarding';
    }

    console.log('Redirect: /provider/dashboard (all checks passed)');
    return '/provider/dashboard';
  },

  // Run full authentication flow test
  runFullTest: (user, userProfile) => {
    console.log('🔍 Running Full Authentication Flow Test');
    console.log('==========================================');
    
    const authResult = testAuthFlow.checkAuthentication(user);
    const profileResult = testAuthFlow.checkProfile(userProfile);
    const providerResult = testAuthFlow.checkServiceProvider(userProfile);
    const completeResult = testAuthFlow.checkProfileComplete(userProfile);
    const redirectResult = testAuthFlow.determineRedirect(user, userProfile);
    
    console.log('==========================================');
    console.log('📊 Test Results Summary:');
    console.log('- Authentication:', authResult ? '✅ PASS' : '❌ FAIL');
    console.log('- Profile loaded:', profileResult ? '✅ PASS' : '❌ FAIL');
    console.log('- Is service provider:', providerResult ? '✅ PASS' : '❌ FAIL');
    console.log('- Profile complete:', completeResult ? '✅ PASS' : '❌ FAIL');
    console.log('- Recommended redirect:', redirectResult);
    console.log('==========================================');
    
    return {
      authenticated: authResult,
      profileLoaded: !!profileResult,
      isServiceProvider: providerResult,
      profileComplete: completeResult,
      recommendedRedirect: redirectResult
    };
  }
};

// Helper function to use in components for debugging
export const debugAuthFlow = (user, userProfile, componentName = 'Unknown') => {
  console.log(`🐛 Debug Auth Flow - ${componentName}`);
  return testAuthFlow.runFullTest(user, userProfile);
};