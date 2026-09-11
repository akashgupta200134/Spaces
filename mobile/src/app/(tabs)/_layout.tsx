import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Compass, Ticket, User } from 'lucide-react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const androidBottomPadding = insets.bottom > 0 ? insets.bottom : 28;
  const bottomInset = Platform.OS === 'android' ? androidBottomPadding : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ticket color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}