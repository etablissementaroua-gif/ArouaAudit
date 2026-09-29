import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Secondary Firebase app configuration connecting to the live 'arouaschools'
 * production project (aroua-hero) to synchronize accredited staff, teachers and drivers.
 */
const arouaSchoolsConfig = {
  apiKey: "AIzaSyDKdmZ5aB8Mufe_xw9SIbhnS_6w-mUYhXE",
  authDomain: "aroua-hero.firebaseapp.com",
  projectId: "aroua-hero",
  storageBucket: "aroua-hero.firebasestorage.app",
  messagingSenderId: "779180499091",
  appId: "1:779180499091:web:70efde9e8a3cc05a70ed66",
  databaseURL: "https://aroua-hero-default-rtdb.firebaseio.com"
};

const APP_NAME = 'arouaSchoolsApp';

let appInstance: FirebaseApp;
let dbInstance: Firestore;

try {
  const existingApp = getApps().find(a => a.name === APP_NAME);
  appInstance = existingApp || initializeApp(arouaSchoolsConfig, APP_NAME);
  dbInstance = getFirestore(appInstance);
} catch (err) {
  console.warn('[arouaSchoolsFirebase] Secondary Firebase app notice:', err);
  appInstance = getApps().length > 0 ? getApp() : initializeApp(arouaSchoolsConfig, APP_NAME);
  dbInstance = getFirestore(appInstance);
}

export const arouaSchoolsApp = appInstance;
export const arouaSchoolsDb = dbInstance;

export const isArouaSchoolsConfigured = (): boolean => {
  return Boolean(arouaSchoolsConfig.apiKey && arouaSchoolsConfig.projectId);
};
