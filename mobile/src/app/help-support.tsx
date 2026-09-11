import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Phone,
  HelpCircle,
  FileQuestion,
  ExternalLink,
} from 'lucide-react-native';

const FAQS = [
  {
    q: 'How do I book a workspace?',
    a: 'Browse available spaces in the Explore tab, select a space, pick your seat, and proceed to checkout.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes, you can cancel from the Bookings tab. Refund policies depend on how far in advance you cancel.',
  },
  {
    q: 'How do I change my membership plan?',
    a: 'Contact our support team to upgrade or change your membership plan.',
  },
  {
    q: 'What happens after I delete my account?',
    a: 'Your account will be scheduled for deletion within 30 days. All data including bookings and payment history will be permanently removed.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <ArrowLeft color="#f8fafc" size={20} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Contact */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact Us</Text>
          <View style={s.card}>
            <TouchableOpacity
              style={s.contactRow}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('mailto:support@spaces.app')}
            >
              <View style={s.contactIcon}>
                <Mail color="#818cf8" size={18} />
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactLabel}>Email Support</Text>
                <Text style={s.contactValue}>support@spaces.app</Text>
              </View>
              <ExternalLink color="#475569" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.contactRow, s.rowBorder]}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('tel:+919876543210')}
            >
              <View style={s.contactIcon}>
                <Phone color="#818cf8" size={18} />
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactLabel}>Phone Support</Text>
                <Text style={s.contactValue}>+91 98765 43210</Text>
              </View>
              <ExternalLink color="#475569" size={16} />
            </TouchableOpacity>

            <View style={[s.contactRow, s.rowBorder]}>
              <View style={s.contactIcon}>
                <MessageSquare color="#818cf8" size={18} />
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactLabel}>In-App Support</Text>
                <Text style={s.contactValue}>Coming soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
          <View style={s.card}>
            {FAQS.map((faq, idx) => (
              <TouchableOpacity
                key={idx}
                style={[s.faqRow, idx > 0 && s.rowBorder]}
                activeOpacity={0.7}
                onPress={() => setExpanded(expanded === idx ? null : idx)}
              >
                <View style={s.faqHeader}>
                  <View style={s.faqIcon}>
                    <FileQuestion color="#818cf8" size={16} />
                  </View>
                  <Text style={s.faqQ}>{faq.q}</Text>
                </View>
                {expanded === idx && (
                  <Text style={s.faqA}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>App Info</Text>
          <View style={s.card}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Version</Text>
              <Text style={s.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>
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
  rowBorder: { borderTopWidth: 1, borderTopColor: '#1e293b' },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: { flex: 1, gap: 1 },
  contactLabel: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  contactValue: { fontSize: 12, color: '#64748b' },

  faqRow: { padding: 14, gap: 8 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQ: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', flex: 1 },
  faqA: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginLeft: 40,
    marginTop: 4,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#f8fafc', fontWeight: '500' },
});
