"use client";

import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';  // Changed from 'next/router'
import Link from 'next/link';  // Added for client-side navigation
import './Register.css';

export default function RegisterPage() {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');  // Always redirect to home after successful registration
    } catch (error: any) {
      console.error('Error registering user:', error.message);
    }
  };

  // Rest of your component code...
  

  return (
    <div className='registerContainer'>
      <div className='logoNloginContainer'>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
        <h1>Sign Up to ArticleBite</h1>
        <h2>
          Already Signed Up?
          <Link href='/login'>Login</Link>
        </h2>
      </div>

      <div className='signupInputFormContainer'>
        <form onSubmit={handleRegister}>
          <div className='inputField'>
            <label htmlFor='fullName'>Full Name</label>
            <input
              type='text'
              id='fullName'
              placeholder='Enter your full name'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className='inputField'>
            <label htmlFor='email'>E-Mail</label>
            <input
              type='email'
              id='email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='inputField'>
            <label htmlFor='password'>Password</label>
            <div className='passwordInput'>
              <input
                type={passwordVisible ? 'text' : 'password'}
                id='password'
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type='button' className='togglePassword' onClick={togglePasswordVisibility}>
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className='submitButton'>
            <button type='submit'>Sign Up</button>
          </div>
        </form>
      </div>
    </div>
  );
}