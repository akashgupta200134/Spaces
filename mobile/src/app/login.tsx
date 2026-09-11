import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/auth`;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error (${res.status}). Try again later.`);
      }

      if (!res.ok) throw new Error(data.message || 'Login failed');

      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Back */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <ArrowLeft color="#f8fafc" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <View style={s.heading}>
            <Text style={s.title}>Welcome Back</Text>
            <Text style={s.subtitle}>
              Sign in to access your booked seats and pass options.
            </Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email Address</Text>
              <View style={s.inputRow}>
                <Mail color="#64748b" size={18} />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={s.forgot}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={s.inputRow}>
                <Lock color="#64748b" size={18} />
                <TextInput
                  style={s.input}
                  placeholder="Enter password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPw ? (
                    <EyeOff color="#64748b" size={18} />
                  ) : (
                    <Eye color="#64748b" size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={s.btn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer link */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/signup')}>
              <Text style={s.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingHorizontal: 20, paddingTop: 8 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  heading: { gap: 6, marginBottom: 36 },
  title: { fontSize: 30, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 15, color: '#94a3b8', lineHeight: 22 },

  form: { gap: 22 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgot: { fontSize: 13, color: '#818cf8', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  input: { flex: 1, color: '#f8fafc', paddingVertical: 15, fontSize: 15 },
  btn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 36,
    paddingBottom: 24,
  },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#818cf8', fontSize: 14, fontWeight: '700' },
});
