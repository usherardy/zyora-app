import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Dimensions, Platform, Alert } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { user, isLoading, signInAsDeveloper, loadFromStorage } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Only navigate when navigation is ready and user exists
  useEffect(() => {
    if (!navigationState?.key) return;
    if (!isLoading && user && !isNavigating) {
      setIsNavigating(true);
      router.replace('/(tabs)/studio');
    }
  }, [user, isLoading, navigationState?.key, isNavigating]);

  const handleGoogleSignIn = async () => {
    // Google Auth requires proper OAuth setup in Google Cloud Console
    // For now, show a message and redirect to Developer Mode
    Alert.alert(
      'Google Sign-In',
      'Google authentication requires OAuth configuration. Please use Developer Mode for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use Developer Mode', onPress: handleDevSignIn },
      ]
    );
  };

  const handleDevSignIn = () => {
    if (isNavigating) return;
    signInAsDeveloper();
    setIsNavigating(true);
    router.replace('/(tabs)/studio');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Background */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2574&auto=format&fit=crop' }}
        style={{ position: 'absolute', width: width * 1.1, height: height * 1.1, top: -height * 0.05, left: -width * 0.05 }}
        resizeMode="cover"
      />

      {/* Gradient Overlay - Darker for better contrast */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.98)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
      />

      {/* Content - Ensure it's above gradient */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 32, paddingBottom: 48, zIndex: 10 }}>
        {/* Logo Section */}
        <View style={{ marginBottom: 48 }}>
          {/* Logo Icon */}
          <View 
            style={{
              width: 64,
              height: 64,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              transform: [{ rotate: '-3deg' }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 36, fontStyle: 'italic', color: '#000000' }}>Z</Text>
          </View>

          {/* Brand Name - Fully opaque white */}
          <Text 
            style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
              fontSize: 56, 
              color: '#FFFFFF',
              letterSpacing: 2,
              textShadowColor: 'rgba(0,0,0,0.8)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 10,
              fontWeight: '600',
            }}
          >
            ZYORA
          </Text>

          {/* Divider - More visible */}
          <View style={{ height: 2, width: 48, backgroundColor: '#FFFFFF', opacity: 0.8, marginVertical: 16, borderRadius: 1 }} />

          {/* Tagline - Fully opaque */}
          <Text 
            style={{ 
              color: '#FFFFFF', 
              fontSize: 12, 
              textTransform: 'uppercase',
              letterSpacing: 6,
              opacity: 1,
            }}
          >
            Virtual Stylist
          </Text>
        </View>

        {/* Sign In Buttons - Completely solid, no animation opacity */}
        <View style={{ zIndex: 20 }}>
          {/* Google Sign In Button - Completely solid white */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            style={{
              width: '100%',
              paddingVertical: 18,
              backgroundColor: '#FFFFFF',
              borderRadius: 100,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Ionicons name="logo-google" size={20} color="#000000" />
            <Text 
              style={{ 
                color: '#000000', 
                fontSize: 14, 
                fontWeight: '700', 
                textTransform: 'uppercase',
                marginLeft: 12,
                letterSpacing: 2,
              }}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Developer Mode Button - More prominent */}
          <TouchableOpacity
            onPress={handleDevSignIn}
            activeOpacity={0.8}
            style={{
              width: '100%',
              paddingVertical: 18,
              backgroundColor: '#FDE047',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              borderRadius: 100,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#FDE047',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Ionicons name="flash" size={18} color="#000000" />
            <Text 
              style={{ 
                color: '#000000', 
                fontSize: 13, 
                textTransform: 'uppercase',
                marginLeft: 12,
                letterSpacing: 3,
                fontWeight: '700',
              }}
            >
              Developer Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 32 }}>
          <Text 
            style={{ 
              textAlign: 'center', 
              color: '#FFFFFF', 
              fontSize: 10, 
              textTransform: 'uppercase',
              letterSpacing: 2,
              opacity: 0.8,
            }}
          >
            Powered by AI • Virtual Try-On
          </Text>
        </View>
      </View>
    </View>
  );
}
