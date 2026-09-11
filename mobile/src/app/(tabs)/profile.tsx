import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bell,
  Calendar,
  Edit3,
  Trash2,
  Lock,
  X,
  Check,
  Award,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api';

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit profile state
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete account state
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfile(data.user);
        await updateUser({
          name: data.user.name,
          phone: data.user.phone,
          profileImage: data.user.profileImage,
          createdAt: data.user.createdAt,
        });
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const openEditModal = () => {
    setEditName(profile?.name || user?.name || '');
    setEditPhone(profile?.phone || user?.phone || '');
    setEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      await updateUser({ name: data.user.name, phone: data.user.phone });
      setProfile((prev: any) => ({ ...prev, ...data.user }));
      setEditModal(false);
      Alert.alert('Success', 'Profile updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Required', 'Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API}/user/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed');
      setDeleteModal(false);
      Alert.alert('Account Scheduled for Deletion', data.message, [
        {
          text: 'OK',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const displayName = profile?.name || user?.name || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || user?.phone || '';
  const memberSince = formatDate(profile?.createdAt || user?.createdAt);
  const activeMembership = profile?.memberships?.[0];
  const stats = profile?._count;

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your alerts',
      icon: Bell,
      route: '/notifications',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Password, data & permissions',
      icon: Shield,
      route: '/privacy-security',
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'FAQs, contact & tickets',
      icon: HelpCircle,
      route: '/help-support',
    },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity style={s.editBtn} onPress={openEditModal}>
          <Edit3 color="#818cf8" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userEmail}>{displayEmail}</Text>
          {activeMembership ? (
            <View style={s.memberBadge}>
              <Award color="#818cf8" size={12} />
              <Text style={s.memberBadgeText}>{activeMembership.plan.name}</Text>
            </View>
          ) : (
            <View style={s.memberBadgeBasic}>
              <Text style={s.memberBadgeBasicText}>Standard Member</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{stats.bookings}</Text>
              <Text style={s.statLabel}>Bookings</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNumber}>{stats.reviews}</Text>
              <Text style={s.statLabel}>Reviews</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNumber}>{stats.favorites}</Text>
              <Text style={s.statLabel}>Favorites</Text>
            </View>
          </View>
        )}

        {/* Account Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account Information</Text>
          <View style={s.card}>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Mail color="#818cf8" size={16} /></View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoValue}>{displayEmail}</Text>
              </View>
            </View>
            <View style={[s.infoRow, s.rowBorder]}>
              <View style={s.infoIcon}><Phone color="#818cf8" size={16} /></View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Phone</Text>
                <Text style={s.infoValue}>{displayPhone || 'Not provided'}</Text>
              </View>
            </View>
            <View style={[s.infoRow, s.rowBorder]}>
              <View style={s.infoIcon}><Calendar color="#818cf8" size={16} /></View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Member Since</Text>
                <Text style={s.infoValue}>{memberSince}</Text>
              </View>
            </View>
            {activeMembership && (
              <View style={[s.infoRow, s.rowBorder]}>
                <View style={s.infoIcon}><Award color="#818cf8" size={16} /></View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Active Plan</Text>
                  <Text style={s.infoValue}>
                    {activeMembership.plan.name} — {activeMembership.space.name}
                  </Text>
                  <Text style={s.infoSub}>
                    Expires {formatDate(activeMembership.endDate)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Menu */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Settings</Text>
          <View style={s.card}>
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.menuRow, idx > 0 && s.rowBorder]}
                  activeOpacity={0.7}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={s.menuLeft}>
                    <View style={s.menuIcon}><Icon color="#818cf8" size={18} /></View>
                    <View>
                      <Text style={s.menuText}>{item.title}</Text>
                      <Text style={s.menuSub}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <ChevronRight color="#475569" size={18} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <LogOut color="#ef4444" size={18} />
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.deleteBtn}
            activeOpacity={0.8}
            onPress={() => {
              setDeletePassword('');
              setDeleteModal(true);
            }}
          >
            <Trash2 color="#dc2626" size={16} />
            <Text style={s.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X color="#94a3b8" size={22} />
              </TouchableOpacity>
            </View>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Full Name</Text>
              <View style={s.modalInputRow}>
                <UserIcon color="#64748b" size={16} />
                <TextInput
                  style={s.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Phone Number</Text>
              <View style={s.modalInputRow}>
                <Phone color="#64748b" size={16} />
                <TextInput
                  style={s.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check color="#fff" size={18} />
                  <Text style={s.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={deleteModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: '#ef4444' }]}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteModal(false)}>
                <X color="#94a3b8" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={s.deleteWarning}>
              This action will schedule your account for permanent deletion. All your
              bookings, memberships, and data will be removed within 30 days. This
              cannot be undone.
            </Text>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Enter your password to confirm</Text>
              <View style={s.modalInputRow}>
                <Lock color="#64748b" size={16} />
                <TextInput
                  style={s.modalInput}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Password"
                  placeholderTextColor="#475569"
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={s.confirmDeleteBtn}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Trash2 color="#fff" size={16} />
                  <Text style={s.confirmDeleteText}>Permanently Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  body: { padding: 16, gap: 20, paddingBottom: 40 },

  // Profile card
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  userEmail: { fontSize: 13, color: '#64748b' },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    marginTop: 4,
  },
  memberBadgeText: { color: '#818cf8', fontSize: 11, fontWeight: '700' },
  memberBadgeBasic: {
    backgroundColor: 'rgba(100,116,139,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  memberBadgeBasicText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#1e293b' },

  // Sections
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#e2e8f0', fontWeight: '500' },
  infoSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#1e293b' },

  // Menu
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

  // Action buttons
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.06)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  deleteText: { color: '#64748b', fontSize: 13, fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 18,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  modalField: { gap: 6 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  modalInput: { flex: 1, color: '#f8fafc', paddingVertical: 14, fontSize: 15 },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Delete modal
  deleteWarning: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    backgroundColor: 'rgba(239,68,68,0.06)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  confirmDeleteBtn: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
