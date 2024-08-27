import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Firestore import
import { getDatabase } from 'firebase/database'; // Realtime Database import
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJxNkfBoAL4JSDnZd1hakXuoK50CcRWxc",
  authDomain: "malon-50ccc.firebaseapp.com",
  projectId: "malon-50ccc",
  storageBucket: "malon-50ccc.appspot.com",
  messagingSenderId: "889150600955",
  appId: "1:889150600955:web:d959b2ad10dca4319ca25e",
  measurementId: "G-LT4QBS5M2K"
  
};

// Initialize Firebase app
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error('Error initializing Firebase Auth:', error);
    throw error;
  }
}

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Realtime Database
const database = getDatabase(app);

export { auth, firestore, database };
