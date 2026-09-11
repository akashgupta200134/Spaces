import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, MapPin, Calendar, Shield, LogIn, UserPlus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function LandingScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.page}>
        {/* Decorative background orbs */}
        <View style={s.orbWrap}>
          <View style={[s.orb, s.orb1]} />
          <View style={[s.orb, s.orb2]} />
        </View>

        {/* Brand hero */}
        <View style={s.hero}>
          <View style={s.logoBorder}>
            <View style={s.logoCircle}>
              <Building2 color="#a5b4fc" size={40} />
            </View>
          </View>
          <Text style={s.brand}>Spaces</Text>
          <Text style={s.tagline}>
            Book desks, pods & conference rooms{'\n'}at coworking hubs near you.
          </Text>
        </View>

        {/* Feature chips */}
        <View style={s.chips}>
          {[
            { Icon: MapPin, label: 'Multiple Cities' },
            { Icon: Calendar, label: 'Instant Booking' },
            { Icon: Shield, label: 'Secure Pay' },
          ].map(({ Icon, label }) => (
            <View key={label} style={s.chip}>
              <Icon color="#818cf8" size={14} />
              <Text style={s.chipLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity
            style={s.primary}
            activeOpacity={0.85}
            onPress={() => router.push('/login')}
          >
            <LogIn color="#fff" size={20} />
            <Text style={s.primaryText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondary}
            activeOpacity={0.85}
            onPress={() => router.push('/signup')}
          >
            <UserPlus color="#a5b4fc" size={20} />
            <Text style={s.secondaryText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.legal}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  orbWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: {
    width: 280,
    height: 280,
    top: -70,
    right: -90,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  orb2: {
    width: 220,
    height: 220,
    bottom: 100,
    left: -70,
    backgroundColor: 'rgba(129,140,248,0.04)',
  },

  hero: { alignItems: 'center', gap: 16, marginTop: 24 },
  logoBorder: {
    padding: 3,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(129,140,248,0.25)',
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: { fontSize: 38, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  tagline: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },

  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99,102,241,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  chipLabel: { fontSize: 12, color: '#c7d2fe', fontWeight: '600' },

  ctas: { gap: 12 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(99,102,241,0.08)',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  secondaryText: { color: '#a5b4fc', fontSize: 16, fontWeight: '700' },

  legal: { textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 16 },
});
