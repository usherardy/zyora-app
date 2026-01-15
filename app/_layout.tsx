import { useEffect, useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import { onAuthStateChange, firebaseUserToProfile } from '@/lib/firebase';
import '../global.css';

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
  const hasNavigated = useRef(false);

  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      setAppReady(true);
    };
    init();

    // Listen to Firebase auth state changes (important for web)
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        const profile = firebaseUserToProfile(firebaseUser);
        setUser({
          uid: profile.uid,
          displayName: profile.displayName,
          email: profile.email,
          photoURL: profile.photoURL,
          quota: 0,
          maxQuota: 10,
        });
      } else {
        // User signed out from Firebase
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (user && !inAuthGroup) {
      // User is signed in but not in tabs, redirect to tabs
      router.replace('/(tabs)/studio');
    } else if (!user && inAuthGroup) {
      // User is not signed in but trying to access tabs, redirect to login
      router.replace('/');
    }
  }, [user, isLoading, segments, navigationState?.key]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontStyle: 'italic' }}>Zyora</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
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
      </Stack>
    </GestureHandlerRootView>
  );
}
