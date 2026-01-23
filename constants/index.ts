// API Configuration
// For development: use EXPO_PUBLIC_API_URL from .env or default to device-specific URL
// For production: defaults to Vercel deployment
const isDev = process.env.NODE_ENV !== 'production' || __DEV__;

// Get the correct API URL for the current platform
// Always use production Vercel backend for AI generation (has Vertex AI credentials)
const getApiBaseUrl = () => {
  // Always use production backend - has Vertex AI credentials configured
  console.log('[Constants] Using production Vercel backend');
  return 'https://zyora-app1.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Debug: Log the API URL
console.log(`[Constants] API_BASE_URL: ${API_BASE_URL}`);

// API Endpoints - Vercel serverless functions use /api/ prefix
export const ENDPOINTS = {
  GENERATE_LOOK: `${API_BASE_URL}/api/generate-look`,
  FETCH_IMAGE: `${API_BASE_URL}/api/fetch-image`,
  EXCHANGE_TOKEN: `${API_BASE_URL}/api/exchange-token`,
  HEALTH: `${API_BASE_URL}/api/health`,
  CREATE_PAYMENT_INTENT: `${API_BASE_URL}/api/create-payment-intent`,
  CREATE_CHECKOUT_SESSION: `${API_BASE_URL}/api/create-checkout-session`,
  VERIFY_CHECKOUT_SESSION: `${API_BASE_URL}/api/verify-checkout-session`,
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

// Google Sign-In Config - uses environment variables
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

// Stripe Config
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// App Constants
export const MAX_FREE_QUOTA = 5;
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
