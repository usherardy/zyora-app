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
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
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

let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeFirebaseAuth(app);
  db = getFirestore(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

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

/* ===========================
   Firestore Database Functions
   =========================== */

// User credits/quota data structure
export interface UserCredits {
  uid: string;
  email: string | null;
  quota: number;           // Used generations
  maxQuota: number;        // Total available generations
  freeCredits: number;     // Free credits (default 5)
  paidCredits: number;     // Credits purchased
  totalGenerations: number; // Lifetime total generations
  createdAt: any;
  updatedAt: any;
}

// Payment record structure
export interface PaymentRecord {
  uid: string;
  sessionId: string;
  planId: string;
  amount: number;
  quota: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: any;
}

// Generation record structure
export interface GenerationRecord {
  uid: string;
  generationId: string;
  imageUrl?: string;       // Optional: store image URL if using cloud storage
  userImageUri?: string;
  fitImageUri?: string;
  createdAt: any;
  status: 'success' | 'failed';
}

// Get user credits from Firestore
export async function getUserCredits(uid: string): Promise<UserCredits | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserCredits;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error getting user credits:', error);
    return null;
  }
}

// Create or update user credits in Firestore
export async function saveUserCredits(uid: string, data: Partial<UserCredits>): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new user document with full schema
      await setDoc(userRef, {
        uid,
        email: data.email || null,
        quota: data.quota || 0,
        maxQuota: data.maxQuota || 5,
        freeCredits: 5,
        paidCredits: 0,
        totalGenerations: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log('[Firestore] User credits saved for:', uid);
    return true;
  } catch (error) {
    console.error('[Firestore] Error saving user credits:', error);
    return false;
  }
}

// Update user quota after generation (increment used credits and total generations)
export async function incrementUserQuota(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentQuota = data.quota || 0;
      const totalGenerations = data.totalGenerations || 0;
      
      await updateDoc(userRef, {
        quota: currentQuota + 1,
        totalGenerations: totalGenerations + 1,
        updatedAt: serverTimestamp(),
      });
      console.log('[Firestore] Quota incremented for user:', uid, '- used:', currentQuota + 1, '- total generations:', totalGenerations + 1);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Firestore] Error incrementing quota:', error);
    return false;
  }
}

// Add credits after payment (tracks paid credits separately)
export async function addUserCredits(uid: string, creditsToAdd: number, email?: string | null): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentMaxQuota = data.maxQuota || 5;
      const currentPaidCredits = data.paidCredits || 0;
      
      await updateDoc(userRef, {
        maxQuota: currentMaxQuota + creditsToAdd,
        paidCredits: currentPaidCredits + creditsToAdd,
        updatedAt: serverTimestamp(),
      });
      console.log('[Firestore] Added', creditsToAdd, 'paid credits for user:', uid, '- new total:', currentMaxQuota + creditsToAdd, '- paid:', currentPaidCredits + creditsToAdd);
      return true;
    } else {
      // User doesn't exist yet - create them with the new credits
      console.log('[Firestore] User not found, creating with credits:', creditsToAdd);
      await setDoc(userRef, {
        uid,
        email: email || null,
        quota: 0,
        maxQuota: 5 + creditsToAdd,
        freeCredits: 5,
        paidCredits: creditsToAdd,
        totalGenerations: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('[Firestore] Created user with', 5 + creditsToAdd, 'total credits (', creditsToAdd, 'paid)');
      return true;
    }
  } catch (error) {
    console.error('[Firestore] Error adding credits:', error);
    return false;
  }
}

// Record a payment
export async function recordPayment(payment: Omit<PaymentRecord, 'createdAt'>): Promise<string | null> {
  try {
    const paymentsRef = collection(db, 'payments');
    const docRef = await addDoc(paymentsRef, {
      ...payment,
      createdAt: serverTimestamp(),
    });
    console.log('[Firestore] Payment recorded:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Firestore] Error recording payment:', error);
    return null;
  }
}

// Record a generation (saves generation history)
export async function recordGeneration(generation: Omit<GenerationRecord, 'createdAt'>): Promise<string | null> {
  try {
    const generationsRef = collection(db, 'generations');
    const docRef = await addDoc(generationsRef, {
      ...generation,
      createdAt: serverTimestamp(),
    });
    console.log('[Firestore] Generation recorded:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Firestore] Error recording generation:', error);
    return null;
  }
}

// Get user's generation history
export async function getUserGenerations(uid: string, limit = 50): Promise<GenerationRecord[]> {
  try {
    const { query, where, orderBy, getDocs, limit: limitFn } = await import('firebase/firestore');
    const generationsRef = collection(db, 'generations');
    const q = query(
      generationsRef,
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), generationId: doc.id } as GenerationRecord));
  } catch (error) {
    console.error('[Firestore] Error getting generations:', error);
    return [];
  }
}
