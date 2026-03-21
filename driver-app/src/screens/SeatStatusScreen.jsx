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
import { getDashboard, getSeatMap } from '../services/driverService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ───────────── Helpers ─────────────
function toDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ───────────── Layout Generator ─────────────
function generateSeatLayout(totalSeats) {
  const rows = [];
  let seatNum = 1;
  while (seatNum <= totalSeats) {
    const row = [];
    // Left side: 2 seats
    for (let i = 0; i < 2 && seatNum <= totalSeats; i++) {
      row.push({ num: seatNum, window: i === 0 });
      seatNum++;
    }
    row.push({ num: null, aisle: true }); // aisle gap
    // Right side: 3 seats
    for (let i = 0; i < 3 && seatNum <= totalSeats; i++) {
      row.push({ num: seatNum, window: i === 2 });
      seatNum++;
    }
    rows.push(row);
  }
  return rows;
}

const SeatStatusScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const [busData, setBusData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  
  const [direction, setDirection] = useState('home_to_uni');
  const [seatMapData, setSeatMapData] = useState(null);
  
  const fetchDashboardAndMap = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      
      const dash = await getDashboard();
      const driver = dash?.driver;
      
      if (!driver?.assignedBus || !driver?.assignedRoute) {
        setBusData(null);
        setRouteData(null);
        setLoading(false);
        setRefreshing(false);
        return; // Driver has no active bus/route
      }
      
      const bus = driver.assignedBus;
      const route = driver.assignedRoute;
      
      setBusData(bus);
      setRouteData(route);
      
      // Fetch seat map
      const today = toDateKey(new Date());
      const mapRes = await getSeatMap(bus._id, today, route._id, direction);
      setSeatMapData(mapRes);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch seat status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [direction]);

  useEffect(() => {
    fetchDashboardAndMap();
  }, [fetchDashboardAndMap]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardAndMap();
  };

  if (loading && !refreshing) return <LoadingSpinner message="Loading seat status..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboardAndMap} />;

  if (!busData || !routeData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bus-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No Assigment Available</Text>
        <Text style={styles.emptySub}>You must be assigned to a bus and route to view the seat map.</Text>
      </View>
    );
  }

  // Generate grid logic
  const totalSeats = seatMapData?.totalSeats || busData.capacity || 50;
  const takenSeats = seatMapData?.takenSeats || [];
  const seatRows = generateSeatLayout(totalSeats);
  
  const renderSeatCell = (seat, cellIdx) => {
    if (!seat || seat.aisle) {
      return <View key={cellIdx} style={styles.seatCellAisle} />;
    }
    
    const isTaken = takenSeats.includes(seat.num);
    
    return (
      <View
        key={cellIdx}
        style={[
          styles.seatCell,
          isTaken ? styles.seatCellTaken : styles.seatCellAvailable
        ]}
      >
        <Text style={[
          styles.seatCellText,
          isTaken ? styles.seatCellTextTaken : styles.seatCellTextAvailable
        ]}>
          {seat.num}
        </Text>
        {seat.window && !isTaken && (
          <View style={styles.windowDot} />
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Live Seat Status</Text>
          <Text style={styles.subtitle}>
            {busData.busNumber} • {routeData.routeNumber}
          </Text>
        </View>

        {/* Direction Toggle */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, direction === 'home_to_uni' && styles.segmentBtnActive]}
            onPress={() => setDirection('home_to_uni')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, direction === 'home_to_uni' && styles.segmentTextActive]}>
              Home → Uni
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, direction === 'uni_to_home' && styles.segmentBtnActive]}
            onPress={() => setDirection('uni_to_home')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, direction === 'uni_to_home' && styles.segmentTextActive]}>
              Uni → Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
            <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: COLORS.white, borderColor: COLORS.border }]} />
                <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Reserved</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.windowDot, { position: 'relative', top: 0, right: 0, marginRight: 4 }]} />
                <Text style={styles.legendText}>Window</Text>
            </View>
        </View>

        {/* Seat Map */}
        <View style={styles.mapCard}>
          <Text style={styles.frontIndicator}>FRONT OF BUS</Text>
          <View style={styles.gridContainer}>
            {seatRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.seatRow}>
                <Text style={styles.rowLabel}>{rowIdx + 1}</Text>
                {row.map((seat, cellIdx) => renderSeatCell(seat, cellIdx))}
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Occupancy: <Text style={styles.summaryBold}>{takenSeats.length} / {totalSeats}</Text> seats reserved.
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 16, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.white, ...SHADOW.card },
  segmentText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  segmentTextActive: { color: COLORS.primary },
  
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendBox: { width: 14, height: 14, borderRadius: 3, marginRight: 6, borderWidth: 1 },
  legendText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    paddingVertical: 24,
    ...SHADOW.elevated,
    alignItems: 'center', // Center the grid
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frontIndicator: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 20,
  },
  
  gridContainer: {
    alignItems: 'flex-start',
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: {
    width: 20,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'right',
    marginRight: 10,
    fontFamily: 'monospace',
  },
  seatCellAisle: {
    width: 38,
    height: 38,
    marginHorizontal: 3,
  },
  seatCell: {
    width: 38,
    height: 38,
    marginHorizontal: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatCellAvailable: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  seatCellTaken: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  seatCellText: {
    fontSize: 11,
    fontWeight: '800',
  },
  seatCellTextAvailable: {
    color: COLORS.textSecondary,
  },
  seatCellTextTaken: {
    color: COLORS.white,
  },
  windowDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.info,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  
  summaryBar: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.primary,
  },
  summaryBold: {
    fontWeight: '800',
  }
});

export default SeatStatusScreen;
