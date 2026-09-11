import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react-native';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/auth`;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error (${res.status}). Try again.`);
      }

      if (!res.ok) throw new Error(data.message || 'Failed to send code');

      Alert.alert('Code Sent', 'If an account exists, a 6-digit reset code has been sent.');
      setStep(2);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPw) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error (${res.status}). Try again.`);
      }

      if (!res.ok) throw new Error(data.message || 'Reset failed');

      Alert.alert('Password Updated', 'You can now log in with your new password.', [
        { text: 'Log In', onPress: () => router.replace('/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message);
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
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.back}
            onPress={() => (step === 2 ? setStep(1) : router.back())}
          >
            <ArrowLeft color="#f8fafc" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={s.iconCircle}>
            <KeyRound color="#818cf8" size={36} />
          </View>

          <Text style={s.title}>
            {step === 1 ? 'Forgot Password?' : 'Set New Password'}
          </Text>
          <Text style={s.subtitle}>
            {step === 1
              ? 'Enter your account email to receive a 6-digit reset code.'
              : `Enter the code sent to ${email} along with your new password.`}
          </Text>

          <View style={s.form}>
            {step === 1 ? (
              /* ── Step 1: Email ── */
              <>
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
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={s.btn}
                  onPress={handleRequestCode}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.btnText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* ── Step 2: OTP + New Password ── */
              <>
                <View style={s.field}>
                  <Text style={s.label}>Reset Code</Text>
                  <View style={s.otpWrap}>
                    <TextInput
                      style={s.otpInput}
                      value={otp}
                      onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="000000"
                      placeholderTextColor="#334155"
                    />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>New Password</Text>
                  <View style={s.inputRow}>
                    <Lock color="#64748b" size={18} />
                    <TextInput
                      style={s.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor="#475569"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPw}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPw(!showPw)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPw ? (
                        <EyeOff color="#64748b" size={18} />
                      ) : (
                        <Eye color="#64748b" size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Confirm Password</Text>
                  <View style={s.inputRow}>
                    <CheckCircle2 color="#64748b" size={18} />
                    <TextInput
                      style={s.input}
                      placeholder="Re-enter password"
                      placeholderTextColor="#475569"
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                      secureTextEntry={!showPw}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={s.btn}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.btnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Back to login */}
          <View style={s.footer}>
            <Text style={s.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={s.footerLink}>Log In</Text>
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
    alignItems: 'center',
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
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  form: { width: '100%', gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
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

  otpWrap: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 12,
  },
  otpInput: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
  },

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
    marginTop: 28,
    paddingBottom: 24,
  },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#818cf8', fontSize: 14, fontWeight: '700' },
});
