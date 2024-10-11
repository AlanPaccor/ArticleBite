"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import ArrowRight from '../assets/arrow-right.svg';
import Logo from '../assets/logosaas.png';
import Image from "next/image";
import MenuIcon from '../assets/menu.svg';
import { auth } from "../lib/firebase-config";
import { useTheme } from '../contexts/ThemeContext';

export const SecondHeader = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if the user is logged in (only on the client)
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsLoggedIn(!!user);
      });

      return () => unsubscribe();
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
            <button onClick={toggleMenu} className="md:hidden">
              <MenuIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
            {/* Desktop Navigation */}
            <nav className={`hidden md:flex gap-6 ${isDarkMode ? 'text-white/80' : 'text-black/60'} items-center`}>
              <a href='#' className="hover:text-white">About</a>
              <a href='#' className="hover:text-white">Features</a>
              <a href='/memberships' className="hover:text-white">Memberships</a>
              <a href='#' className="hover:text-white">Reviews</a>

              {!isLoggedIn && (
                <>
                  <a href='/registration/login' className="hover:text-white">Login</a>
                  <a href='/registration/signup' className={`${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight`}>Sign Up</a>
                </>
              )}
              
              {isLoggedIn && (
                <a href='/userdashboard' className={`dashBoardbtn ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight`}>Dashboard</a>
              )}
            </nav>
            {/* Mobile Navigation */}
            <nav className={`md:hidden ${isDarkMode ? 'text-white/80' : 'text-black/60'} absolute top-full left-0 w-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-[400px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'} overflow-hidden`}>
              <div className="flex flex-col gap-4 p-4">
                <a href='#' className="py-2 transform transition-transform duration-325 ease-in-out hover:translate-x-2 hover:text-white">About</a>
                <a href='#' className="py-2 transform transition-transform duration-325 ease-in-out hover:translate-x-2 hover:text-white">Features</a>
                <a href='/memberships' className="py-2 transform transition-transform duration-500 ease-in-out hover:translate-x-2 hover:text-white">Memberships</a>
                <a href='#' className="py-2 transform transition-transform duration-325 ease-in-out hover:translate-x-2 hover:text-white">Reviews</a>

                {!isLoggedIn && (
                  <>
                    <a href='/registration/login' className="py-2 transform transition-transform duration-500 ease-in-out hover:translate-x-2 hover:text-white">Login</a>
                    <a href='/registration/signup' className={`py-2 ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} px-4 rounded-lg font-medium inline-flex items-center justify-center tracking-tight transform transition-transform duration-500 ease-in-out hover:scale-105`}>Sign Up</a>
                  </>
                )}
                
                {isLoggedIn && (
                  <a href='/userdashboard' className={`py-2 dashBoardbtn ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} px-4 rounded-lg font-medium inline-flex items-center justify-center tracking-tight transform transition-transform duration-500 ease-in-out hover:scale-105`}>Dashboard</a>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};