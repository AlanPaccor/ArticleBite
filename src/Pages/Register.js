import React, { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/Register.css';

export default function Register() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Store current location before any navigation
    localStorage.setItem('previousLocation', location.pathname);
  }, [location]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Check previous location and redirect
      const previousLocation = localStorage.getItem('previousLocation');
      if (previousLocation === '/register' || previousLocation === '/login') {
        navigate('/'); // Redirect to homepage if coming from login or register
      } else if (previousLocation) {
        navigate(previousLocation); // Redirect to the last visited page
      } else {
        navigate('/'); // Default redirect
      }
    } catch (error) {
      console.error('Error registering user:', error.message);
    }
  };

  return (
    <div className='registerContainer'>
      <div className='logoNloginContainer'>
        <div xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </div>
        <h1>Sign Up to ArticleBite</h1>
        <h2>
          Already Signed Up?
          <a href='/login'>Login</a>
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
