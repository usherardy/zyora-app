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
  Pressable,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { createShadow } from '@/lib/styles';
import { useGoogleAuth, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '@/lib/auth';

const { width, height } = Dimensions.get('window');

// Teal/green fashion background image
// const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1976&auto=format&fit=crop';
const BACKGROUND_IMAGE = require('../assets/images/enter.png');

type AuthModalView = 'options' | 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigationState = useRootNavigationState();
  const { user, isLoading, signInAsDeveloper, signInWithGoogle: storeSignInWithGoogle, signInWithEmail: storeSignInWithEmail, loadFromStorage } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
  };

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

  const handleSignIn = async () => {
    // Reset errors
    setEmailError(false);
    setPasswordError(false);

    if (!email || !password) {
      if (!email) setEmailError(true);
      if (!password) setPasswordError(true);
      showNotification('Please enter both email and password');
      return;
    }

    try {
      setIsSigningIn(true);
      const userProfile = await signInWithEmail(email, password);
      if (userProfile) {
        storeSignInWithEmail(userProfile);
        setIsNavigating(true);
        setShowAuthModal(false);
        router.replace('/(tabs)/studio');
      }
    } catch (error: any) {
      console.error('Email sign in failed:', error);

      // Set error styling on both fields for auth failures
      setEmailError(true);
      setPasswordError(true);

      let errorMessage = 'Invalid email or password';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Try again later';
      }

      showNotification(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async () => {
    // Reset errors
    setEmailError(false);
    setPasswordError(false);

    if (!email || !password) {
      if (!email) setEmailError(true);
      if (!password) setPasswordError(true);
      showNotification('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setPasswordError(true);
      showNotification('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSigningIn(true);
      const userProfile = await signUpWithEmail(email, password);
      if (userProfile) {
        storeSignInWithEmail(userProfile);
        setIsNavigating(true);
        setShowAuthModal(false);
        router.replace('/(tabs)/studio');
      }
    } catch (error: any) {
      console.error('Email sign up failed:', error);

      // Set error styling based on error type
      let errorMessage = 'Could not create account';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
        setEmailError(true);
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email';
        setEmailError(true);
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
        setPasswordError(true);
      } else {
        // Generic error - highlight both
        setEmailError(true);
        setPasswordError(true);
      }

      showNotification(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert(
        'Password Reset',
        'A password reset email has been sent to your email address.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Password reset failed:', error);
      let errorMessage = 'Failed to send password reset email.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }

      Alert.alert('Password Reset Failed', errorMessage);
    }
  };

  const handleDevSignIn = () => {
    if (isNavigating) return;
    signInAsDeveloper();
    setIsNavigating(true);
    setShowAuthModal(false);
    router.replace('/(tabs)/studio');
  };

  // Helper to switch views and reset state
  const switchAuthView = (view: AuthModalView) => {
    setAuthModalView(view);
    setEmail('');
    setPassword('');
    setEmailError(false);
    setPasswordError(false);
    setNotification(null);
  };

  const closeModal = () => {
    setShowAuthModal(false);
    switchAuthView('options');
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
        source={BACKGROUND_IMAGE}
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
          pointerEvents: showAuthModal ? 'none' : 'auto',
        }}
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
            ...createShadow('#FFFFFF', 0, 0, 0.15, 40, 0),
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
            source={BACKGROUND_IMAGE}
            style={{ position: 'absolute', width, height }}
            resizeMode="cover"
          />

          {/* Dark Overlay */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Pressable onPress={() => Platform.OS !== 'web' && Keyboard.dismiss()} style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>

                {/* Notification Popup - Enhanced Design */}
                {notification && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: 60,
                      left: 20,
                      right: 20,
                      backgroundColor: notification.type === 'error' ? '#1A1A1A' : '#FFFFFF',
                      borderRadius: 16,
                      padding: 18,
                      zIndex: 100,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: notification.type === 'error' ? '#EF4444' : 'rgba(34, 197, 94, 0.3)',
                      shadowColor: notification.type === 'error' ? "#EF4444" : "#22C55E",
                      shadowOffset: {
                        width: 0,
                        height: 8,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 16,
                      elevation: 12,
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14
                    }}>
                      <Ionicons
                        name={notification.type === 'error' ? "close-circle" : "checkmark-circle"}
                        size={24}
                        color={notification.type === 'error' ? "#EF4444" : "#22C55E"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: notification.type === 'error' ? '#EF4444' : '#22C55E',
                        fontSize: 11,
                        fontWeight: 'bold',
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginBottom: 4
                      }}>
                        {notification.type === 'error' ? 'Oops!' : 'Success'}
                      </Text>
                      <Text style={{
                        color: notification.type === 'error' ? '#FFFFFF' : '#374151',
                        fontSize: 14,
                        fontWeight: '500'
                      }}>
                        {notification.message}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setNotification(null)}
                      style={{
                        padding: 8,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Ionicons name="close" size={16} color={notification.type === 'error' ? '#888' : '#9CA3AF'} />
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* Auth Options View */}
                {authModalView === 'options' && (
                  <View>
                    {/* Sign In Button */}
                    <TouchableOpacity
                      onPress={() => switchAuthView('signin')}
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
                      onPress={() => switchAuthView('signup')}
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
                        JOIN ZYORA
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
                      <TouchableOpacity onPress={() => switchAuthView('options')} style={{ marginRight: 16 }}>
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
                      <Text style={{ color: emailError ? '#EF4444' : 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontWeight: emailError ? 'bold' : 'normal' }}>
                        {emailError ? 'EMAIL ADDRESS' : 'EMAIL'}
                      </Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={email}
                          onChangeText={(text) => { setEmail(text); setEmailError(false); }}
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
                            borderColor: emailError ? '#EF4444' : 'rgba(255,255,255,0.2)',
                            color: emailError ? '#EF4444' : '#FFFFFF',
                            fontSize: 15,
                          }}
                        />
                        {emailError && (
                          <View style={{ position: 'absolute', right: 16, top: 16 }}>
                            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 32 }}>
                      <Text style={{ color: passwordError ? '#EF4444' : 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontWeight: passwordError ? 'bold' : 'normal' }}>
                        {passwordError ? 'PASSWORD' : 'PASSWORD'}
                      </Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={password}
                          onChangeText={(text) => { setPassword(text); setPasswordError(false); }}
                          placeholder="••••••••"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          secureTextEntry
                          style={{
                            width: '100%',
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderWidth: 1,
                            borderColor: passwordError ? '#EF4444' : 'rgba(255,255,255,0.2)',
                            color: passwordError ? '#EF4444' : '#FFFFFF',
                            fontSize: 15,
                          }}
                        />
                        {passwordError && (
                          <View style={{ position: 'absolute', right: 16, top: 16 }}>
                            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} style={{ marginBottom: 24 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', letterSpacing: 1 }}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <TouchableOpacity
                      onPress={handleSignIn}
                      disabled={isSigningIn}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isSigningIn ? 0.6 : 1,
                      }}
                    >
                      {isSigningIn ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                          SIGN IN
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sign Up Form View */}
                {authModalView === 'signup' && (
                  <View>
                    {/* Back Button and Title */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
                      <TouchableOpacity onPress={() => switchAuthView('options')} style={{ marginRight: 16 }}>
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
                        Join Zyora
                      </Text>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ color: emailError ? '#EF4444' : 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontWeight: emailError ? 'bold' : 'normal' }}>
                        {emailError ? 'EMAIL ADDRESS' : 'EMAIL'}
                      </Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={email}
                          onChangeText={(text) => { setEmail(text); setEmailError(false); }}
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
                            borderColor: emailError ? '#EF4444' : 'rgba(255,255,255,0.2)',
                            color: emailError ? '#EF4444' : '#FFFFFF',
                            fontSize: 15,
                          }}
                        />
                        {emailError && (
                          <View style={{ position: 'absolute', right: 16, top: 16 }}>
                            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 32 }}>
                      <Text style={{ color: passwordError ? '#EF4444' : 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontWeight: passwordError ? 'bold' : 'normal' }}>
                        {passwordError ? 'PASSWORD' : 'PASSWORD'}
                      </Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={password}
                          onChangeText={(text) => { setPassword(text); setPasswordError(false); }}
                          placeholder="••••••••"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          secureTextEntry
                          style={{
                            width: '100%',
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderWidth: 1,
                            borderColor: passwordError ? '#EF4444' : 'rgba(255,255,255,0.2)',
                            color: passwordError ? '#EF4444' : '#FFFFFF',
                            fontSize: 15,
                          }}
                        />
                        {passwordError && (
                          <View style={{ position: 'absolute', right: 16, top: 16 }}>
                            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Create Account Button */}
                    <TouchableOpacity
                      onPress={handleSignUp}
                      disabled={isSigningIn}
                      activeOpacity={0.9}
                      style={{
                        width: '100%',
                        paddingVertical: 18,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isSigningIn ? 0.6 : 1,
                      }}
                    >
                      {isSigningIn ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '500', letterSpacing: 2 }}>
                          JOIN ZYORA
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
