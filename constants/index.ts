// API Configuration
// Two separate backends:
// - STRIPE_API_URL: Stripe payments, user credits, profile management
// - VERTEX_API_URL: Vertex AI image generation

// Stripe & User Management Backend
export const STRIPE_API_URL = 'https://zyora-backend-livid.vercel.app';

// Vertex AI Image Generation Backend
export const VERTEX_API_URL = 'https://zyora-szo7.vercel.app';

// Debug: Log the API URLs
console.log(`[Constants] STRIPE_API_URL: ${STRIPE_API_URL}`);
console.log(`[Constants] VERTEX_API_URL: ${VERTEX_API_URL}`);

// API Endpoints
export const ENDPOINTS = {
  // Vertex AI endpoints (image generation)
  GENERATE_LOOK: `${VERTEX_API_URL}/api/generate-look`,
  FETCH_IMAGE: `${VERTEX_API_URL}/api/fetch-image`,
  EXCHANGE_TOKEN: `${VERTEX_API_URL}/api/exchange-token`,
  HEALTH_VERTEX: `${VERTEX_API_URL}/api/health`,
  
  // Stripe & User Management endpoints (no /api/ prefix - routes go to root)
  HEALTH: `${STRIPE_API_URL}/health`,
  CREATE_PAYMENT_INTENT: `${STRIPE_API_URL}/create-payment-intent`,
  CREATE_CHECKOUT_SESSION: `${STRIPE_API_URL}/create-checkout-session`,
  VERIFY_CHECKOUT_SESSION: `${STRIPE_API_URL}/verify-checkout-session`,
  UPDATE_PROFILE: `${STRIPE_API_URL}/update-profile`,
  GET_USER_CREDITS: `${STRIPE_API_URL}/get-user-credits`,
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
