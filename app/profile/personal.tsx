import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const updatedUser = {
      ...user,
      displayName: displayName.trim() || user.displayName,
      email: email.trim() || user.email,
      photoURL: photoURL || user.photoURL,
    };
    
    setUser(updatedUser);
    
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Profile updated successfully');
    }, 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, color: '#000' }}>
            Personal Info
          </Text>
          <Text style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            Edit Your Details
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity onPress={handlePickImage} style={{ position: 'relative' }}>
            <View style={{ padding: 4 }}>
              {/* Corner Brackets */}
              <View style={{ position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
              <View style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRightWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
              <View style={{ position: 'absolute', bottom: 4, left: 4, width: 16, height: 16, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
              <View style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
              
              <View style={{ width: 120, height: 120, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 40, color: '#D1D5DB', fontStyle: 'italic' }}>
                      {displayName?.[0] || 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', padding: 8, borderRadius: 100 }}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
            Tap to Change
          </Text>
        </View>

        {/* Form Fields */}
        <View style={{ gap: 24 }}>
          {/* Display Name */}
          <View>
            <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#D1D5DB"
              style={{
                backgroundColor: '#F9FAFB',
                borderBottomWidth: 2,
                borderBottomColor: '#000',
                paddingVertical: 16,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#000',
              }}
            />
          </View>

          {/* Email */}
          <View>
            <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#D1D5DB"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: '#F9FAFB',
                borderBottomWidth: 2,
                borderBottomColor: '#000',
                paddingVertical: 16,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#000',
              }}
            />
          </View>

          {/* User ID (Read Only) */}
          <View>
            <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              User ID
            </Text>
            <View style={{ backgroundColor: '#F9FAFB', paddingVertical: 16, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#9CA3AF' }}>
                {user?.uid || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.9}
          style={{
            marginTop: 40,
            backgroundColor: '#000',
            paddingVertical: 18,
            alignItems: 'center',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase' }}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

