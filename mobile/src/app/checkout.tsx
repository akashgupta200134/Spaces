import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Lock,
  LogIn,
  UserPlus,
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  Ticket,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const params = useLocalSearchParams<{
    spaceId: string;
    spaceName: string;
    seatNumber: string;
    zoneName: string;
    price: string;
    date: string;
  }>();

  const [processing, setProcessing] = useState(false);

  const handleConfirmBooking = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spaceId: params.spaceId,
          seatNumber: params.seatNumber,
          zoneName: params.zoneName,
          bookingDate: params.date,
          amount: params.price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete booking');
      }

      Alert.alert('Booking Confirmed!', 'Your workspace reservation has been secured.', [
        { text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Something went wrong during checkout.');
    } finally {
      setProcessing(false);
    }
  };

  // --- GUEST GUARD: Prompt guest users to sign in or sign up ---
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.guardContent}>
          <View style={styles.lockIconCircle}>
            <Lock color="#818cf8" size={38} />
          </View>

          <Text style={styles.guardTitle}>Account Required to Reserve</Text>
          <Text style={styles.guardSubtitle}>
            To protect space availability and send your instant digital pass, please sign in or create an account.
          </Text>

          {/* Quick Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Pending Reservation</Text>
            <View style={styles.summaryRow}>
              <MapPin color="#64748b" size={16} />
              <Text style={styles.summaryText}>{params.spaceName || 'Selected Space'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ticket color="#64748b" size={16} />
              <Text style={styles.summaryText}>
                Seat {params.seatNumber || 'Standard'} • {params.zoneName || 'Main Zone'}
              </Text>
            </View>
          </View>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <LogIn color="#ffffff" size={18} />
              <Text style={styles.primaryBtnText}>Log In & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/signup')}
              activeOpacity={0.8}
            >
              <UserPlus color="#818cf8" size={18} />
              <Text style={styles.secondaryBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- AUTHENTICATED USER: Complete Checkout ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Reservation Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Reservation Details</Text>
          
          <View style={styles.detailRow}>
            <MapPin color="#818cf8" size={18} />
            <View>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{params.spaceName || 'CyberHub Workstation'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ticket color="#818cf8" size={18} />
            <View>
              <Text style={styles.detailLabel}>Seat & Zone</Text>
              <Text style={styles.detailValue}>
                Seat {params.seatNumber || 'A-12'} ({params.zoneName || 'Quiet Zone'})
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Calendar color="#818cf8" size={18} />
            <View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{params.date || 'Today'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Payment Summary</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Seat Pass Rate</Text>
            <Text style={styles.priceValue}>{params.price || '₹299'}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Convenience Fee</Text>
            <Text style={styles.priceValue}>₹0</Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{params.price || '₹299'}</Text>
          </View>
        </View>

        <View style={styles.securityNote}>
          <ShieldCheck color="#22c55e" size={18} />
          <Text style={styles.securityText}>256-Bit Encrypted & Instant Access Guarantee</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={handleConfirmBooking}
          disabled={processing}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <CreditCard color="#ffffff" size={18} />
              <Text style={styles.payBtnText}>Confirm & Pay {params.price || '₹299'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  backBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  scrollContent: { padding: 16, gap: 16 },
  guardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  guardTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  guardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
    marginVertical: 12,
  },
  summaryTitle: { fontSize: 12, fontWeight: '600', color: '#818cf8', textTransform: 'uppercase' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { color: '#f8fafc', fontSize: 14, fontWeight: '500' },
  actionGroup: { width: '100%', gap: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  secondaryBtnText: { color: '#818cf8', fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 14,
  },
  cardHeader: { fontSize: 14, fontWeight: '700', color: '#818cf8', textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailLabel: { fontSize: 12, color: '#64748b' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: '#94a3b8', fontSize: 14 },
  priceValue: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#818cf8' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 4 },
  securityText: { color: '#22c55e', fontSize: 12, fontWeight: '500' },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 14,
  },
  payBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});