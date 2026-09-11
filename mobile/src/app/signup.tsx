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
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
} from 'lucide-react-native';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/auth`;

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPw) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Terms Required', 'You must accept the Terms & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          acceptTerms,
        }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error (${res.status}). Try again later.`);
      }

      if (!res.ok) throw new Error(data.message || 'Registration failed');

      router.push({
        pathname: '/verify-otp',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
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
        {/* Header */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <ArrowLeft color="#f8fafc" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.heading}>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>
              Sign up to discover and book workspaces near you.
            </Text>
          </View>

          <View style={s.form}>
            {/* Name row */}
            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>First Name</Text>
                <View style={s.inputRow}>
                  <User color="#64748b" size={18} />
                  <TextInput
                    style={s.input}
                    placeholder="John"
                    placeholderTextColor="#475569"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Last Name</Text>
                <View style={s.inputRow}>
                  <User color="#64748b" size={18} />
                  <TextInput
                    style={s.input}
                    placeholder="Doe"
                    placeholderTextColor="#475569"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
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

            {/* Phone */}
            <View style={s.field}>
              <Text style={s.label}>Phone (optional)</Text>
              <View style={s.inputRow}>
                <Phone color="#64748b" size={18} />
                <TextInput
                  style={s.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#475569"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputRow}>
                <Lock color="#64748b" size={18} />
                <TextInput
                  style={s.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
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

            {/* Confirm password */}
            <View style={s.field}>
              <Text style={s.label}>Confirm Password</Text>
              <View style={s.inputRow}>
                <Lock color="#64748b" size={18} />
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

            {/* Terms */}
            <TouchableOpacity
              style={s.termsRow}
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.7}
            >
              {acceptTerms ? (
                <CheckSquare color="#818cf8" size={20} />
              ) : (
                <Square color="#475569" size={20} />
              )}
              <Text style={s.termsText}>
                I agree to the{' '}
                <Text style={s.link}>Terms of Service</Text> and{' '}
                <Text style={s.link}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={s.btn}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
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
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  heading: { gap: 6, marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 15, color: '#94a3b8', lineHeight: 22 },

  form: { gap: 18 },
  row: { flexDirection: 'row', gap: 12 },
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
  input: { flex: 1, color: '#f8fafc', paddingVertical: 14, fontSize: 15 },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  termsText: { flex: 1, color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  link: { color: '#818cf8', fontWeight: '600' },

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
    paddingBottom: 16,
  },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#818cf8', fontSize: 14, fontWeight: '700' },
});
