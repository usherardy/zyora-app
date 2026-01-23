import { useEffect, useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/store/authStore';
import { onAuthStateChange, firebaseUserToProfile } from '@/lib/firebase';
import { ENDPOINTS } from '@/constants';
import '../global.css';

// Fetch user credits from backend
const fetchUserCredits = async (userId: string) => {
  try {
    const response = await fetch(`${ENDPOINTS.GET_USER_CREDITS}?userId=${userId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('[Layout] Failed to fetch user credits:', error);
  }
  return null;
};

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
      if (firebaseUser) {
        const profile = firebaseUserToProfile(firebaseUser);

        // Fetch user data from backend (includes credits + profile)
        const userData = await fetchUserCredits(profile.uid);
        
        setUser({
          uid: profile.uid,
          // Prefer backend data, fallback to Firebase auth data
          displayName: userData?.displayName || profile.displayName,
          email: userData?.email || profile.email,
          photoURL: userData?.photoURL || profile.photoURL,
          quota: userData?.quota || 0,
          maxQuota: userData?.maxQuota || 5,
          currentPlan: userData?.currentPlan || 'free',
        });
        
        console.log('[Layout] User logged in with data:', userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!navigationState?.key || isLoading || !appReady) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const isLoginRoute = segments.length < 1 || !segments[0];

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
