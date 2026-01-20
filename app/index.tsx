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
import { useGoogleAuth, signInWithGoogle, signInWithGoogleForWeb, signInWithEmail, signUpWithEmail, resetPassword } from '@/lib/auth';

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
    console.log('OAuth response received:', response);
    if (response?.type === 'success') {
      console.log('OAuth success! Response:', response);
      const { authentication } = response;
      console.log('Authentication object:', authentication);
      console.log('Authentication keys:', Object.keys(authentication || {}));
      console.log('Full authentication:', JSON.stringify(authentication, null, 2));
      
      // Check for idToken in different possible locations
      const idToken = authentication?.idToken || authentication?.id_token;
      const accessToken = authentication?.accessToken || authentication?.access_token;
      
      console.log('idToken found:', !!idToken);
      console.log('accessToken found:', !!accessToken);
      console.log('accessToken:', accessToken?.slice(0, 50) + '...');
      
      if (idToken) {
        console.log('idToken found, calling handleGoogleAuthSuccess');
        handleGoogleAuthSuccess(idToken, accessToken);
      } else {
        console.error('No idToken available in OAuth response - cannot authenticate with Firebase');
      }
    } else if (response?.type === 'error') {
      console.error('OAuth error:', response.params?.error, response.params?.error_description);
    } else if (response?.type === 'dismiss') {
      console.log('OAuth dismissed by user');
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (idToken: string, accessToken?: string | null) => {
    try {
      setIsSigningIn(true);
      console.log('=== Google Sign-In Flow Started ===');
      console.log('idToken:', idToken?.slice(0, 20) + '...');
      console.log('accessToken:', accessToken ? accessToken.slice(0, 20) + '...' : 'none');
      
      const userProfile = await signInWithGoogle(idToken, accessToken || undefined);
      console.log('Sign-in successful, user profile:', userProfile);
      
      if (userProfile) {
        console.log('Calling storeSignInWithGoogle with:', userProfile);
        storeSignInWithGoogle(userProfile);
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Closing auth modal and navigating to studio...');
        setIsNavigating(true);
        setShowAuthModal(false);
        
        // Use a small delay to ensure state updates before navigation
        setTimeout(() => {
          console.log('Navigating to studio...');
          router.replace('/(tabs)/studio');
        }, 300);
      } else {
        console.error('No user profile returned from sign-in');
        Alert.alert('Sign In Failed', 'Could not complete sign-in. Please try again.');
        setIsSigningIn(false);
      }
    } catch (error: any) {
      console.error('Google sign in failed:', error);
      Alert.alert(
        'Sign In Failed', 
        `${error?.message || 'Could not sign in with Google. Please try again.'}`
      );
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
    try {
      setIsSigningIn(true);
      
      // On web, use Firebase's native sign-in popup (simpler and provides ID token)
      if (Platform.OS === 'web') {
        console.log('Using Firebase native Google sign-in for web');
        const userProfile = await signInWithGoogleForWeb();
        console.log('Sign-in successful, user profile:', userProfile);
        
        if (userProfile) {
          console.log('Calling storeSignInWithGoogle with:', userProfile);
          storeSignInWithGoogle(userProfile);
          
          // Wait a moment for state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('Closing auth modal and navigating to studio...');
          setIsNavigating(true);
          setShowAuthModal(false);
          
          // Use a small delay to ensure state updates before navigation
          setTimeout(() => {
            console.log('Navigating to studio...');
            router.replace('/(tabs)/studio');
          }, 300);
        } else {
          throw new Error('No user profile returned from sign-in');
        }
      } else {
        // On native, use expo-auth-session
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
        
        await promptAsync();
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error?.message || 'Failed to sign in with Google. Please try again.'
      );
      setIsSigningIn(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
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
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
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
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      Alert.alert('Sign Up Failed', errorMessage);
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
            Style. 
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
            Simplified. 
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
            Virtually. 
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
              Your AI Stylist
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
                          CREATE ACCOUNT
                        </Text>
                      )}
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
