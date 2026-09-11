import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ticket, Calendar } from 'lucide-react-native';

export default function BookingsScreen() {
  const dummyBookings = [
    {
      id: 'b1',
      spaceName: 'CyberHub Workstation',
      seatNumber: 'A-12',
      zoneName: 'Quiet Zone',
      date: '2026-09-12',
      status: 'CONFIRMED',
      amount: '₹299',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <FlatList
        data={dummyBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.spaceName}>{item.spaceName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Ticket color="#818cf8" size={16} />
              <Text style={styles.infoText}>Seat {item.seatNumber} • {item.zoneName}</Text>
            </View>

            <View style={styles.row}>
              <Calendar color="#64748b" size={16} />
              <Text style={styles.infoText}>{item.date}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.priceLabel}>Paid</Text>
              <Text style={styles.priceVal}>{item.amount}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  bookingCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spaceName: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  badge: { backgroundColor: '#166534', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#86efac', fontSize: 10, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: '#cbd5e1', fontSize: 13 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  priceLabel: { color: '#64748b', fontSize: 12 },
  priceVal: { color: '#818cf8', fontWeight: '700', fontSize: 16 },
});