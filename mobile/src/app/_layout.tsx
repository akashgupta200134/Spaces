import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';

const AUTH_SCREENS = ['login', 'signup', 'verify-otp', 'forgot-password'];

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const first = segments[0] as string | undefined;
    const isOnAuth = !first || AUTH_SCREENS.includes(first);

    if (!user && !isOnAuth) {
      router.replace('/');
    } else if (user && isOnAuth && first !== 'verify-otp') {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#020617' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="privacy-security" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="spaces/[id]" />
        <Stack.Screen name="spaces/[id]/select-seat" />
        <Stack.Screen name="checkout" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
