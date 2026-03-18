import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/constants';
import { getRouteDetails } from '../services/driverService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const RouteDetailsScreen = ({ navigation }) => {
  const [route, setRoute]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

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
  const onRefresh = () => { setRefreshing(true); fetchRoute(); };

  if (loading) return <LoadingSpinner message="Loading route details..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchRoute} />;
  if (!route)  return <ErrorMessage message="No route assigned to you." />;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Screenbar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Route Details</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* ── Route Identity Card ── */}
        <View style={styles.routeCard}>
          <View style={styles.routeBadge}>
            <Ionicons name="bus" size={18} color={COLORS.white} />
            <Text style={styles.routeNumber}>{route.routeNumber || 'N/A'}</Text>
          </View>
          <Text style={styles.routeName}>{route.routeName || 'Unnamed Route'}</Text>

          <View style={styles.journeyRow}>
            <View style={styles.journeyPoint}>
              <View style={[styles.journeyDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.journeyTag}>START</Text>
              <Text style={styles.journeyVal}>{route.startPoint || '—'}</Text>
            </View>
            <View style={styles.journeyLine} />
            <View style={styles.journeyPoint}>
              <View style={[styles.journeyDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.journeyTag}>END</Text>
              <Text style={styles.journeyVal}>{route.endPoint || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Info Grid ── */}
        {(() => {
          // The Route model stores shifts as an array: route.shifts[].shiftType & .stops
          const shifts = route.shifts || [];
          const shiftLabels = shifts.map(s => s.shiftType?.charAt(0).toUpperCase() + s.shiftType?.slice(1)).join(' & ') || '—';
          const totalStops = shifts.reduce((sum, s) => sum + (s.stops?.length || 0), 0);
          return (
            <View style={styles.infoGrid}>
              <InfoTile icon="time-outline"     label="Shifts"    value={shiftLabels} />
              <InfoTile icon="location-outline" label="Stops"     value={totalStops ? `${totalStops} stops` : '—'} />
              <InfoTile icon="radio-button-on"  label="Status"    value={route.isActive ? 'Active' : 'Inactive'} />
              <InfoTile icon="cash-outline"     label="Semester"  value={route.semesterCharge ? `₹${route.semesterCharge}` : '—'} />
            </View>
          );
        })()}

        {/* ── Stops List (per shift) ── */}
        {(route.shifts || []).map((shift, sIdx) => (
          shift.stops?.length > 0 && (
            <View key={sIdx} style={styles.section}>
              <View style={styles.shiftHeader}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>
                  {shift.shiftType?.charAt(0).toUpperCase() + shift.shiftType?.slice(1)} Shift Stops
                </Text>
              </View>
              {shift.stops.map((stop, idx) => (
                <View key={idx} style={styles.stopCard}>
                  <View style={styles.stopIndex}>
                    <Text style={styles.stopIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{stop.name || `Stop ${idx + 1}`}</Text>
                    {stop.arrivalTime && <Text style={styles.stopTime}>{stop.arrivalTime}</Text>}
                  </View>
                  <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                </View>
              ))}
            </View>
          )
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
};

const InfoTile = ({ icon, label, value }) => (
  <View style={styles.infoTile}>
    <Ionicons name={icon} size={22} color={COLORS.primary} />
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={styles.tileValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 52,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  topTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },

  routeCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: 'center',
    ...SHADOW.card,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 14,
  },
  routeNumber: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  routeName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 22, textAlign: 'center' },

  journeyRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  journeyPoint: { flex: 1, alignItems: 'center', gap: 4 },
  journeyDot: { width: 12, height: 12, borderRadius: 6 },
  journeyTag: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  journeyVal: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  journeyLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 10, marginBottom: 16 },

  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12, marginBottom: 8,
  },
  infoTile: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center', gap: 6,
    ...SHADOW.card,
  },
  tileLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  tileValue: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },

  section: { padding: 16 },
  shiftHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...SHADOW.card,
  },
  stopIndex: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  stopIndexText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  stopTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
});

export default RouteDetailsScreen;
