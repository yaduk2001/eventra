# Authentication Flow Fixes - Service Provider Login Issue

## Problem Analysis

The user was experiencing a redirect loop when logging in as a Service Provider:
1. Login → Redirected to `/provider/onboarding`
2. Onboarding page shows "Please login to continue"
3. Redirected back to `/auth/login`
4. Loop continues indefinitely

## Root Causes Identified

### 1. **Timing Issue with AuthContext Initialization**
- The onboarding page was checking for authentication before the AuthContext had fully initialized
- `window.location.href` redirects cause full page reloads, interrupting AuthContext state

### 2. **Aggressive Authentication Guards**
- The onboarding page had two authentication checks that were too aggressive:
  - A `useEffect` that immediately redirected unauthenticated users
  - A render-time check that showed "Please login to continue"

### 3. **Missing Role Information**
- When profile fetch failed (404), the login page didn't have enough information to determine if the user was a service provider
- No localStorage backup for user role information

### 4. **Race Conditions**
- AuthContext profile fetching could fail or take time, causing the onboarding page to think the user wasn't authenticated

## Fixes Implemented

### 1. **Enhanced Registration Process** (`auth/register/page.js`)
```javascript
// Store user role in localStorage for login redirect logic
localStorage.setItem('userRole', role);
localStorage.setItem('registrationComplete', 'true');
```
- Added localStorage storage of user role during registration
- Provides fallback information for login redirect logic

### 2. **Improved Login Page Logic** (`auth/login/page.js`)
```javascript
// For new users without profiles, check localStorage for intended role
const intendedRole = localStorage.getItem('userRole') || 'customer';

if (['event_company', 'caterer', 'transport', 'photographer'].includes(intendedRole)) {
  // Redirect to onboarding with role information
  localStorage.setItem('userRole', intendedRole);
  setTimeout(() => {
    window.location.href = '/provider/onboarding';
  }, 500);
}
```
- Added localStorage fallback for role detection
- Added delays before redirects to allow AuthContext to initialize
- Store role information before redirecting to onboarding

### 3. **Enhanced Onboarding Page Authentication** (`provider/onboarding/page.js`)
```javascript
// Redirect unauthenticated users (only after loading is complete and sufficient time has passed)
useEffect(() => {
  let timeoutId;
  
  if (!loading && !user) {
    console.log('User not authenticated after loading complete, starting redirect timer');
    timeoutId = setTimeout(() => {
      if (!user) {
        console.log('User still not authenticated after timeout, redirecting to login');
        window.location.href = '/auth/login';
      }
    }, 2000); // Increased to 2 seconds
  }
  
  // Clear timeout if user becomes available
  if (user && timeoutId) {
    clearTimeout(timeoutId);
  }
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [user, loading]);
```
- Increased timeout delay to 2 seconds to allow AuthContext initialization
- Added proper timeout cleanup
- Changed immediate "Please login" message to loading state

### 4. **Improved AuthContext Error Handling** (`contexts/AuthContext.js`)
```javascript
if (user) {
  console.log('Fetching user profile...');
  try {
    await fetchUserProfile(user.uid);
  } catch (error) {
    console.warn('Profile fetch failed during auth state change:', error);
    // Don't fail the auth process if profile fetch fails
  }
}
```
- Added try-catch around profile fetching to prevent auth failures
- Profile fetch failures no longer interrupt the authentication process

### 5. **Added Debug Logging**
- Added comprehensive debug logging to track authentication state
- Added localStorage role tracking
- Added timing information for troubleshooting

## Expected Flow After Fixes

### For New Service Providers
1. **Registration**: 
   - User registers as "provider"
   - Profile created with `role: 'event_company'`, `profileComplete: false`
   - Role stored in localStorage
   - Redirected to login

2. **Login**:
   - User enters credentials
   - Profile fetched successfully (should exist from registration)
   - Profile shows `profileComplete: false`
   - User redirected to `/provider/onboarding` with 500ms delay
   - Role stored in localStorage as backup

3. **Onboarding**:
   - Page loads with 2-second authentication grace period
   - AuthContext initializes and user is authenticated
   - User completes onboarding form
   - Profile updated with `profileComplete: true`
   - Redirected to `/provider/dashboard`

### For Returning Service Providers
1. **Login**:
   - User enters credentials
   - Profile fetched successfully
   - Profile shows `profileComplete: true`
   - User redirected directly to `/provider/dashboard`

### Fallback Scenarios
1. **Profile Fetch Fails (404)**:
   - Check localStorage for `userRole`
   - If service provider role found, redirect to onboarding
   - If customer role or no role, redirect to customer dashboard

2. **Network Issues**:
   - Graceful degradation with user feedback
   - Fallback to customer dashboard with notification

3. **AuthContext Slow to Initialize**:
   - Onboarding page shows loading state for up to 2 seconds
   - Prevents premature "Please login" messages

## Testing Checklist

### New Service Provider Registration & Login
- [ ] Register as Service Provider
- [ ] Verify localStorage contains `userRole: 'event_company'`
- [ ] Login with credentials
- [ ] Verify redirect to `/provider/onboarding` (no login prompt)
- [ ] Complete onboarding
- [ ] Verify redirect to `/provider/dashboard`

### Returning Service Provider Login
- [ ] Login with completed service provider account
- [ ] Verify direct redirect to `/provider/dashboard`
- [ ] No unnecessary stops at onboarding

### Error Scenarios
- [ ] Test with backend unavailable
- [ ] Test with slow network
- [ ] Test with invalid credentials
- [ ] Verify appropriate error messages and fallbacks

## Key Improvements

1. **Eliminated Redirect Loops**: Proper timing and authentication checks
2. **Better Error Handling**: Graceful degradation when services are unavailable
3. **Improved User Experience**: No more "Please login" flashes for authenticated users
4. **Robust Fallbacks**: localStorage backup for role information
5. **Enhanced Debugging**: Comprehensive logging for troubleshooting
6. **Race Condition Prevention**: Proper delays and timeout handling

## Monitoring

The following console logs will help monitor the authentication flow:

- `=== Onboarding Page State ===` - Shows authentication state on onboarding page
- `Auth state changed:` - Shows AuthContext initialization
- `User signed in successfully:` - Shows successful login
- `Service provider profile incomplete, redirecting to onboarding` - Shows redirect logic
- `User not authenticated after loading complete` - Shows authentication failures

These logs will help identify any remaining issues in the authentication flow.