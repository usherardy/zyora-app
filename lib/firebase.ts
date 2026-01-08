import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
// @ts-ignore - React Native persistence
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyNAMAdGiMcyEDbe1TlsGtaHUuBJYYqg4",
  authDomain: "wsas-cf268.firebaseapp.com",
  projectId: "wsas-cf268",
  storageBucket: "wsas-cf268.firebasestorage.app",
  messagingSenderId: "61715353016",
  appId: "1:61715353016:web:a7457b1268b2d461cc534d",
  measurementId: "G-SWSK7MDFJW"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // Use persistence for React Native
  if (Platform.OS !== 'web') {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      // Auth already initialized
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };

// Sign in with Google credential
export async function signInWithGoogleCredential(idToken: string, accessToken?: string) {
  try {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase sign in error:', error);
    throw error;
  }
}

// Sign out
export async function signOutFromFirebase() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Firebase sign out error:', error);
    throw error;
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Convert Firebase user to app user profile
export function firebaseUserToProfile(user: User) {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}
