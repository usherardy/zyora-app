import { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Alert, Platform, Animated, StatusBar, Modal, Share } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useAuthStore } from '@/store/authStore';
import { fetchUserLooks } from '@/lib/storageService';
import { deleteLook, deleteAllUserLooks } from '@/lib/deletionService';

const { width, height } = Dimensions.get('window');
const GAP = 12;
const ITEM_WIDTH = (width - GAP * 3) / 2;

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [firestoreLooks, setFirestoreLooks] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch looks from Firestore on component mount
  useEffect(() => {
    const loadLooks = async () => {
      if (user) {
        try {
          const looks = await fetchUserLooks(user.uid);
          setFirestoreLooks(looks);
        } catch (error) {
          console.error('Error loading looks from Firestore:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadLooks();
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSaveImage = async (imageUrl: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos.');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `zyora_${Date.now()}.png`;
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Image saved to your gallery.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleDelete = (look: any, fromModal = false) => {
    Alert.alert(
      'Delete Look',
      'This look will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                if (look.firestoreId) {
                  await deleteLook(user.uid, look);
                  setFirestoreLooks(prev => prev.filter(l => l.firestoreId !== look.firestoreId));
                }
                if (fromModal) setSelectedImage(null);
              }
            } catch (error) {
              console.error('Error deleting look:', error);
            }
          },
        },
      ]
    );
  };

  const handleShare = async (imageUrl: string) => {
    try {
      await Share.share({
        url: imageUrl,
        message: 'Check out my look from ZYORA!',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAll = () => {
    if (firestoreLooks.length === 0) return;

    Alert.alert(
      'Clear Vault',
      'Delete all saved looks? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (user) {
                await deleteAllUserLooks(user.uid);
                setFirestoreLooks([]);
              }
            } catch (error) {
              console.error('Error deleting all looks:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setSelectedImage(item)}
      style={{
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.5,
        backgroundColor: '#f0f0f0',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: GAP, // Add vertical spacing
      }}
    >
      <Image
        source={{ uri: item.imageUrl || item.image }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
      />

      {/* Subtle Delete Overlay Button */}
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="trash-outline" size={14} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const hasItems = firestoreLooks.length > 0;
  const itemCount = firestoreLooks.length;



  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <StatusBar barStyle="dark-content" />

      {/* Minimalist Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          paddingTop: insets.top + 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
          backgroundColor: '#FAFAFA',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB', // Separator line
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text
              style={{
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                fontSize: 42,
                color: '#111',
                letterSpacing: -1.5,
                lineHeight: 48,
              }}
            >
              Vault
            </Text>

          </View>

          <TouchableOpacity onPress={handleDeleteAll} disabled={!hasItems}>
            <Text style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1,
              marginTop: 12,
              opacity: hasItems ? 1 : 0,
              color: '#111'
            }}>
              • {String(itemCount).padStart(2, '0')} LOOKS
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#000', fontSize: 10, letterSpacing: 2 }}>LOADING</Text>
        </View>
      ) : !hasItems ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
            fontSize: 24,
            color: '#111',
            marginBottom: 8
          }}>
            Vault Empty
          </Text>
          <Text style={{
            fontSize: 10,
            color: '#666',
            letterSpacing: 1.5,
            textTransform: 'uppercase'
          }}>
            YOUR GENERATED LOOKS WILL APPEAR HERE
          </Text>
        </View>
      ) : (
        <FlatList
          data={firestoreLooks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ paddingHorizontal: GAP, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        />
      )}

      {/* Full Screen Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={{ position: 'absolute', top: insets.top + 20, right: 20, zIndex: 50, padding: 8 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {selectedImage && (
            <View style={{ width: '100%', height: '80%' }}>
              <Image
                source={{ uri: selectedImage.imageUrl || selectedImage.image }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>
          )}

          {/* Action Bar */}
          <View style={{
            position: 'absolute',
            bottom: insets.bottom + 20,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 32
          }}>
            <TouchableOpacity onPress={() => handleSaveImage(selectedImage.imageUrl || selectedImage.image)} style={{ alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Ionicons name="download-outline" size={20} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 10 }}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleShare(selectedImage.imageUrl || selectedImage.image)} style={{ alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Ionicons name="share-social-outline" size={20} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 10 }}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDelete(selectedImage, true)} style={{ alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3F1111', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </View>
              <Text style={{ color: '#FF6B6B', fontSize: 10 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
