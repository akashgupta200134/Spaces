import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BellOff,
  Megaphone,
  AlertTriangle,
  Wrench,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCheck,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ANNOUNCEMENT: { icon: Megaphone, color: '#818cf8', bg: 'rgba(99,102,241,0.1)', label: 'Announcement' },
  ALERT: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Alert' },
  MAINTENANCE: { icon: Wrench, color: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'Maintenance' },
  LOCATION_NOTICE: { icon: MapPin, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Notice' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setNotifications(data.notifications || []);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`${API}/user/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleCardPress = (item: any) => {
    // Toggle card expansion
    setExpandedId((prev) => (prev === item.id ? null : item.id));

    // Automatically mark as read when opened
    if (!item.isRead) {
      markRead(item.id);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.ANNOUNCEMENT;
    const Icon = config.icon;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={[s.card, !item.isRead && s.cardUnread, isExpanded && s.cardExpanded]}
        activeOpacity={0.8}
        onPress={() => handleCardPress(item)}
      >
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: config.bg }]}>
            <Icon color={config.color} size={18} />
          </View>

          <View style={s.headerTextWrap}>
            <View style={s.cardTop}>
              <Text style={s.cardTitle} numberOfLines={isExpanded ? undefined : 1}>
                {item.title}
              </Text>
              {!item.isRead && <View style={s.unreadDot} />}
            </View>
            <Text style={s.typeLabel}>{config.label}</Text>
          </View>

          <View style={s.expandIconWrap}>
            {isExpanded ? (
              <ChevronUp color="#64748b" size={18} />
            ) : (
              <ChevronDown color="#64748b" size={18} />
            )}
          </View>
        </View>

        <Text
          style={[s.cardMsg, isExpanded && s.cardMsgFull]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.message}
        </Text>

        <View style={s.cardFooter}>
          <Text style={s.cardTime}>
            {isExpanded ? formatFullDate(item.createdAt) : timeAgo(item.createdAt)}
          </Text>
          {item.isRead && (
            <View style={s.readStatus}>
              <CheckCheck color="#475569" size={14} />
              <Text style={s.readText}>Read</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <ArrowLeft color="#f8fafc" size={20} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <BellOff color="#475569" size={40} />
          </View>
          <Text style={s.emptyTitle}>No Notifications</Text>
          <Text style={s.emptyMsg}>You're all caught up! Check back later.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  list: { padding: 16 },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  cardUnread: {
    borderColor: 'rgba(99,102,241,0.4)',
    backgroundColor: 'rgba(15,23,42,0.95)',
  },
  cardExpanded: {
    borderColor: '#6366f1',
    backgroundColor: '#0f172a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1, gap: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#f8fafc', flex: 1 },
  typeLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginLeft: 8,
  },
  expandIconWrap: { paddingLeft: 4 },

  cardMsg: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  cardMsgFull: { color: '#cbd5e1' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 2,
  },
  cardTime: { fontSize: 11, color: '#64748b' },
  readStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readText: { fontSize: 11, color: '#475569' },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  emptyMsg: { fontSize: 14, color: '#64748b' },
});


