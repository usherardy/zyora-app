import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  User,
  Auth,
  UserCredential
} from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in firebase/auth but not in types
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration - uses environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

function initializeFirebaseAuth(firebaseApp: FirebaseApp): Auth {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(firebaseApp, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      });
    }
    // Use getReactNativePersistence for native platforms
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Auth already initialized, return existing instance
    return getAuth(firebaseApp);
  }
}

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeFirebaseAuth(app);
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

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email sign in error:', error);
    throw error;
  }
}

// Create account with email and password
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email sign up error:', error);
    throw error;
  }
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}
