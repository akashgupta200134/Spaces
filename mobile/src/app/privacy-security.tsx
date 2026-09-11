import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Shield,
  FileText,
  Download,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw) {
      Alert.alert('Required', 'Enter your current password.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/user/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      Alert.alert('Success', 'Password changed successfully.');
      setShowChangePw(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <ArrowLeft color="#f8fafc" size={20} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Change Password Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Security</Text>
          <View style={s.card}>
            <TouchableOpacity
              style={s.menuRow}
              activeOpacity={0.7}
              onPress={() => setShowChangePw(!showChangePw)}
            >
              <View style={s.menuLeft}>
                <View style={s.menuIcon}><Lock color="#818cf8" size={18} /></View>
                <View>
                  <Text style={s.menuText}>Change Password</Text>
                  <Text style={s.menuSub}>Update your account password</Text>
                </View>
              </View>
            </TouchableOpacity>

            {showChangePw && (
              <View style={s.pwForm}>
                <View style={s.field}>
                  <Text style={s.label}>Current Password</Text>
                  <View style={s.inputRow}>
                    <Lock color="#64748b" size={16} />
                    <TextInput
                      style={s.input}
                      value={currentPw}
                      onChangeText={setCurrentPw}
                      secureTextEntry={!showPw}
                      placeholder="Current password"
                      placeholderTextColor="#475569"
                    />
                    <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff color="#64748b" size={16} /> : <Eye color="#64748b" size={16} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={s.field}>
                  <Text style={s.label}>New Password</Text>
                  <View style={s.inputRow}>
                    <Lock color="#64748b" size={16} />
                    <TextInput
                      style={s.input}
                      value={newPw}
                      onChangeText={setNewPw}
                      secureTextEntry={!showPw}
                      placeholder="Min. 6 characters"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>
                <View style={s.field}>
                  <Text style={s.label}>Confirm New Password</Text>
                  <View style={s.inputRow}>
                    <Lock color="#64748b" size={16} />
                    <TextInput
                      style={s.input}
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                      secureTextEntry={!showPw}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={s.saveBtn}
                  onPress={handleChangePassword}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.saveBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Privacy Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Privacy</Text>
          <View style={s.card}>
            <View style={s.menuRow}>
              <View style={s.menuLeft}>
                <View style={s.menuIcon}><FileText color="#818cf8" size={18} /></View>
                <View>
                  <Text style={s.menuText}>Terms of Service</Text>
                  <Text style={s.menuSub}>Review our terms and conditions</Text>
                </View>
              </View>
            </View>
            <View style={[s.menuRow, s.rowBorder]}>
              <View style={s.menuLeft}>
                <View style={s.menuIcon}><Shield color="#818cf8" size={18} /></View>
                <View>
                  <Text style={s.menuText}>Privacy Policy</Text>
                  <Text style={s.menuSub}>How we handle your data</Text>
                </View>
              </View>
            </View>
            <View style={[s.menuRow, s.rowBorder]}>
              <View style={s.menuLeft}>
                <View style={s.menuIcon}><Download color="#818cf8" size={18} /></View>
                <View>
                  <Text style={s.menuText}>Data Export</Text>
                  <Text style={s.menuSub}>Request a copy of your data</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={s.footerNote}>
          Your privacy matters. We only store data necessary to provide our services.
          You can request data deletion from the Profile screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  body: { padding: 16, gap: 20, paddingBottom: 40 },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  menuSub: { color: '#64748b', fontSize: 11, marginTop: 1 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#1e293b' },

  pwForm: {
    padding: 14,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: 'rgba(2,6,23,0.5)',
  },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  input: { flex: 1, color: '#f8fafc', paddingVertical: 13, fontSize: 14 },
  saveBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  footerNote: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
