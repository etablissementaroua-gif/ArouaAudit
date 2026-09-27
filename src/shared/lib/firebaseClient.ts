import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC5J4-ND0ltdRrJy1DubvjkI4fcoCODo2g',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'arouaaudit.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'arouaaudit',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'arouaaudit.firebasestorage.app',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:88500991746:web:bf5f776c2e66cbd762b41b',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '88500991746',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};
