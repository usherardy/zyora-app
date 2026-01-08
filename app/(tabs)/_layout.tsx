import { View, Text, TouchableOpacity } from 'react-native';
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

  const currentRoute = pathname.replace('/', '') || 'studio';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom > 0 ? insets.bottom : 24,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 50,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.9)',
          borderRadius: 100,
          padding: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
          elevation: 20,
        }}
      >
        {navItems.map((item) => {
          const isActive = currentRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(`/(tabs)/${item.route}`)}
              activeOpacity={0.8}
              style={{
                height: 48,
                paddingHorizontal: isActive ? 24 : 24,
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
                color={isActive ? '#000' : '#6B7280'}
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
