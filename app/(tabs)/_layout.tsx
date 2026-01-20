import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabRoute = 'studio' | 'vault' | 'profile';

interface NavItem {
  route: TabRoute;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const navItems: NavItem[] = [
  { route: 'studio', icon: 'aperture-outline', label: 'Studio' },
  { route: 'vault', icon: 'layers-outline', label: 'Vault' },
  { route: 'profile', icon: 'person-outline', label: 'Profile' },
];

function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Robust route detection (works with /(tabs)/...)
  const segments = pathname.split('/').filter(Boolean);
  const currentRoute = segments[segments.length - 1] as TabRoute;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 50,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
        paddingTop:10,
        backgroundColor: '#000',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor:'#000',
          borderRadius: 100,
          padding: 8,
          borderWidth: 1,
          // borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        {navItems.map((item) => {
          const isActive = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.8}
              onPress={() => router.push(`/(tabs)/${item.route}`)}
              style={{
                height: 48,
                paddingHorizontal: 24,
                borderRadius: 100,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? '#fff' : 'transparent',

                shadowColor: isActive ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isActive ? 0.2 : 0,
                shadowRadius: 8,
                elevation: isActive ? 4 : 0,
              }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? '#000' : '#ffffff'}
                style={{ opacity: isActive ? 1 : 0.7 }}
              />

              {isActive && (
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#000',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
        tabBar={() => <CustomTabBar />}
      >
        <Tabs.Screen name="studio" />
        <Tabs.Screen name="vault" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
