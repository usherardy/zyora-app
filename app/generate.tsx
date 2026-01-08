import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { generateLook, uriToBase64 } from '@/lib/api';

type GenerationStatus = 'loading' | 'success' | 'error';

export default function GenerateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userImg, fitImg, incrementQuota, addSavedLook } = useAuthStore();

  const [status, setStatus] = useState<GenerationStatus>('loading');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const hasRunRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const generate = async () => {
      try {
        if (!userImg || !fitImg) {
          throw new Error('Missing images');
        }

        const interval = setInterval(() => {
          setProgress((prev) => (prev < 90 ? prev + 0.5 : prev));
        }, 100);

        const [userBase64, fitBase64] = await Promise.all([
          userImg.base64 || uriToBase64(userImg.uri),
          fitImg.base64 || uriToBase64(fitImg.uri),
        ]);

        const response = await generateLook(userBase64, fitBase64);

        clearInterval(interval);
        setProgress(100);

        if (response.success && response.image) {
          setResult(response.image);
          setStatus('success');
          incrementQuota();

          addSavedLook({
            id: Date.now().toString(),
            image: response.image,
            createdAt: Date.now(),
            userImageUri: userImg.uri,
            fitImageUri: fitImg.uri,
          });
        } else {
          throw new Error(response.error || 'Failed to generate look');
        }
      } catch (error: any) {
        console.error('Generation error:', error);
        setStatus('error');
        setErrorMsg(error.message || 'Something went wrong during generation.');
      }
    };

    generate();
  }, []);

  const handleDownload = async () => {
    if (!result) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images.');
        return;
      }

      const filename = `zyora-look-${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(fileUri);

      Alert.alert('Saved!', 'Look saved to your photo library.');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleShare = async () => {
    if (!result) return;

    try {
      await Share.share({
        message: 'Check out my new look created with Zyora!',
        url: result,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={handleBack}
        style={{
          position: 'absolute',
          left: 24,
          top: insets.top + 16,
          zIndex: 20,
          width: 44,
          height: 44,
          backgroundColor: status === 'success' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
          borderWidth: 1,
          borderColor: status === 'success' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={status === 'success' ? '#fff' : '#000'}
        />
      </TouchableOpacity>

      {/* Loading State */}
      {status === 'loading' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FAFAFA' }}>
          {/* Stacked Cards */}
          <View style={{ width: 240, aspectRatio: 3/4, position: 'relative', marginBottom: 48 }}>
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#fff',
                borderRadius: 32,
                transform: [{ rotate: '6deg' }, { scale: 0.9 }],
                opacity: 0.6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              {fitImg && (
                <Image
                  source={{ uri: fitImg.uri }}
                  style={{ width: '100%', height: '100%', borderRadius: 32, opacity: 0.5 }}
                  contentFit="cover"
                />
              )}
            </View>

            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#fff',
                borderRadius: 32,
                transform: [{ rotate: '-6deg' }, { scale: 0.95 }],
                opacity: 0.8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
              }}
            >
              {userImg && (
                <Image
                  source={{ uri: userImg.uri }}
                  style={{ width: '100%', height: '100%', borderRadius: 32, opacity: 0.5 }}
                  contentFit="cover"
                />
              )}
            </View>

            <Animated.View 
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                transform: [{ scale: pulseAnim }],
                backgroundColor: '#000',
                borderRadius: 32,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }}
              />
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
                <Ionicons name="sparkles" size={32} color="#fff" />
              </View>
            </Animated.View>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text
              style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 28, color: '#111', marginBottom: 8 }}
            >
              Crafting Look
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>
              AI is redesigning your outfit
            </Text>
          </View>

          <View style={{ width: 256, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: '#000',
                borderRadius: 2,
                width: `${progress}%`,
              }}
            />
          </View>
          <Text style={{ marginTop: 16, color: '#D1D5DB', fontSize: 11 }}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}

      {/* Error State */}
      {status === 'error' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FAFAFA' }}>
          <View style={{ width: 64, height: 64, backgroundColor: '#FEF2F2', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text
            style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, color: '#111', marginBottom: 8 }}
          >
            Generation Failed
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', maxWidth: 280, marginBottom: 32 }}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              backgroundColor: '#000',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 100,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold', marginLeft: 8 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success State */}
      {status === 'success' && result && (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <Image
            source={{ uri: result }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={500}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 32,
              paddingTop: 128,
              paddingBottom: insets.bottom + 32,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 36, color: '#fff', marginBottom: 8 }}
                >
                  New Look
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 8 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Generated Successfully
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity
                  onPress={handleDownload}
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#fff',
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  activeOpacity={0.9}
                >
                  <Ionicons name="download" size={22} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.9}
                >
                  <Ionicons name="share-social" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}
