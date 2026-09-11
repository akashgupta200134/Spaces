import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Armchair, Calendar, Info } from 'lucide-react-native';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/user/spaces`;

export default function SelectSeatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeZoneId, setActiveZoneId] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) fetchSpaceData();
  }, [id]);

  const fetchSpaceData = async () => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const data = await res.json();
      const loadedSpace = data.space;

      setSpace(loadedSpace);
      if (loadedSpace?.zones?.length > 0) {
        setActiveZoneId(loadedSpace.zones[0].id);
      }
    } catch (err) {
      console.error('Error fetching seat layout:', err);
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

  const activeZone = space?.zones.find((z: any) => z.id === activeZoneId);
  const basePrice = space?.membershipPlans[0]?.price || 99;

  const handleProceedToCheckout = () => {
    if (!selectedSeat) {
      Alert.alert('Selection Required', 'Please select a seat on the grid to continue.');
      return;
    }

    router.push({
      pathname: '/checkout',
      params: {
        spaceId: space?.id,
        seatId: selectedSeat.id,
        seatNumber: selectedSeat.seatNumber,
        zoneName: activeZone?.name,
        date: selectedDate,
        amount: basePrice,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Select Your Seat</Text>
          <Text style={styles.headerSub}>{space?.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Booking Date</Text>
          <View style={styles.dateBox}>
            <Calendar color="#818cf8" size={18} />
            <Text style={styles.dateText}>Today ({selectedDate})</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Zone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneTabs}>
            {space?.zones.map((zone: any) => {
              const isActive = zone.id === activeZoneId;
              return (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.zoneTab, isActive && styles.activeZoneTab]}
                  onPress={() => {
                    setActiveZoneId(zone.id);
                    setSelectedSeat(null);
                  }}
                >
                  <Text style={[styles.zoneTabText, isActive && styles.activeZoneTabText]}>
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatAvailable]} />
            <Text style={styles.legendLabel}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatSelected]} />
            <Text style={styles.legendLabel}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatOccupied]} />
            <Text style={styles.legendLabel}>Occupied</Text>
          </View>
        </View>

        <View style={styles.gridCard}>
          <View style={styles.deskHeader}>
            <Text style={styles.deskHeaderText}>FRONT / MONITOR AREA</Text>
          </View>

          <View style={styles.seatGrid}>
            {activeZone?.seats && activeZone.seats.length > 0 ? (
              activeZone.seats.map((seat: any, idx: number) => {
                const isSelected = selectedSeat?.id === seat.id;
                const isOccupied = idx % 5 === 3;

                return (
                  <TouchableOpacity
                    key={seat.id}
                    disabled={isOccupied}
                    style={[
                      styles.seatBtn,
                      isOccupied && styles.seatOccupied,
                      isSelected && styles.seatSelected,
                    ]}
                    onPress={() => setSelectedSeat(seat)}
                  >
                    <Armchair
                      size={20}
                      color={isOccupied ? '#475569' : isSelected ? '#ffffff' : '#818cf8'}
                    />
                    <Text
                      style={[
                        styles.seatNum,
                        isOccupied && styles.seatNumOccupied,
                        isSelected && styles.seatNumSelected,
                      ]}
                    >
                      {seat.seatNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyGrid}>
                <Info color="#64748b" size={24} />
                <Text style={styles.emptyText}>No seats configured for this zone.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barLabel}>
            {selectedSeat ? `Seat ${selectedSeat.seatNumber} Selected` : 'No Seat Selected'}
          </Text>
          <Text style={styles.barPrice}>
            ₹{basePrice} <Text style={styles.barUnit}>/ session</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, !selectedSeat && styles.actionBtnDisabled]}
          disabled={!selectedSeat}
          onPress={handleProceedToCheckout}
        >
          <Text style={styles.actionBtnText}>Confirm Seat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  iconBtn: { backgroundColor: '#0f172a', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  headerSub: { fontSize: 12, color: '#94a3b8' },
  scrollBody: { padding: 16, paddingBottom: 110, gap: 16 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f172a', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b' },
  dateText: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  zoneTabs: { gap: 8 },
  zoneTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  activeZoneTab: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  zoneTabText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  activeZoneTabText: { color: '#ffffff', fontWeight: '700' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0f172a', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
  legendLabel: { color: '#94a3b8', fontSize: 12 },
  gridCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b', gap: 16 },
  deskHeader: { backgroundColor: '#1e293b', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  deskHeaderText: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: 8 },
  seatBtn: { width: 62, height: 62, backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', gap: 2 },
  seatAvailable: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155' },
  seatOccupied: { backgroundColor: '#1e293b', borderColor: '#334155', opacity: 0.5 },
  seatSelected: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  seatNum: { fontSize: 11, fontWeight: '700', color: '#cbd5e1' },
  seatNumOccupied: { color: '#64748b' },
  seatNumSelected: { color: '#ffffff' },
  emptyGrid: { padding: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: '#64748b', fontSize: 13 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  barPrice: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  barUnit: { fontSize: 12, color: '#64748b', fontWeight: '400' },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  actionBtnDisabled: { backgroundColor: '#1e293b', opacity: 0.6 },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});