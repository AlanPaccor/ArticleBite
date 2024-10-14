import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { auth, db };
