import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First, try to complete the auth session
        // This tells expo-auth-session that the user has returned from the OAuth provider
        const result = await WebBrowser.maybeCompleteAuthSession();
        console.log('OAuth session completion result:', result);
        
        // maybeCompleteAuthSession will return true if it handled the redirect
        // If it returns true, the auth response will be captured in the Google.useAuthRequest hook
        // and we should just stay on this screen briefly then return to the main app
        if (result?.type === 'success' || result?.type === 'dismiss') {
          // Give expo-auth-session time to process and return the response
          setTimeout(() => {
            router.replace('/');
          }, 100);
        } else {
          // If maybeCompleteAuthSession didn't handle this, go back to home
          setTimeout(() => {
            router.replace('/');
          }, 500);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setTimeout(() => {
          router.replace('/');
        }, 500);
      }
    };

    // Only run this once when the component mounts
    handleCallback();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={{ marginTop: 16, color: '#666' }}>Completing sign in...</Text>
    </View>
  );
}
