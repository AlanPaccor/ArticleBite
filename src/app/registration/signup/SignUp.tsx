"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore'; // Firestore functions
import Link from 'next/link';
import { auth, db } from '@/app/lib/firebase-config';

export const metadata = {
  title: "Sign Up - Simple",
  description: "Page description",
};

export default function RegisterPage() {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>(''); // Add username state
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        username, // Save username
        createdAt: new Date(),
      });

      router.push('/userdashboard');  // Redirect to dashboard after successful registration
    } catch (error: any) {
      console.error('Error registering user:', error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Create your account</h1>
      </div>
      
      <div className="w-full max-w-md">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input w-full py-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              placeholder="corybarker@email.com"
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
                placeholder="••••••••"
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

          <div className="mt-6 space-y-3">
            <button type="submit" className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow hover:bg-blue-600 py-2">
              Register
            </button>
            <div className="text-center text-sm italic text-gray-400">Or</div>
            <button type="button" className="btn w-full bg-gradient-to-t from-gray-900 to-gray-700 text-white shadow hover:bg-gray-800 py-2">
              Continue with GitHub
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By signing up, you agree to the{" "}
            <a href="#0" className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#0" className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
