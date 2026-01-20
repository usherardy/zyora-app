import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, ENDPOINTS } from '@/constants';
import { 
  signInWithGoogleCredential,
  signInWithGoogleWeb as firebaseSignInWithGoogleWeb,
  signOutFromFirebase, 
  firebaseUserToProfile,
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  resetPassword as firebaseResetPassword
} from './firebase';

WebBrowser.maybeCompleteAuthSession();

// Suppress COOP warning on web
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Suppress specific warnings
    const message = args[0];
    if (message?.includes?.('Cross-Origin-Opener-Policy') || 
        message?.includes?.('shadow') ||
        message?.includes?.('useNativeDriver')) {
      return;
    }
    originalWarn(...args);
  };
}

const redirectUrl = (() => {
  if (Platform.OS === 'web') {
    return __DEV__ 
      ? 'http://localhost:8081/auth/callback' 
      : 'https://your-production-domain.com/auth/callback';
  }
  // For native, use a custom scheme
  return 'com.zyora.app://';
})();

// Google OAuth configuration hook
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    // Add 'openid' to scopes to get ID token on web
    scopes: ['profile', 'email', 'openid'],
    redirectUri: redirectUrl,
    // For web, request both code and ID token
    ...(Platform.OS === 'web' && { responseType: 'id_token token' }),
  });

  return {
    request,
    response,
    promptAsync,
  };
};

// Sign in with Google and Firebase
export async function signInWithGoogle(idToken: string, accessToken?: string) {
  try {
    const firebaseUser = await signInWithGoogleCredential(idToken, accessToken);
    return firebaseUserToProfile(firebaseUser);
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

// Sign in with Google using Firebase's native web flow
export async function signInWithGoogleForWeb() {
  try {
    const firebaseUser = await firebaseSignInWithGoogleWeb();
    return firebaseUserToProfile(firebaseUser);
  } catch (error) {
    console.error('Google web sign in error:', error);
    throw error;
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const firebaseUser = await firebaseSignInWithEmail(email, password);
    return firebaseUserToProfile(firebaseUser);
  } catch (error) {
    console.error('Email sign in error:', error);
    throw error;
  }
}

// Create account with email and password
export async function signUpWithEmail(email: string, password: string) {
  try {
    const firebaseUser = await firebaseSignUpWithEmail(email, password);
    return firebaseUserToProfile(firebaseUser);
  } catch (error) {
    console.error('Email sign up error:', error);
    throw error;
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  try {
    await firebaseResetPassword(email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

// Sign out from Firebase
export async function signOut() {
  try {
    await signOutFromFirebase();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Exchange Google token for Firebase custom token (if using backend auth)
export async function exchangeTokenForFirebase(googleAccessToken: string): Promise<string | null> {
  try {
    const response = await fetch(ENDPOINTS.EXCHANGE_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: googleAccessToken }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const data = await response.json();
    return data.customToken;
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
}

// Get user info from Google
export async function getGoogleUserInfo(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await response.json();
    
    return {
      uid: userInfo.id,
      displayName: userInfo.name,
      email: userInfo.email,
      photoURL: userInfo.picture,
    };
  } catch (error) {
    console.error('Get user info error:', error);
    return null;
  }
}
