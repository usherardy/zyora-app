// API Configuration
export const API_BASE_URL = 'https://zyora-szo7.vercel.app';

// API Endpoints
export const ENDPOINTS = {
  GENERATE_LOOK: `${API_BASE_URL}/generate-look`,
  FETCH_IMAGE: `${API_BASE_URL}/fetch-image`,
  EXCHANGE_TOKEN: `${API_BASE_URL}/exchange-token`,
  HEALTH: `${API_BASE_URL}/health`,
};

// Firebase Config - Replace with your actual config
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Google Sign-In Config
export const GOOGLE_WEB_CLIENT_ID = '61715353016-3gus22f2fn3ms300g36a74kbim8181uu.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '';
export const GOOGLE_ANDROID_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;

// App Constants
export const MAX_FREE_QUOTA = 10;
export const MAX_IMAGE_SIZE_MB = 10;
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'zyora:user',
  LOOKS_COUNT: 'zyora:looks:count',
  SAVED_LOOKS: 'zyora:saved_looks',
  DEV_MODE: 'zyora:dev_mode',
};

// Colors
export const COLORS = {
  primary: '#000000',
  secondary: '#FFFFFF',
  accent: '#FFD700',
  background: '#FAFAFA',
  text: {
    primary: '#000000',
    secondary: '#737373',
    muted: '#A3A3A3',
    inverse: '#FFFFFF',
  },
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};
