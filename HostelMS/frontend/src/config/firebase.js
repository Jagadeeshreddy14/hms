import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDummyKeyForInitializationOnly',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'srisrinivasa-hostel.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'srisrinivasa-hostel',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'srisrinivasa-hostel.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * 1-Click Google Sign-In / Sign-Up
 */
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      success: true,
      user: {
        name: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        uid: user.uid,
      },
    };
  } catch (error) {
    console.error('Firebase Google Auth Error:', error);
    return {
      success: false,
      error: error.message || 'Google sign in was cancelled or failed.',
    };
  }
};
