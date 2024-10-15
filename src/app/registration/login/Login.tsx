"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; 
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { auth } from '@/firebase/firebaseConfig';

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 

  useEffect(() => {
    localStorage.setItem('previousLocation', window.location.pathname);

    // Check if the user is already logged in and redirect them to the dashboard
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          router.push('/userdashboard');
        }
      });

      // Cleanup the subscription when the component is unmounted
      return () => unsubscribe();
    }
  }, [router]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      console.error('Auth is not initialized');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const previousLocation = localStorage.getItem('previousLocation');
      if (previousLocation === '/registration/signup' || previousLocation === '/registration/login') {
        router.push('/userdashboard'); 
      } else if (previousLocation) {
        router.push(previousLocation); 
      } else {
        router.push('/userdashboard'); 
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Login to ArticleBite</h1>
        <h2 className="mt-4 text-sm text-gray-700">
          Not Signed Up? <Link href="/registration/signup" className="text-blue-500 hover:underline">Sign Up</Link>
        </h2>
      </div>
      
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input w-full py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input w-full py-2"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              >
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow hover:bg-blue-600 py-2">
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/reset-password" className="text-sm text-gray-700 underline hover:no-underline">
            Forgot password
          </Link>
        </div>
      </div>
    </div>
  );
}
