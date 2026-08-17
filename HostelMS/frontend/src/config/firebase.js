import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDUcDxLRDAMtmuvwXLDrLG2MEl7hOdGeGc',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sri-srinivasa-boys-hoste-8e404.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sri-srinivasa-boys-hoste-8e404',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sri-srinivasa-boys-hoste-8e404.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '915670897560',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:915670897560:web:1a5bbb750e5424007c91ed',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-XX096RM64Z',
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

/**
 * Firebase Email Registration with Automated Verification Email
 */
export const firebaseRegisterWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Send official Google verification email
    try {
      await sendEmailVerification(user);
    } catch (verifErr) {
      console.warn('Firebase Email Verification dispatch warning:', verifErr);
    }
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
      },
    };
  } catch (error) {
    console.error('Firebase Email Register Error:', error);
    let errorMsg = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'Password must be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'Please provide a valid email address.';
    }
    return { success: false, error: errorMsg };
  }
};

/**
 * Firebase Email Login
 */
export const firebaseLoginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
      },
    };
  } catch (error) {
    console.error('Firebase Email Login Error:', error);
    let errorMsg = error.message;
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMsg = 'Invalid email or password.';
    }
    return { success: false, error: errorMsg };
  }
};

/**
 * Firebase Password Reset Email
 */
export const firebaseResetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Firebase Password Reset Error:', error);
    return { success: false, error: error.message || 'Failed to send reset email' };
  }
};
