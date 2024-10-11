"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase-config';
import { doc, setDoc } from 'firebase/firestore';

export default function Account({ isDarkMode }: { isDarkMode: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'paymentHistory' | 'personalDetails' | 'logout'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setNewUsername(user?.displayName || '');
      setNewEmail(user?.email || '');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/registration/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out. Please try again.");
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      if (newUsername !== user.displayName) {
        await updateProfile(user, { displayName: newUsername });
      }
      await setDoc(doc(db, "users", user.uid), {
        displayName: newUsername,
      }, { merge: true });

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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
            <p>Welcome to your dashboard! Here you can see a summary of your account activities.</p>
          </section>
        );
      case 'paymentHistory':
        return (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
            <p>Here you can view your payment history.</p>
            {/* Add payment history details here */}
          </section>
        );
      case 'personalDetails':
        return (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Personal Details</h2>
            <div>
              <p className="mb-2">Email: {user?.email}</p>
              <p className="mb-4">Username: {user?.displayName || 'No username set'}</p>
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
          </section>
        );
      case 'logout':
        return (
          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Logout</h2>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </section>
        );
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md rounded-lg`}>
      {/* Desktop View */}
      <div className="hidden lg:block">
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
        {renderContent()}
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <p>Welcome to your dashboard! Here you can see a summary of your account activities.</p>
        </section>

        <hr className={`my-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
          <p>Here you can view your payment history.</p>
          {/* Add payment history details here */}
        </section>

        <hr className={`my-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Personal Details</h2>
          <div>
            <p className="mb-2">Email: {user?.email}</p>
            <p className="mb-4">Username: {user?.displayName || 'No username set'}</p>
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
        </section>

        <hr className={`my-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Logout</h2>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </section>
      </div>
    </div>
  );
}