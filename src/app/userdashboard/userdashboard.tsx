"use client";
import React, { useState, useEffect } from 'react';
import { Moon, SearchIcon, Sun, UserIcon, Star, Menu } from 'lucide-react';
import Image from 'next/image';
import logo from '../assets/logosaas.png';
import { auth, db } from '../lib/firebase-config';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Account from './selections/Account';
import History from './selections/History';
import Modal from '../components/Modal';
import ArticlePic from '../assets/ArticlePic.jpg';
import AlgebraPic from '../assets/Algebra.jpg';
import Favorites from './selections/Favorites';

const UserDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : true;
    }
    return true;
  });
  const [activeSection, setActiveSection] = useState<string>('Dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser?.photoURL) {
        setProfilePicture(currentUser.photoURL);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const handleProfileUpdate = (newPhotoURL: string) => {
    setProfilePicture(newPhotoURL);
  };

  const toggleFavorite = async (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));

    // Save favorites to Firestore
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        favorites: newFavorites,
      }, { merge: true });
    }
  };

  let component;
  switch (activeSection) {
    case 'History':
      component = <History isDarkMode={isDarkMode} />;
      break;
    case 'Favorites':
      component = <Favorites isDarkMode={isDarkMode} favorites={favorites} />;
      break;
    case 'Settings':
      component = <Account isDarkMode={isDarkMode} />;
      break;
    default:
      const gridItems = [
        {
          id: 'article',
          title: 'Scrape Article',
          href: '/generators/ArticleGen',
          image: ArticlePic,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          )
        },
        {
          id: 'algebra',
          title: 'Algebra',
          href: '/generators/Math/Algebra',
          image: AlgebraPic,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          )
        },
        // Add more items here as needed
      ];

      component = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              } rounded-lg p-4 h-80 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group`}
              style={{
                backgroundImage: `url(${item.image.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black opacity-70 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center">
                <svg
                  className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {item.icon}
                </svg>
                <span className="text-center text-white font-semibold">{item.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(item.id);
                }}
                className="absolute bottom-2 right-2 z-20"
              >
                <Star
                  className={`w-6 h-6 ${
                    favorites.includes(item.id)
                      ? 'text-yellow-400 fill-current'
                      : 'text-white'
                  }`}
                />
              </button>
            </a>
          ))}

          {/* Remaining placeholder boxes */}
          {[...Array(Math.max(0, 6 - gridItems.length))].map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className={`${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              } rounded-lg p-4 h-80`}
            ></div>
          ))}
        </div>
      );
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfilePicture(user.photoURL);
          setActiveSection(userDoc.data().displayName); // Update display name
          setFavorites(userDoc.data().favorites || []); // Load favorites from Firestore
          localStorage.setItem('favorites', JSON.stringify(userDoc.data().favorites || [])); // Sync with localStorage
        }
      }
    };
    fetchUserData();
  }, [user]);

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-opacity-90 backdrop-blur-sm">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="w-6 h-6" />
        </button>
        <Image src={logo} alt='SaaS Logo' height={40} width={40} />
        <div className="w-6 h-6"></div> {/* Placeholder for balance */}
      </div>

      {/* Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-200 ease-in-out z-30 w-64 p-4 flex flex-col border-r ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div className="flex justify-between items-center mb-8">
          <a href="/" aria-label="Homepage">
            <Image src={logo} alt='SaaS Logo' height={40} width={40} />
          </a>
          <button 
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          {profilePicture ? (
            <Image 
              src={profilePicture} 
              alt="User Profile"
              width={80} 
              height={80} 
              className="rounded-full mb-2 object-cover" 
            />
          ) : (
            <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} flex items-center justify-center mb-2`}>
              <UserIcon className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          )}
          <h2 className="text-lg font-semibold">{user?.displayName || 'Guest'}</h2> {/* Change back to displayName */}

          <button 
            className={`${isDarkMode ? 'text-white' : 'text-gray-900'} mx-4 rounded text-sm`}
            onClick={() => setIsModalOpen(true)}
          >
            Edit
          </button>
        </div>

        <nav className="flex-grow">
          {['Dashboard', 'History', 'Favorites', 'Settings'].map((section) => (
            <button
              key={section}
              className={`w-full text-left py-2 px-4 rounded mb-2 ${
                activeSection === section 
                  ? isDarkMode ? 'bg-gray-800' : 'bg-gray-200' 
                  : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              onClick={() => {
                setActiveSection(section);
                setIsSidebarOpen(false);
              }}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center">
          <div className="flex items-center mb-4">
            <span className="text-sm"><Sun/></span>
            <button 
              className={`w-12 h-6 rounded-full p-1 mx-4 ${isDarkMode ? 'bg-yellow-400' : 'bg-gray-400'}`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm"><Moon /></span>
          </div>

          <div className="flex space-x-4 mb-4">
            <a href="/legal/helpcenter" className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Help</a>
            <a href="/legal/tos" className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>TOS</a>
            <a href="/legal/privacy" className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Privacy</a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto mt-16 lg:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0 hidden lg:block">{activeSection}</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
            <div className="relative mb-4 sm:mb-0 sm:mr-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search something..."
                className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'} rounded-full py-2 px-4 pr-10 focus:outline-none w-full`}
              />
              <SearchIcon className={`absolute right-3 top-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} w-5 h-5`} />
            </div>
            <a className="bg-yellow-400 text-gray-900 rounded-full px-4 py-2 font-medium w-full sm:w-auto text-center" href='memberships'>
              Upgrade
            </a>
          </div>
        </div>

        {component}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProfileUpdate={handleProfileUpdate} />
    </div>
  );
}

export default UserDashboard;