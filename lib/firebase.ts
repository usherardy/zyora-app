import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
  UserCredential
} from 'firebase/auth';
// @ts-ignore - React Native persistence
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

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // Use persistence for React Native
  // Note: getReactNativePersistence has issues with Expo Go on iOS
  // For production, use a development build or switch to @react-native-firebase
  if (Platform.OS !== 'web') {
    try {
      // On iOS with Expo Go, skip custom persistence to avoid type errors
      if (Platform.OS === 'ios' && __DEV__) {
        auth = getAuth(app);
      } else {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      }
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
    console.log('=== Firebase Sign In ===');
    
    let finalIdToken = idToken;
    
    // If idToken looks like an access token (starts with ya29), fetch the actual ID token
    if (idToken?.startsWith?.('ya29') && accessToken) {
      console.log('Received access token instead of ID token, attempting to fetch ID token...');
      try {
        // Try to get ID token from Google's tokeninfo endpoint
        const tokenInfoResponse = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + idToken);
        const tokenInfo = await tokenInfoResponse.json();
        console.log('Token info:', tokenInfo);
        
        // If we got a valid access token, we need to exchange it for an ID token
        // This requires a backend call for web - for now, we'll use an alternative approach
        console.warn('Direct access token to ID token exchange requires backend. Consider using Firebase Web SDK Auth flow.');
      } catch (e) {
        console.error('Failed to fetch token info:', e);
      }
    }
    
    console.log('Creating credential with idToken:', finalIdToken?.slice(0, 20) + '...');
    const credential = GoogleAuthProvider.credential(finalIdToken, accessToken);
    console.log('Credential created:', credential);
    console.log('Signing in with Firebase...');
    const userCredential = await signInWithCredential(auth, credential);
    console.log('Firebase sign in successful:', userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error('Firebase sign in error:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    throw error;
  }
}

// Sign in with Google using Firebase's native web flow (for web platform)
export async function signInWithGoogleWeb() {
  try {
    console.log('=== Firebase Google Sign In (Web) ===');
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    const userCredential = await signInWithPopup(auth, provider);
    console.log('Firebase Google sign in successful:', userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error('Firebase Google sign in error:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
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
