import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/auth`;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error (${res.status}). Try again.`);
      }

      if (!res.ok) throw new Error(data.message || 'Verification failed');

      await login(data.token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || '',
        role: data.user.role,
        phone: data.user.phone,
        profileImage: data.user.profileImage,
        createdAt: data.user.createdAt,
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setResending(true);
    try {
      const res = await fetch(`${API_BASE}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error (${res.status}).`);
      }

      if (!res.ok) throw new Error(data.message || 'Failed to resend');

      Alert.alert('Code Sent', `A new 6-digit code was sent to ${email}`);
      startCooldown();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.topBar}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <ArrowLeft color="#f8fafc" size={20} />
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          {/* Icon */}
          <View style={s.iconCircle}>
            <ShieldCheck color="#818cf8" size={38} />
          </View>

          <Text style={s.title}>Verify Your Email</Text>
          <Text style={s.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={s.emailHL}>{email || 'your email'}</Text>
          </Text>

          {/* OTP input */}
          <View style={s.otpWrap}>
            <TextInput
              style={s.otpInput}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#334155"
              autoFocus
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={s.btn}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            style={s.resendRow}
            onPress={handleResend}
            disabled={resending || cooldown > 0}
            activeOpacity={0.7}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <>
                <RefreshCw color={cooldown > 0 ? '#475569' : '#818cf8'} size={16} />
                <Text style={[s.resendText, cooldown > 0 && s.resendDisabled]}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 21,
  },
  emailHL: { color: '#818cf8', fontWeight: '600' },

  otpWrap: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 14,
    marginTop: 8,
  },
  otpInput: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 14,
  },

  btn: {
    width: '100%',
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  resendText: { color: '#818cf8', fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: '#475569' },
});
