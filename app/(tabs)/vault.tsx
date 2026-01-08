import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Alert, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { SavedLook } from '@/types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 8) / 2;

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { savedLooks, removeSavedLook } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
          onPress: () => removeSavedLook(id),
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: SavedLook; index: number }) => (
    <View style={{ width: ITEM_SIZE, position: 'relative', padding: 4 }}>
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
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
        }}
      >
        <View>
          <Text
            style={{ 
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
              fontSize: 32, 
              color: '#000',
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
          color: '#9CA3AF',
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
    </View>
  );
}
