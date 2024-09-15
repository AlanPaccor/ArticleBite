"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/lib/firebase-config';

export default function Account({ isDarkMode }: { isDarkMode: boolean }) {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState(user?.displayName || ''); // Now referred to as username
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'paymentHistory' | 'personalDetails' | 'logout'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setNewUsername(user?.displayName || ''); // Populate username
      setNewEmail(user?.email || '');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out. Please try again.");
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      // Update username (displayName acts as username)
      if (newUsername !== user.displayName) {
        await updateProfile(user, { displayName: newUsername });
      }

      // Update email if it is different
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }

      // Update password if it's provided
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md rounded-lg`}>
      <h1 className="text-3xl font-semibold mb-6">Account</h1>
      
      {/* Navigation Tabs */}
      <div className={`flex mb-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        {['dashboard', 'paymentHistory', 'personalDetails', 'logout'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section as any)}
            className={`flex-1 p-2 text-center ${
              activeSection === section 
                ? `border-b-2 border-blue-500 font-semibold` 
                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div>
        {activeSection === 'dashboard' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <p>Welcome to your dashboard! Here you can see a summary of your account activities.</p>
          </div>
        )}
        
        {activeSection === 'paymentHistory' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment History</h2>
            <p>Here you can view your payment history.</p>
          </div>
        )}
        
        {activeSection === 'personalDetails' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
            <div>
              <p className="mb-2">Email: {user?.email}</p>
              <p className="mb-4">Username: {user?.displayName || 'No username set'}</p> {/* Changed displayName to username */}
              <input
                type="text"
                placeholder="New username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={`block w-full mb-2 p-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded`}
              />
              <input
                type="email"
                placeholder="New email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={`block w-full mb-2 p-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded`}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`block w-full mb-4 p-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded`}
              />
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update Profile
              </button>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}
        
        {activeSection === 'logout' && (
          <div className="text-center">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
