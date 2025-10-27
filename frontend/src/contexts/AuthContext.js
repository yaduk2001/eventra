'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signUp = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: userData.name,
        photoURL: userData.picture
      });

      // Create user profile through secure backend API
      const response = await api.createUserProfile(
        userData.role, 
        userData, 
        user.uid, 
        email, 
        userData.name, 
        userData.picture
      );
      
      if (response.data) {
        setUserProfile(response.data);
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      
      // Clear localStorage to prevent stale data on next login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('registrationComplete');
        console.log('Cleared localStorage on logout');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user profile from backend
  const fetchUserProfile = async (uid) => {
    try {
      // Check if user has a valid token before making the API call
      if (!auth.currentUser) {
        console.log('No authenticated user, skipping profile fetch');
        return null;
      }

      // Try to get a fresh token to verify authentication
      const token = await auth.currentUser.getIdToken(false);
      if (!token) {
        console.log('No valid token available, skipping profile fetch');
        return null;
      }

      console.log('Making API call to get user profile...');
      const response = await api.getUserProfile();
      console.log('Profile response:', response);
      
      if (response.data) {
        console.log('Setting user profile:', response.data);
        setUserProfile(response.data);
        
        // Sync role to localStorage to keep it consistent with backend
        if (response.data.role && typeof window !== 'undefined') {
          localStorage.setItem('userRole', response.data.role);
          console.log('Synced role to localStorage:', response.data.role);
        }
        
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // If it's an authentication error, clear the profile
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('No token provided')) {
        console.warn('Authentication failed, clearing user profile');
        setUserProfile(null);
        return null;
      }
      
      // If it's a network error, don't set userProfile to null
      if (error.message.includes('Unable to connect to server')) {
        console.warn('Backend server not available, skipping profile fetch');
        // Don't set userProfile to null, keep existing state
        return null;
      }
      
      // If profile doesn't exist (404), that's also valid - user may be new
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.warn('User profile not found - user may need to complete registration or onboarding');
        // Set userProfile to null to indicate no profile exists
        setUserProfile(null);
        return null;
      }
      
      // For other errors, don't change the profile state
      console.warn('Profile fetch failed with error:', error.message);
    }
    return null;
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      const response = await api.updateUserProfile(profileData);
      if (response.data) {
        setUserProfile(response.data);
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Get Firebase ID token
  const getIdToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      
      if (user) {
        // Fetch user profile when user signs in with retry logic
        console.log('Fetching user profile...');
        let retryCount = 0;
        const maxRetries = 3;
        
        const fetchWithRetry = async () => {
          try {
            await fetchUserProfile(user.uid);
          } catch (error) {
            console.warn(`Profile fetch failed (attempt ${retryCount + 1}/${maxRetries}):`, error);
            
            if (retryCount < maxRetries - 1) {
              retryCount++;
              // Wait before retrying (exponential backoff)
              setTimeout(() => {
                fetchWithRetry();
              }, 1000 * retryCount);
            } else {
              console.warn('Profile fetch failed after all retries, continuing without profile');
              // Don't fail the auth process if profile fetch fails
            }
          }
        };
        
        fetchWithRetry();
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Method to refresh user profile (useful after onboarding completion)
  const refreshUserProfile = async () => {
    if (user) {
      console.log('Refreshing user profile...');
      const profile = await fetchUserProfile(user.uid);
      return profile;
    }
    return null;
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    fetchUserProfile,
    updateUserProfile,
    getIdToken,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
