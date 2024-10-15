import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

export const firebaseConfig = {
  apiKey: publicRuntimeConfig.FIREBASE_API_KEY,
  authDomain: publicRuntimeConfig.FIREBASE_AUTH_DOMAIN,
  projectId: publicRuntimeConfig.FIREBASE_PROJECT_ID,
  storageBucket: publicRuntimeConfig.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: publicRuntimeConfig.FIREBASE_MESSAGING_SENDER_ID,
  appId: publicRuntimeConfig.FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth: Auth = getAuth(app);
