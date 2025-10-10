'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';

const AuthDebugPage = () => {
  const { user, userProfile, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toISOString(),
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      } : null,
      userProfile: userProfile,
      loading: loading
    });
  }, [user, userProfile, loading]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Status Summary</h2>
          <div className="space-y-2">
            <div className={`p-2 rounded ${loading ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div className={`p-2 rounded ${user ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>User Authenticated:</strong> {user ? 'Yes' : 'No'}
            </div>
            <div className={`p-2 rounded ${userProfile ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Profile Loaded:</strong> {userProfile ? 'Yes' : 'No'}
            </div>
            {userProfile && (
              <div className="p-2 rounded bg-blue-100">
                <strong>User Role:</strong> {userProfile.role}
              </div>
            )}
            {userProfile && (
              <div className="p-2 rounded bg-blue-100">
                <strong>Profile Complete:</strong> {userProfile.profileComplete || userProfile.completed ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPage;