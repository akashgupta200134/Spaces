import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, MapPin, Star, Clock, X, Sparkles, Building2 } from 'lucide-react-native';

const API_HOST = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://10.46.100.131:5000';
const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.46.100.131:5000/api'}/user/spaces`;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800';

/**
 * Safely resolves image URLs regardless of whether DB returns:
 * - A stringified JSON array ("[\"http...\"]")
 * - A native Array (["http..."])
 * - A relative upload path ("/uploads/img.jpg")
 * - A localhost URL
 */
function resolveImageUrl(images: any): string {
  if (!images) return FALLBACK_IMAGE;

  let rawUrl: string | undefined;

  if (Array.isArray(images) && images.length > 0) {
    rawUrl = images[0];
  } else if (typeof images === 'string') {
    if (images.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) rawUrl = parsed[0];
      } catch {
        rawUrl = images;
      }
    } else {
      rawUrl = images;
    }
  }

  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return FALLBACK_IMAGE;
  }

  let cleanUrl = rawUrl.trim();

  // Handle local server relative paths
  if (cleanUrl.startsWith('/')) {
    return `${API_HOST}${cleanUrl}`;
  }

  // Handle localhost substitution for mobile emulators/devices
  if (cleanUrl.includes('localhost')) {
    return cleanUrl.replace('localhost', '10.46.100.131');
  }

  return cleanUrl;
}

export default function SpaceDiscoveryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState<{ id: string; city: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch filter metadata once
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/locations`).then((r) => r.json()),
      fetch(`${API_BASE}/facilities`).then((r) => r.json()),
    ])
      .then(([locData, facData]) => {
        setLocations(locData.locations || []);
        setFacilities(facData.facilities || []);
      })
      .catch((err) => console.error('Filter fetch error:', err));
  }, []);

  const fetchSpaces = useCallback(async () => {
    try {
      let query = `${API_BASE}?`;
      if (selectedLocation) query += `locationId=${selectedLocation}&`;
      if (search.trim()) query += `search=${encodeURIComponent(search.trim())}&`;
      if (selectedFacilities.length > 0) query += `facilities=${selectedFacilities.join(',')}`;

      const res = await fetch(query);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error('Spaces fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLocation, search, selectedFacilities]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSpaces();
  };

  const toggleFacility = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header & Search */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Find Your Space</Text>
          <View style={styles.badgeSparkle}>
            <Sparkles color="#818cf8" size={14} />
            <Text style={styles.badgeSparkleText}>Explore Workspaces</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search color="#94a3b8" size={18} />
          <TextInput
            placeholder="Search city, area, workspace..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchSpaces}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="#94a3b8" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Location Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <TouchableOpacity
            style={[styles.pill, !selectedLocation && styles.activePill]}
            onPress={() => setSelectedLocation('')}
          >
            <Text style={[styles.pillText, !selectedLocation && styles.activePillText]}>All Cities</Text>
          </TouchableOpacity>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.pill, selectedLocation === loc.id && styles.activePill]}
              onPress={() => setSelectedLocation(loc.id)}
            >
              <Text style={[styles.pillText, selectedLocation === loc.id && styles.activePillText]}>{loc.city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Facility Filter Pills */}
      {facilities.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
            {facilities.map((fac) => {
              const active = selectedFacilities.includes(fac.id);
              return (
                <TouchableOpacity
                  key={fac.id}
                  style={[styles.tagPill, active && styles.activeTagPill]}
                  onPress={() => toggleFacility(fac.id)}
                >
                  <Text style={[styles.tagText, active && styles.activeTagText]}>{fac.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Space List */}
      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Searching available spaces...</Text>
        </View>
      ) : spaces.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Building2 color="#475569" size={48} />
          <Text style={styles.emptyTitle}>No Workspaces Found</Text>
          <Text style={styles.emptySub}>Try adjusting your search query or clear filters.</Text>
        </View>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          renderItem={({ item }) => {
            const imageUrl = resolveImageUrl(item.images);
            const startingPrice = item.membershipPlans?.[0]?.price || '99';

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: '/spaces/[id]',
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  {item.location?.city && (
                    <View style={styles.locationBadge}>
                      <MapPin color="#ffffff" size={10} />
                      <Text style={styles.locationBadgeText}>{item.location.city}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.spaceName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Star color="#f59e0b" fill="#f59e0b" size={13} />
                      <Text style={styles.ratingText}>{(item.ratingAvg || 4.5).toFixed(1)}</Text>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <MapPin color="#64748b" size={14} />
                    <Text style={styles.subText} numberOfLines={1}>
                      {item.address || 'Address details in space page'}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Clock color="#64748b" size={14} />
                    <Text style={styles.subText}>
                      {item.openingTime || '08:00 AM'} - {item.closingTime || '10:00 PM'}
                    </Text>
                  </View>

                  {/* Facility Tags on Card */}
                  {item.facilities && item.facilities.length > 0 && (
                    <View style={styles.facilityRow}>
                      {item.facilities.slice(0, 3).map((f: any, idx: number) => (
                        <View key={f.id || idx} style={styles.miniChip}>
                          <Text style={styles.miniChipText}>{f.name || f}</Text>
                        </View>
                      ))}
                      {item.facilities.length > 3 && (
                        <Text style={styles.moreChipText}>+{item.facilities.length - 3} more</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Starting from</Text>
                      <Text style={styles.priceVal}>
                        ₹{startingPrice}
                        <Text style={styles.priceUnit}> / day</Text>
                      </Text>
                    </View>
                    <View style={styles.bookBtn}>
                      <Text style={styles.bookBtnText}>Explore Space</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 16, gap: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  badgeSparkle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  badgeSparkleText: { color: '#818cf8', fontSize: 11, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchInput: { flex: 1, color: '#f8fafc', paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  filterSection: { marginBottom: 8 },
  scrollPadding: { paddingHorizontal: 16 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activePill: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  pillText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  activePillText: { color: '#ffffff', fontWeight: '700' },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeTagPill: { borderColor: '#818cf8', backgroundColor: '#1e1b4b' },
  tagText: { fontSize: 11, color: '#64748b' },
  activeTagText: { color: '#818cf8', fontWeight: '600' },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 13 },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  listContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: '#0f172a', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  imageContainer: { position: 'relative', width: '100%', height: 170, backgroundColor: '#1e293b' },
  cardImage: { width: '100%', height: '100%' },
  locationBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationBadgeText: { color: '#f8fafc', fontSize: 10, fontWeight: '600' },
  cardBody: { padding: 14, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spaceName: { fontSize: 16, fontWeight: '700', color: '#f8fafc', flex: 1, marginRight: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subText: { color: '#94a3b8', fontSize: 12, flex: 1 },
  facilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  miniChip: { backgroundColor: '#1e1b4b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  miniChipText: { color: '#818cf8', fontSize: 10, fontWeight: '500' },
  moreChipText: { color: '#64748b', fontSize: 10 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  priceLabel: { fontSize: 10, color: '#64748b' },
  priceVal: { fontSize: 16, fontWeight: '700', color: '#818cf8' },
  priceUnit: { fontSize: 11, color: '#94a3b8', fontWeight: '400' },
  bookBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  bookBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});