import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import '../global.css';

export default function RootLayout() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [appReady, setAppReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      setAppReady(true);
    };
    init();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!navigationState?.key) return;
    if (!isLoading && user && !isNavigating) {
      setIsNavigating(true);
      router.replace('/(tabs)/studio');
    } else if (!isLoading && !user && isNavigating) {
      setIsNavigating(false);
      router.replace('/');
    }
  }, [user, isLoading, navigationState?.key, isNavigating]);

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
