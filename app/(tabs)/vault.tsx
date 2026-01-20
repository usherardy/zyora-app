import { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Alert, Platform, Animated, Modal, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { downloadAsync, documentDirectory } from 'expo-file-system/legacy';
import { useAuthStore } from '@/store/authStore';
import { SavedLook } from '@/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 8) / 2;

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { savedLooks, removeSavedLook } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedImage, setSelectedImage] = useState<SavedLook | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Look',
      'Are you sure you want to delete this look?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeSavedLook(id);
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const handleImagePress = (item: SavedLook) => {
    setSelectedImage(item);
    setModalVisible(true);
  };

  const handleSaveToDevice = async () => {
    if (!selectedImage) return;

    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to save images to your device.');
        return;
      }

      // Download image to local file with proper extension
      const fileName = `look_${Date.now()}.jpg`;
      const fileUri = documentDirectory + fileName;
      const { uri } = await downloadAsync(selectedImage.image, fileUri);
      
      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Alert.alert('Success', 'Look saved to your device!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save the look to your device.');
    }
  };

  const renderItem = ({ item, index }: { item: SavedLook; index: number }) => (
    <TouchableOpacity 
      style={{ width: ITEM_SIZE, position: 'relative', padding: 4 }}
      onPress={() => handleImagePress(item)}
      activeOpacity={0.8}
    >
      {/* Corner Brackets */}
      <View style={{ position: 'absolute', top: 4, left: 4, width: 12, height: 12, borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
      <View style={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRightWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
      <View style={{ position: 'absolute', bottom: 4, left: 4, width: 12, height: 12, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
      <View style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
      
      <View style={{ aspectRatio: 3 / 4, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={300}
        />
        
      {/* Bottom info */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 8,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
          <Text style={{ color: '#fff', fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 }}>
            LOOK_{String(index + 1).padStart(2, '0')}.JPG
          </Text>
          <TouchableOpacity onPress={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}>
            <Ionicons name="trash-outline" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }}>
      {/* Crosshair */}
      <View style={{ position: 'relative', width: 48, height: 48, marginBottom: 24 }}>
        <View style={{ position: 'absolute', left: 23, top: 0, width: 1, height: 48, backgroundColor: '#D1D5DB' }} />
        <View style={{ position: 'absolute', top: 23, left: 0, width: 48, height: 1, backgroundColor: '#D1D5DB' }} />
      </View>
      
      <Text
        style={{ 
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
          fontSize: 24, 
          fontStyle: 'italic',
          color: '#D1D5DB', 
          marginBottom: 8 
        }}
      >
        Empty Archive
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', lineHeight: 18, letterSpacing: 1, textTransform: 'uppercase' }}>
        Your woven looks will appear here
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          backgroundColor: '#000000',
        }}
      >
        <View>
          <Text
            style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
              fontSize: 32, 
              color: '#fff',
              letterSpacing: -1,
            }}
          >
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
            Vault
          </Text>
        </View>
        
        <Text style={{ 
          fontSize: 9, 
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', 
          color: '#fff',
        }}>
          {savedLooks.length} ITEMS
        </Text>
      </Animated.View>

      {savedLooks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={savedLooks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 }}
          columnWrapperStyle={{ gap: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Image Viewer Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOOK DETAILS</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Image */}
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedImage.image }}
                  style={styles.fullImage}
                  contentFit="contain"
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => selectedImage && handleDelete(selectedImage.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#000',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
