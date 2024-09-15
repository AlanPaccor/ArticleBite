"use client";

import React, { useState, useEffect } from 'react';
import { Moon, SearchIcon, Sun, UserIcon } from 'lucide-react';
import Image from 'next/image';
import logo from '../assets/logosaas.png';
import { auth } from '../lib/firebase-config';
import { User } from 'firebase/auth';
import Account from './selections/Account';
import History from './selections/History';

export default function UserDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : true;
    }
    return true;
  });
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const renderContent = () => {
    switch (activeSection) {
      case 'History':
        return <History />;
      case 'Schedule':
        return <div>Schedule Content</div>;
      case 'Settings':
        return <Account isDarkMode={isDarkMode} />;
      default:
        return (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg p-4 h-48`}></div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Left Sidebar */}
      <div className={`w-64 p-4 flex flex-col border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className="flex justify-center items-center mb-8">
          <a href="/" aria-label="Homepage">
            <Image src={logo} alt='SaaS Logo' height={40} width={40} />
          </a>
        </div>
        
        <div className="flex flex-col items-center mb-8">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-16 h-16 rounded-full mb-2" />
          ) : (
            <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} flex items-center justify-center mb-2`}>
              <UserIcon className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          )}
          <h2 className="text-lg font-semibold">{user?.displayName || 'Guest'}</h2>
          <button className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Edit</button>
        </div>
        
        <nav className="flex-grow">
          {['Dashboard', 'History', 'Schedule', 'Settings'].map((section) => (
            <button
              key={section}
              className={`w-full text-left py-2 px-4 rounded mb-2 ${
                activeSection === section 
                  ? isDarkMode ? 'bg-gray-800' : 'bg-gray-200' 
                  : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm"><Sun/></span>
          <button 
            className={`w-12 h-6 rounded-full p-1 ${isDarkMode ? 'bg-yellow-400' : 'bg-gray-400'}`}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <div className={`w-4 h-4 rounded-full bg-white transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-6' : ''}`} />
          </button>
          <span className="text-sm"><Moon /></span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{activeSection}</h1>
          <div className="flex items-center">
            <div className="relative mr-4">
              <input
                type="text"
                placeholder="Search something..."
                className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'} rounded-full py-2 px-4 pr-10 focus:outline-none`}
              />
              <SearchIcon className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} w-5 h-5`} />
            </div>
            <a className="bg-yellow-400 text-gray-900 rounded-full px-4 py-2 font-medium mr-4" href='memberships'>
              Upgrade
            </a>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}