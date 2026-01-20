import { useEffect, useState } from 'react';
import { View, Text, Platform, StatusBar } from 'react-native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [appReady, setAppReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      setAppReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !appReady || hasNavigated) return;

    if (!isLoading && user) {
      setHasNavigated(true);
      router.replace('/(tabs)/studio');
    }
  }, [user, isLoading, navigationState?.key, appReady, hasNavigated]);

  if (!appReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontStyle: 'italic' }}>
          Zyora
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {Platform.OS !== 'web' && (
        <StatusBar barStyle="light-content" />
      )}

      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="generate"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{ headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
