import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  route: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, isDevMode } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => { 
            await signOut(); 
            // Navigation will be handled by root layout
          } 
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Ionicons name="person-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={{ color: '#6B7280', fontSize: 18, marginBottom: 8 }}>Please Sign In</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          You need to be signed in to view your profile
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: '#000',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const usagePercent = (user.quota / user.maxQuota) * 100;

  const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Personal Information', sub: 'Edit your details', route: '/profile/personal' },
    { icon: 'settings-outline', label: 'Preferences', sub: 'App settings', route: '/profile/preferences' },
    { icon: 'help-circle-outline', label: 'Help & Support', sub: 'FAQs and contact', route: '/profile/help' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with Sign Out */}
      <View 
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
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
            Profile
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#000',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 100,
          }}
        >
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 140,
          paddingHorizontal: 24,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card with viewfinder style */}
        <Animated.View
          style={{ opacity: fadeAnim, flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 40 }}
        >
          <View style={{ position: 'relative', padding: 4 }}>
            {/* Corner Brackets */}
            <View style={{ position: 'absolute', top: 4, left: 4, width: 12, height: 12, borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
            <View style={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRightWidth: 1, borderTopWidth: 1, borderColor: '#000', zIndex: 10 }} />
            <View style={{ position: 'absolute', bottom: 4, left: 4, width: 12, height: 12, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
            <View style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', zIndex: 10 }} />
            
            <View style={{
              width: 80,
              height: 80,
              backgroundColor: '#F9FAFB',
              overflow: 'hidden',
            }}>
              {user.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 28, color: '#000', fontStyle: 'italic' }}
                  >
                    {user.displayName?.[0] || 'U'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 22, color: '#000' }}
            >
              {user.displayName}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4, fontWeight: 'bold' }}>
              {isDevMode ? 'Developer Mode' : 'Free Plan'}
            </Text>
          </View>
        </Animated.View>

        {/* Quota Card */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            backgroundColor: '#F9FAFB',
            padding: 24,
            marginBottom: 32,
            borderLeftWidth: 2,
            borderLeftColor: '#000',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <View>
              <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>
                Monthly Quota
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                <Text
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 40, color: '#000' }}
                >
                  {user.quota}
                </Text>
                <Text
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 20, color: '#D1D5DB', marginLeft: 4 }}
                >
                  / {user.maxQuota}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#000',
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>
                Upgrade
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={{ width: '100%', height: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                backgroundColor: '#000',
                width: `${usagePercent}%`,
              }}
            />
          </View>

          <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 16, letterSpacing: 1 }}>
            {user.maxQuota - user.quota} generations remaining this month
          </Text>
        </Animated.View>

        {/* Settings Section */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 16 }}>
            Settings
          </Text>

          <View style={{ backgroundColor: '#F9FAFB' }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.route as any)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: index === menuItems.length - 1 ? 0 : 1,
                  borderBottomColor: '#E5E7EB',
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Ionicons name={item.icon} size={18} color="#000" />
                  <View>
                    <Text style={{ color: '#000', fontSize: 13 }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2 }}>
                      {item.sub}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Version */}
          <Text style={{ 
            textAlign: 'center', 
            color: '#D1D5DB', 
            fontSize: 9, 
            marginTop: 40, 
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            letterSpacing: 2,
          }}>
            V1.0.0 • ZYORA INC.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
