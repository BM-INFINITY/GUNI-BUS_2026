import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { getRouteDetails } from '../services/driverService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const RouteDetailsScreen = ({ navigation }) => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchRoute = useCallback(async () => {
    try {
      setError('');
      const data = await getRouteDetails();
      setRoute(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoute();
  };

  if (loading) return <LoadingSpinner message="Loading route details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchRoute} />;
  if (!route) return <ErrorMessage message="No route assigned to you." />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Route Card */}
      <View style={styles.routeCard}>
        <View style={styles.routeBadge}>
          <Text style={styles.routeNumber}>{route.routeNumber || '—'}</Text>
        </View>
        <Text style={styles.routeName}>{route.routeName || 'Unnamed Route'}</Text>

        <View style={styles.journeyRow}>
          <View style={styles.journeyPoint}>
            <View style={[styles.journeyDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.journeyLabel}>Start</Text>
            <Text style={styles.journeyValue}>{route.startPoint || '—'}</Text>
          </View>
          <View style={styles.journeyLine} />
          <View style={styles.journeyPoint}>
            <View style={[styles.journeyDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.journeyLabel}>End</Text>
            <Text style={styles.journeyValue}>{route.endPoint || '—'}</Text>
          </View>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <InfoCard icon="🏫" label="Shift" value={route.shift?.toUpperCase() || '—'} />
        <InfoCard icon="🚌" label="Capacity" value={route.capacity ? `${route.capacity} seats` : '—'} />
        <InfoCard icon="📍" label="Total Stops" value={route.stops?.length ? `${route.stops.length} stops` : '—'} />
        <InfoCard icon="⏰" label="Status" value={route.status || 'active'} />
      </View>

      {/* Stops List */}
      {route.stops && route.stops.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stops</Text>
          {route.stops.map((stop, index) => (
            <View key={index} style={styles.stopItem}>
              <View style={styles.stopIndex}>
                <Text style={styles.stopIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.name || stop.stopName || `Stop ${index + 1}`}</Text>
                {stop.time && <Text style={styles.stopTime}>{stop.time}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },

  routeCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  routeBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  routeNumber: { color: COLORS.white, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  routeName: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },

  journeyRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  journeyPoint: { flex: 1, alignItems: 'center' },
  journeyDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 6 },
  journeyLabel: { color: COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  journeyValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  journeyLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 8, marginBottom: 14 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  infoCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  infoIcon: { fontSize: 22, marginBottom: 6 },
  infoLabel: { color: COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginTop: 2 },

  section: { padding: 16 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  stopIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIndexText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  stopInfo: { flex: 1 },
  stopName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  stopTime: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});

export default RouteDetailsScreen;
