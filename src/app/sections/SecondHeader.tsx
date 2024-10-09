"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import ArrowRight from '../assets/arrow-right.svg';
import Logo from '../assets/logosaas.png';
import Image from "next/image";
import MenuIcon from '../assets/menu.svg';
import { auth } from "../lib/firebase-config";
import { useTheme } from '../contexts/ThemeContext'; // Add this import

export const SecondHeader = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme(); // Add this line

  // Check if the user is logged in (only on the client)
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsLoggedIn(!!user); // Set true if user is logged in, false otherwise
      });

      return () => unsubscribe();
    }
  }, []);

  return (
    <header className={`sticky top-0 backdrop-blur-sm z-20 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className={`flex justify-center items-center py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-black'} text-white text-sm gap-3`}>
        <p className='text-white/60 hidden md:block'>Generate More Than Website Links, Start on PDFs, Videos, and More</p>
        <a href="/memberships" className='inline-flex gap-1 items-center'>
          <p>Get a Membership Now!</p>
          <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
        </a>
      </div>
      <div className='py-5'>
        <div className='container'>
          <div className='flex items-center justify-between'>
            <a href="/" aria-label="Homepage">
              <Image src={Logo} alt='SaaS Logo' height={40} width={40}/>
            </a>
            <MenuIcon className={`h-5 w-5 md:hidden ${isDarkMode ? 'text-white' : 'text-black'}`} />
            <nav className={`hidden md:flex gap-6 ${isDarkMode ? 'text-white/60' : 'text-black/60'} items-center`}>
              <a href='#'>About</a>
              <a href='#'>Features</a>
              <a href='/memberships'>Memberships</a>
              <a href='#'>Reviews</a>

              {/* Show "Login" and "Sign Up" if the user is NOT logged in */}
              {!isLoggedIn && (
                <>
                  <a href='/registration/login'>Login</a>
                  <a href='/registration/signup' className={`${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight`}>Sign Up</a>
                </>
              )}
              
              {/* Show "Dashboard" button if the user IS logged in */}
              {isLoggedIn && (
                <a href='/userdashboard' className={`dashBoardbtn ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight`}>Dashboard</a>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
