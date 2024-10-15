"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import ArrowRight from '../assets/arrow-right.svg';
import Logo from '../assets/logosaas.png';
import MenuIcon from '../assets/menu.svg';
import { auth } from "../lib/firebase-config";

export const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if the user is logged in (only on the client)
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsLoggedIn(!!user); // Set true if user is logged in, false otherwise
      });

      return () => unsubscribe();
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className='sticky top-0 z-20'>
      <div className="flex justify-center items-center py-3 bg-black text-white text-sm gap-3">
        <p className='text-white/60 hidden md:block'>Generate More Than Website Links, Start on PDFs, Videos, and More</p>
        <a href="/memberships" className='inline-flex gap-1 items-center'>
          <p>Get a Membership Now!</p>
          <Image src={ArrowRight} alt="Arrow Right" width={16} height={16} />
        </a>
      </div>
      <div className='py-5 bg-white/0'>
        <div className='container'>
          <div className='flex items-center justify-between'>
            <a href="/" aria-label="Homepage">
              <Image src={Logo} alt='SaaS Logo' height={40} width={40}/>
            </a>
            <button onClick={toggleMenu} className="md:hidden">
              <Image src={MenuIcon} alt="Menu" width={20} height={20} />
            </button>
            {/* Desktop Navigation */}
            <nav className='hidden md:flex gap-6 text-black/60 items-center'>
              <a href='#'>About</a>
              <a href='#'>Features</a>
              <a href='/memberships'>Memberships</a>
              <a href='#'>Reviews</a>

              {isLoggedIn ? (
                <a href='/userdashboard' className='dashBoardbtn bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight'>Dashboard</a>
              ) : (
                <>
                  <a href='/registration/login'>Login</a>
                  <a href='/registration/signup' className='bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight'>Sign Up</a>
                </>
              )}
            </nav>
            {/* Mobile Navigation */}
            <nav className={`md:hidden text-white absolute top-full left-0 w-full bg-black/80 backdrop-blur-md transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-[400px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'} overflow-hidden`}>
              <div className="flex flex-col gap-4 p-4">
                <a href='#' className="py-2 px-3 bg-black/85 rounded-md transform transition-all duration-325 ease-in-out hover:translate-x-2 hover:bg-black/90">About</a>
                <a href='#' className="py-2 px-3 bg-black/85 rounded-md transform transition-all duration-325 ease-in-out hover:translate-x-2 hover:bg-black/90">Features</a>
                <a href='/memberships' className="py-2 px-3 bg-black/85 rounded-md transform transition-all duration-500 ease-in-out hover:translate-x-2 hover:bg-black/90">Memberships</a>
                <a href='#' className="py-2 px-3 bg-black/85 rounded-md transform transition-all duration-325 ease-in-out hover:translate-x-2 hover:bg-black/90">Reviews</a>

                {isLoggedIn ? (
                  <a href='/userdashboard' className="py-2 px-4 dashBoardbtn bg-white text-black rounded-lg font-medium inline-flex items-center justify-center tracking-tight transform transition-all duration-500 ease-in-out hover:scale-105">Dashboard</a>
                ) : (
                  <>
                    <a href='/registration/login' className="py-2 px-3 bg-black/85 rounded-md transform transition-all duration-500 ease-in-out hover:translate-x-2 hover:bg-black/90">Login</a>
                    <a href='/registration/signup' className="py-2 px-4 bg-white text-black rounded-lg font-medium inline-flex items-center justify-center tracking-tight transform transition-all duration-500 ease-in-out hover:scale-105">Sign Up</a>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
