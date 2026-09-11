import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Clock, Star, ArrowLeft, CheckCircle2, Armchair } from 'lucide-react-native';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/user/spaces`;

export default function SpaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const data = await res.json();
      setSpace(data.space);
    } catch (err) {
      console.error('Failed to load detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!space) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Space not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageHeader}>
          <Image
            source={{ uri: space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800' }}
            style={styles.bannerImage}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.spaceName}>{space.name}</Text>
            <View style={styles.ratingBadge}>
              <Star color="#f59e0b" fill="#f59e0b" size={14} />
              <Text style={styles.ratingText}>{(space.ratingAvg || 0).toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin color="#64748b" size={16} />
            <Text style={styles.infoText}>{space.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock color="#64748b" size={16} />
            <Text style={styles.infoText}>Operating Hours: {space.openingTime} - {space.closingTime}</Text>
          </View>

          <Text style={styles.sectionTitle}>About Space</Text>
          <Text style={styles.description}>{space.description || 'Modern study and work environment equipped with high-speed internet and quiet zones.'}</Text>

          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.facilitiesGrid}>
            {space.facilities?.map((item: any) => (
              <View key={item.facility.id} style={styles.facilityCard}>
                <CheckCircle2 color="#818cf8" size={16} />
                <Text style={styles.facilityName}>{item.facility.name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Zones ({space.zones?.length || 0})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneList}>
            {space.zones?.map((zone: any) => (
              <View key={zone.id} style={styles.zoneCard}>
                <Armchair color="#6366f1" size={20} />
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.seatCount}>{zone.seats?.length || 0} Seats available</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Pass Options</Text>
          {space.membershipPlans?.map((plan: any) => (
            <View key={plan.id} style={styles.planCard}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planSub}>{plan.durationDays} Days Duration</Text>
              </View>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barLabel}>Starting From</Text>
          <Text style={styles.barPrice}>₹{space.membershipPlans?.[0]?.price || '99'}</Text>
        </View>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push({
              pathname: '/spaces/[id]/select-seat',
              params: { id: space.id },
            })
          }
        >
          <Text style={styles.actionBtnText}>Select Seat Grid</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 16 },
  scrollContent: { paddingBottom: 100 },
  imageHeader: { position: 'relative', width: '100%', height: 220 },
  bannerImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: 10, borderRadius: 30 },
  content: { padding: 20, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spaceName: { fontSize: 22, fontWeight: '700', color: '#f8fafc', flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  ratingText: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: '#94a3b8', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginTop: 12 },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facilityCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  facilityName: { color: '#cbd5e1', fontSize: 13 },
  zoneList: { gap: 12 },
  zoneCard: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', minWidth: 130, gap: 4 },
  zoneName: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  seatCount: { color: '#64748b', fontSize: 11 },
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  planName: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  planSub: { color: '#64748b', fontSize: 12 },
  planPrice: { color: '#818cf8', fontWeight: '700', fontSize: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: 10, color: '#64748b' },
  barPrice: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});