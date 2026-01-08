import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [notifications, setNotifications] = useState(true);
  const [saveToGallery, setSaveToGallery] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const SettingRow = ({ 
    icon, 
    label, 
    sub, 
    value, 
    onToggle 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    sub: string; 
    value: boolean; 
    onToggle: (val: boolean) => void;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
        <Ionicons name={icon} size={20} color="#000" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#000', fontSize: 14 }}>{label}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>{sub}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#000' }}
        thumbColor="#fff"
      />
    </View>
  );

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
            Preferences
          </Text>
          <Text style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            App Settings
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* General Section */}
        <View style={{ paddingTop: 24 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginLeft: 24, marginBottom: 12 }}>
            General
          </Text>
          <View style={{ backgroundColor: '#F9FAFB' }}>
            <SettingRow
              icon="notifications-outline"
              label="Push Notifications"
              sub="Get notified when generation completes"
              value={notifications}
              onToggle={setNotifications}
            />
            <SettingRow
              icon="moon-outline"
              label="Dark Mode"
              sub="Use dark theme throughout the app"
              value={darkMode}
              onToggle={setDarkMode}
            />
          </View>
        </View>

        {/* Generation Section */}
        <View style={{ paddingTop: 32 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginLeft: 24, marginBottom: 12 }}>
            Generation
          </Text>
          <View style={{ backgroundColor: '#F9FAFB' }}>
            <SettingRow
              icon="download-outline"
              label="Auto-Save to Gallery"
              sub="Automatically save generated looks"
              value={saveToGallery}
              onToggle={setSaveToGallery}
            />
            <SettingRow
              icon="sparkles-outline"
              label="High Quality Output"
              sub="Generate higher resolution images (slower)"
              value={highQuality}
              onToggle={setHighQuality}
            />
          </View>
        </View>

        {/* Storage Section */}
        <View style={{ paddingTop: 32, paddingHorizontal: 24 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            Storage
          </Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Cache Size</Text>
              <Text style={{ color: '#000', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>24.5 MB</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#000', paddingVertical: 14, alignItems: 'center' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
                Clear Cache
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={{ paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            About
          </Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Version</Text>
              <Text style={{ color: '#000', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>1.0.0</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Build</Text>
              <Text style={{ color: '#000', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>2024.01</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>SDK</Text>
              <Text style={{ color: '#000', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>Expo 52</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

