import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { fetchImageFromUrl } from '@/lib/api';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = (height - 350) / 2;

export default function StudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userImg, setUserImg, fitImg, setFitImg } = useAuthStore();
  const [fitUrlValue, setFitUrlValue] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const isReady = !!userImg && !!fitImg;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate button when both images are ready
  useEffect(() => {
    if (isReady) {
      Animated.parallel([
        Animated.spring(buttonSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(buttonSlide, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isReady]);

  const pickImage = async (type: 'user' | 'fit') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newImage = {
        id: Date.now().toString(),
        uri: asset.uri,
        type,
        date: Date.now(),
        base64: asset.base64,
      };

      if (type === 'user') {
        setUserImg(newImage);
      } else {
        setFitImg(newImage);
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!fitUrlValue.trim()) return;

    if (!fitUrlValue.match(/^https?:\/\/.+/i)) {
      Alert.alert('Invalid URL', 'Please enter a valid image URL');
      return;
    }

    setIsLoadingUrl(true);
    try {
      const imageData = await fetchImageFromUrl(fitUrlValue);
      if (imageData) {
        setFitImg({
          id: Date.now().toString(),
          uri: imageData,
          type: 'fit',
          date: Date.now(),
        });
        setFitUrlValue('');
      } else {
        Alert.alert('Error', 'Failed to load image from URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load image from URL');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleGenerate = () => {
    if (!isReady) return;
    
    if (user && user.quota >= user.maxQuota) {
      Alert.alert(
        'Quota Reached',
        "You've reached your free limit. Upgrade to generate more looks."
      );
      return;
    }

    router.push('/generate');
  };

  const renderViewfinder = (type: 'user' | 'fit', image: typeof userImg) => {
    const hasImage = !!image;
    const label = type === 'user' ? 'Subject' : 'Garment';
    const number = type === 'user' ? '1' : '2';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => !hasImage && pickImage(type)}
        style={{ flex: 1, padding: 4 }}
      >
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Corner Brackets */}
          <View style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRightWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />

          {/* Inner Content */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#F9FAFB',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {hasImage ? (
              <>
                <Image
                  source={{ uri: image.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={300}
                />
                
                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => type === 'user' ? setUserImg(null) : setFitImg(null)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>

                {/* Bottom Label */}
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {label.toUpperCase()}_01.JPG
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                {/* Crosshair */}
                <View style={{ position: 'relative', width: 32, height: 32, marginBottom: 16 }}>
                  <View style={{ position: 'absolute', left: 15, top: 0, width: 1, height: 32, backgroundColor: '#D1D5DB' }} />
                  <View style={{ position: 'absolute', top: 15, left: 0, width: 32, height: 1, backgroundColor: '#D1D5DB' }} />
                </View>
                
                <Text style={{ 
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
                  fontSize: 32, 
                  color: '#D1D5DB',
                  fontStyle: 'italic',
                  marginBottom: 8,
                }}>
                  {number}
                </Text>
                <Text style={{ 
                  fontSize: 9, 
                  letterSpacing: 3, 
                  textTransform: 'uppercase', 
                  color: '#9CA3AF',
                  fontWeight: '500',
                }}>
                  Add {label}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Editorial Top Bar */}
      <View 
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <View>
          <Text style={{ 
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
            fontSize: 32, 
            color: '#000',
            letterSpacing: -1,
          }}>
            ZYORA
          </Text>
          <Text style={{ 
            fontSize: 9, 
            color: '#9CA3AF', 
            fontWeight: 'bold',
            letterSpacing: 4, 
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            Studio
          </Text>
        </View>

        {/* Quota Indicator */}
        {user && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#9CA3AF', marginBottom: 4 }}>
              QUOTA
            </Text>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View 
                  key={i} 
                  style={{ 
                    width: 4, 
                    height: 12, 
                    backgroundColor: i < (user.maxQuota - user.quota) ? '#000' : '#E5E7EB',
                  }} 
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Grid */}
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            flexDirection: 'row', 
            marginTop: 24,
            height: CARD_HEIGHT * 1.4,
            gap: 16,
          }}
        >
          {renderViewfinder('user', userImg)}
          
          <View style={{ flex: 1 }}>
            {renderViewfinder('fit', fitImg)}
            
            {/* URL Input */}
            {!fitImg && (
              <View 
                style={{ 
                  marginTop: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                }}
              >
                <Ionicons name="link" size={14} color="#9CA3AF" />
                <TextInput
                  value={fitUrlValue}
                  onChangeText={setFitUrlValue}
                  placeholder="PASTE LINK"
                  placeholderTextColor="#D1D5DB"
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 11,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    letterSpacing: 1,
                  }}
                  onSubmitEditing={handleUrlSubmit}
                  returnKeyType="go"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={handleUrlSubmit}
                  disabled={!fitUrlValue.trim() || isLoadingUrl}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={fitUrlValue.trim() ? '#000' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Pro Tip */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            marginTop: 24,
            backgroundColor: '#F9FAFB',
            borderLeftWidth: 2,
            borderLeftColor: '#000',
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <Ionicons name="scan-outline" size={18} color="#000" />
          <Text style={{ 
            flex: 1,
            fontSize: 10, 
            lineHeight: 16,
            letterSpacing: 1, 
            textTransform: 'uppercase', 
            color: '#6B7280',
          }}>
            Ensure subject is clearly visible. Garment should be isolated for optimal weaving.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Weave Look Button - Pops up from bottom */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 100 + insets.bottom,
          left: 0,
          right: 0,
          alignItems: 'center',
          opacity: buttonOpacity,
          transform: [{ translateY: buttonSlide }],
        }}
        pointerEvents={isReady ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={handleGenerate}
          activeOpacity={0.9}
          style={{
            paddingHorizontal: 48,
            paddingVertical: 20,
            borderRadius: 100,
            backgroundColor: '#000',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.3,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="sparkles" size={16} color="#C4B5FD" />
            <Text 
              style={{ 
                color: '#fff', 
                fontSize: 11, 
                fontWeight: 'bold',
                letterSpacing: 3, 
                textTransform: 'uppercase',
              }}
            >
              Weave Look
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
