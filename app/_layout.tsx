import { useEffect, useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

import { useAuthStore } from '@/store/authStore';
import { onAuthStateChange, firebaseUserToProfile, getUserCredits, saveUserCredits } from '@/lib/firebase';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen may already be hidden
});

export default function RootLayout() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadFromStorage();
      } catch (e) {
        console.warn('Load from storage error:', e);
      } finally {
        setAppReady(true);
        // Hide splash screen immediately after app is ready
        SplashScreen.hideAsync().catch(() => { });
      }
    };
    init();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      // Get current stored user to preserve quota if same user
      const currentUser = useAuthStore.getState().user;

      if (firebaseUser) {
        const profile = firebaseUserToProfile(firebaseUser);
        const isSameUser = currentUser?.uid === profile.uid;

        // Set user with local defaults first for instant UI
        setUser({
          uid: profile.uid,
          displayName: profile.displayName,
          email: profile.email,
          photoURL: profile.photoURL,
          quota: isSameUser ? (currentUser?.quota || 0) : 0,
          maxQuota: isSameUser ? (currentUser?.maxQuota || 5) : 5,
        });

        // Sync with Firestore in background
        try {
          console.log('[Auth] Syncing user with Firestore:', profile.uid);
          const firestoreCredits = await getUserCredits(profile.uid);
          
          if (firestoreCredits) {
            // User exists in Firestore - use their credits
            console.log('[Auth] Found user in Firestore:', firestoreCredits.quota, '/', firestoreCredits.maxQuota);
            setUser({
              uid: profile.uid,
              displayName: profile.displayName,
              email: profile.email,
              photoURL: profile.photoURL,
              quota: firestoreCredits.quota,
              maxQuota: firestoreCredits.maxQuota,
            });
          } else {
            // New user - create in Firestore
            console.log('[Auth] Creating new user in Firestore');
            await saveUserCredits(profile.uid, {
              email: profile.email,
              quota: 0,
              maxQuota: 5,
            });
          }
        } catch (error) {
          console.error('[Auth] Firestore sync error:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle deep links for Stripe callback
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('[DeepLink] Received URL:', event.url);
      const parsed = Linking.parse(event.url);
      const path = parsed.path || '';
      const queryParams = parsed.queryParams || {};
      
      if (path.includes('stripe-callback') || event.url.includes('stripe-callback')) {
        console.log('[DeepLink] Navigating to stripe-callback with params:', queryParams);
        router.push({
          pathname: '/stripe-callback',
          params: queryParams as Record<string, string>,
        });
      }
    };

    // Handle deep link if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLink] Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!navigationState?.key || isLoading || !appReady) return;

    const firstSegment = segments[0] as string | undefined;
    const inTabsGroup = firstSegment === '(tabs)';
    const isLoginRoute = !firstSegment || firstSegment === 'index';
    const isStripeCallback = firstSegment === 'stripe-callback';
    const isPricing = firstSegment === 'pricing';

    // Don't redirect if on stripe-callback or pricing page
    if (isStripeCallback || isPricing) return;

    if (user && isLoginRoute) {
      router.replace('/(tabs)/studio');
    } else if (!user && inTabsGroup) {
      router.replace('/');
    }
  }, [user, isLoading, segments, navigationState?.key, appReady]);

  // Show loading screen while initializing
  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="generate"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="pricing"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="stripe-callback"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
