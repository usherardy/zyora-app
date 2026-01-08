import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import '../global.css';

export default function RootLayout() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadFromStorage();
      setAppReady(true);
    };
    init();
  }, []);

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
