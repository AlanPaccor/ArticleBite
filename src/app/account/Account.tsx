"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase-config';

export default function Account() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'paymentHistory' | 'personalDetails' | 'logout'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
      if (newDisplayName) {
        await updateProfile(user, { displayName: newDisplayName });
      }
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }
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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold mb-6">Account</h1>
      
      {/* Navigation Tabs */}
      <div className="flex mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`flex-1 p-2 text-center ${activeSection === 'dashboard' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveSection('paymentHistory')}
          className={`flex-1 p-2 text-center ${activeSection === 'paymentHistory' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
        >
          Payment History
        </button>
        <button
          onClick={() => setActiveSection('personalDetails')}
          className={`flex-1 p-2 text-center ${activeSection === 'personalDetails' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
        >
          Personal Details
        </button>
        <button
          onClick={() => setActiveSection('logout')}
          className={`flex-1 p-2 text-center ${activeSection === 'logout' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-600'}`}
        >
          Logout
        </button>
      </div>

      {/* Section Content */}
      <div>
        {activeSection === 'dashboard' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <p>Welcome to your dashboard! Here you can see a summary of your account activities.</p>
            {/* Add more dashboard content here */}
          </div>
        )}
        
        {activeSection === 'paymentHistory' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment History</h2>
            <p>Here you can view your payment history.</p>
            {/* Add payment history content here */}
          </div>
        )}
        
        {activeSection === 'personalDetails' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
            <div>
              <p className="mb-2">Email: {user?.email}</p>
              <p className="mb-4">Display Name: {user?.displayName || 'No display name set'}</p>
              <input
                type="text"
                placeholder="New display name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="block w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <input
                type="email"
                placeholder="New email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="block w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full mb-4 p-2 border border-gray-300 rounded"
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
