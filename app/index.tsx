import { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions, 
  Platform, 
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useGoogleAuth, signInWithGoogle } from '@/lib/auth';

const { width, height } = Dimensions.get('window');

// Teal/green fashion background image
const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1976&auto=format&fit=crop';

type AuthModalView = 'options' | 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigationState = useRootNavigationState();
  const { user, isLoading, signInAsDeveloper, signInWithGoogle: storeSignInWithGoogle, loadFromStorage } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Google Auth hook
  const { request, response, promptAsync } = useGoogleAuth();

  // Floating animation for logo
  const floatAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFromStorage();
    
    // Start floating animation - slow 6 second loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleAuthSuccess(authentication.idToken, authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (idToken: string, accessToken?: string | null) => {
    try {
      setIsSigningIn(true);
      const userProfile = await signInWithGoogle(idToken, accessToken || undefined);
      if (userProfile) {
        storeSignInWithGoogle(userProfile);
        setIsNavigating(true);
        setShowAuthModal(false);
        router.replace('/(tabs)/studio');
      }
    } catch (error) {
      console.error('Google sign in failed:', error);
      Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Hide logo when modal is shown
  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: showAuthModal ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showAuthModal]);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (!isLoading && user && !isNavigating) {
      setIsNavigating(true);
      router.replace('/(tabs)/studio');
    }
  }, [user, isLoading, navigationState?.key, isNavigating]);

  const handleEnterStudio = () => {
    setShowAuthModal(true);
    setAuthModalView('options');
  };

  const handleGoogleSignIn = async () => {
    if (!request) {
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In is not configured. Please use Developer Mode for now.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Developer Mode', onPress: handleDevSignIn },
        ]
      );
      return;
    }
    
    try {
      setIsSigningIn(true);
      await promptAsync();
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to initiate Google Sign-In');
      setIsSigningIn(false);
    }
  };

  const handleSignIn = () => {
    // For now, use developer mode
    handleDevSignIn();
  };

  const handleDevSignIn = () => {
    if (isNavigating) return;
    signInAsDeveloper();
    setIsNavigating(true);
    setShowAuthModal(false);
    router.replace('/(tabs)/studio');
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setAuthModalView('options');
    setEmail('');
    setPassword('');
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
      {/* Background Image */}
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE }}
        style={{ position: 'absolute', width, height }}
        resizeMode="cover"
      />

      {/* Top Dark Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.35, zIndex: 1 }}
      />

      {/* Bottom Dark Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.55, zIndex: 1 }}
      />

      {/* Floating Animated Logo - Top Right */}
      <Animated.View 
        style={{ 
          position: 'absolute', 
          top: insets.top + 48, 
          right: 32, 
          zIndex: 10,
          alignItems: 'flex-end',
          opacity: logoOpacity,
          transform: [{ translateY: floatAnim }],
        }}
        pointerEvents={showAuthModal ? 'none' : 'auto'}
      >
        {/* Circular Logo with glow effect */}
        <View 
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            shadowColor: '#FFFFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 40,
          }}
        >
          <Text 
            style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
              fontSize: 48, 
              color: '#FFFFFF',
              fontStyle: 'italic',
              paddingRight: 4,
            }}
          >
            Z
          </Text>
        </View>
        <Text 
          style={{ 
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            fontSize: 18, 
            color: '#FFFFFF',
            letterSpacing: 6,
            marginTop: 12,
            fontWeight: '500',
            opacity: 0.9,
          }}
        >
          ZYORA
        </Text>
      </Animated.View>

      {/* Main Content */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 32, paddingBottom: insets.bottom + 48, zIndex: 10 }}>
        {/* Hero Text - Large 72px Bodoni Moda style serif italic */}
        <View style={{ marginBottom: 48 }}>
          <Text 
            style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
              fontSize: 72, 
              color: '#FFFFFF',
              fontStyle: 'italic',
              lineHeight: 68,
              letterSpacing: -2,
              opacity: 0.9,
            }}
          >
            Virtually
          </Text>
          <Text 
            style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
              fontSize: 72, 
              color: '#FFFFFF',
              fontStyle: 'italic',
              lineHeight: 68,
              letterSpacing: -2,
              opacity: 0.9,
            }}
          >
            Yours.
          </Text>
          
          {/* Tagline with horizontal line accent */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <View style={{ width: 48, height: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginRight: 16 }} />
            <Text 
              style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: 11, 
                letterSpacing: 4,
                fontWeight: '300',
                textTransform: 'uppercase',
              }}
            >
              The AI Stylist
            </Text>
          </View>
        </View>

        {/* Enter Studio Button */}
        <TouchableOpacity
          onPress={handleEnterStudio}
          activeOpacity={0.9}
          style={{
            width: '100%',
            paddingVertical: 20,
            backgroundColor: '#FFFFFF',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
          }}
        >
          <Text 
            style={{ 
              color: '#000000', 
              fontSize: 13, 
              fontWeight: '500', 
              letterSpacing: 3,
            }}
          >
            ENTER STUDIO
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Auth Modal */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1 }}>
          {/* Background Image in Modal */}
          <ImageBackground
            source={{ uri: BACKGROUND_IMAGE }}
            style={{ position: 'absolute', width, height }}
            resizeMode="cover"
          />
          
          {/* Dark Overlay */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
                
                {/* Auth Options View */}
                {authModalView === 'options' && (
                  <View>
                    {/* Sign In Button */}
                    <TouchableOpacity
                      onPress={() => setAuthModalView('signin')}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: '#FFFFFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons name="mail-outline" size={18} color="#000000" style={{ marginRight: 12 }} />
                      <Text style={{ color: '#000000', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                        SIGN IN
                      </Text>
                    </TouchableOpacity>

                    {/* Create Account Button */}
                    <TouchableOpacity
                      onPress={() => setAuthModalView('signup')}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.5)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                        CREATE ACCOUNT
                      </Text>
                    </TouchableOpacity>

                    {/* OR Divider */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginHorizontal: 16 }}>OR</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    </View>

                    {/* Google Button */}
                    <TouchableOpacity
                      onPress={handleGoogleSignIn}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: '#4285F4',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                      }}
                    >
                      <Ionicons name="logo-google" size={18} color="#FFFFFF" style={{ marginRight: 12 }} />
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                        GOOGLE
                      </Text>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, textAlign: 'center', letterSpacing: 2 }}>
                        CANCEL
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sign In Form View */}
                {authModalView === 'signin' && (
                  <View>
                    {/* Back Button and Title */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
                      <TouchableOpacity onPress={() => setAuthModalView('options')} style={{ marginRight: 16 }}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text 
                        style={{ 
                          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
                          fontSize: 32, 
                          color: '#FFFFFF',
                          fontStyle: 'italic',
                        }}
                      >
                        Welcome Back
                      </Text>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
                        EMAIL
                      </Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="name@example.com"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          width: '100%',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: '#FFFFFF',
                          fontSize: 15,
                        }}
                      />
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 32 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
                        PASSWORD
                      </Text>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry
                        style={{
                          width: '100%',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: '#FFFFFF',
                          fontSize: 15,
                        }}
                      />
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                      onPress={handleSignIn}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#000000', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                        SIGN IN
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sign Up Form View */}
                {authModalView === 'signup' && (
                  <View>
                    {/* Back Button and Title */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
                      <TouchableOpacity onPress={() => setAuthModalView('options')} style={{ marginRight: 16 }}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text 
                        style={{ 
                          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
                          fontSize: 32, 
                          color: '#FFFFFF',
                          fontStyle: 'italic',
                        }}
                      >
                        Create Account
                      </Text>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
                        EMAIL
                      </Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="name@example.com"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          width: '100%',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: '#FFFFFF',
                          fontSize: 15,
                        }}
                      />
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 32 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
                        PASSWORD
                      </Text>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry
                        style={{
                          width: '100%',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: '#FFFFFF',
                          fontSize: 15,
                        }}
                      />
                    </View>

                    {/* Create Account Button */}
                    <TouchableOpacity
                      onPress={handleSignIn}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#000000', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                        CREATE ACCOUNT
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
