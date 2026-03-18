import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/constants';
import { getDashboard } from '../services/driverService';
import {
  getCheckpointStatus,
  startShift,
  reachedUniversity,
  startReturn,
  reachedHome,
} from '../services/checkpointService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// ─── Phase meta ──────────────────────────────────────────────────────────────
const PHASE_META = {
  not_started: { label: 'Not Started',    color: COLORS.textMuted,    bg: COLORS.surfaceAlt,      icon: 'time-outline' },
  boarding:    { label: 'Boarding',        color: COLORS.success,      bg: COLORS.successLight,    icon: 'enter-outline' },
  at_university:{ label: 'At University', color: COLORS.warning,      bg: COLORS.warningLight,    icon: 'school-outline' },
  returning:   { label: 'Returning',      color: COLORS.primary,      bg: COLORS.primaryLight,    icon: 'arrow-back-circle-outline' },
  completed:   { label: 'Completed',      color: COLORS.info,         bg: COLORS.infoLight,       icon: 'checkmark-circle-outline' },
};

// ─── Trip action config ───────────────────────────────────────────────────────
const TRIP_ACTIONS = [
  { id: 'start-shift',        label: 'Start Shift',    icon: 'play-circle-outline',   enabledOn: ['not_started'] },
  { id: 'reached-university', label: 'Reached Uni',   icon: 'school-outline',        enabledOn: ['boarding'] },
  { id: 'start-return',       label: 'Start Return',  icon: 'refresh-circle-outline',enabledOn: ['at_university'] },
  { id: 'reached-home',       label: 'Reached Home',  icon: 'home-outline',          enabledOn: ['returning'] },
];

const DriverDashboardScreen = ({ navigation }) => {
  const [dashboard, setDashboard] = useState(null);
  const [checkpoint, setCheckpoint] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');

  const [odometerModal, setOdometerModal] = useState(false);
  const [odometerAction, setOdometerAction] = useState('');
  const [odometerValue, setOdometerValue]   = useState('');
  const [actionLoading, setActionLoading]   = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [dash, cp] = await Promise.all([getDashboard(), getCheckpointStatus()]);
      setDashboard(dash);
      setCheckpoint(cp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openOdometerModal = (action) => {
    setOdometerAction(action);
    setOdometerValue('');
    setOdometerModal(true);
  };

  const handleCheckpointAction = async () => {
    const reading = parseFloat(odometerValue);
    if (!reading || reading <= 0) { Alert.alert('Error', 'Please enter a valid odometer reading.'); return; }
    setActionLoading(true);
    try {
      switch (odometerAction) {
        case 'start-shift':        await startShift(reading);        break;
        case 'reached-university': await reachedUniversity(reading); break;
        case 'start-return':       await startReturn(reading);       break;
        case 'reached-home':       await reachedHome(reading);       break;
      }
      setOdometerModal(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchData} />;

  const driver    = dashboard?.driver;
  const analytics = dashboard?.analytics;
  const phase     = checkpoint?.currentPhase || 'not_started';
  const phaseMeta = PHASE_META[phase] || PHASE_META.not_started;
  const canScan   = phase === 'boarding' || phase === 'returning';

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Greeting Header ── */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingLabel}>Good day,</Text>
            <Text style={styles.greetingName}>{driver?.name || 'Driver'}</Text>
          </View>
          <View style={styles.driverBadge}>
            <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
            <Text style={styles.driverIdText}>{driver?.employeeId}</Text>
          </View>
        </View>

        {/* ── Phase Card ── */}
        <View style={[styles.phaseCard, { borderLeftColor: phaseMeta.color }]}>
          <View style={[styles.phaseIconBox, { backgroundColor: phaseMeta.bg }]}>
            <Ionicons name={phaseMeta.icon} size={26} color={phaseMeta.color} />
          </View>
          <View style={styles.phaseText}>
            <Text style={styles.phaseLabel}>CURRENT PHASE</Text>
            <Text style={[styles.phaseValue, { color: phaseMeta.color }]}>{phaseMeta.label}</Text>
          </View>
          {checkpoint?.studentCount !== undefined && (
            <View style={[styles.phaseCountBox, { backgroundColor: phaseMeta.bg }]}>
              <Text style={[styles.phaseCountNum, { color: phaseMeta.color }]}>{checkpoint.studentCount}</Text>
              <Text style={[styles.phaseCountLabel, { color: phaseMeta.color }]}>Students</Text>
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard icon="people-outline"     label="Checked In"    value={analytics?.checkedIn    ?? '—'} />
          <StatCard icon="ticket-outline"      label="Total Booked"  value={analytics?.totalPassengers ?? '—'} />
          <StatCard icon="cash-outline"        label="Revenue"       value={analytics?.revenue ? `₹${analytics.revenue}` : '₹0'} />
        </View>

        {/* ── Scan QR ── */}
        <TouchableOpacity
          style={[styles.scanBtn, !canScan && styles.scanBtnDisabled]}
          onPress={() => navigation.navigate('ScanQRCode')}
          disabled={!canScan}
          activeOpacity={0.85}
          testID="btn-open-scanner"
        >
          <View style={[styles.scanIconBox, !canScan && styles.scanIconBoxDisabled]}>
            <Ionicons name="qr-code-outline" size={28} color={canScan ? COLORS.white : COLORS.textMuted} />
          </View>
          <View style={styles.scanTextCol}>
            <Text style={[styles.scanTitle, !canScan && styles.scanTitleDisabled]}>Scan Student QR Code</Text>
            <Text style={[styles.scanSub, !canScan && styles.scanSubDisabled]}>
              {canScan ? 'Tap to open camera scanner' : 'Start your shift first to enable scanning'}
            </Text>
          </View>
          {canScan && <Ionicons name="chevron-forward" size={22} color={COLORS.white} />}
        </TouchableOpacity>

        {/* ── Trip Controls ── */}
        <Text style={styles.sectionTitle}>Trip Controls</Text>
        <View style={styles.actionsGrid}>
          {TRIP_ACTIONS.map(action => {
            const enabled = action.enabledOn.includes(phase);
            return (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionBtn, enabled && styles.actionBtnActive]}
                onPress={() => openOdometerModal(action.id)}
                disabled={!enabled}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={action.icon}
                  size={26}
                  color={enabled ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.actionLabel, enabled && styles.actionLabelActive]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Route Info button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnActive]}
            onPress={() => navigation.navigate('RouteDetails')}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={26} color={COLORS.primary} />
            <Text style={[styles.actionLabel, styles.actionLabelActive]}>Route Info</Text>
          </TouchableOpacity>
        </View>

        {/* ── Odometer Modal ── */}
        <Modal visible={odometerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Odometer Reading</Text>
              <Text style={styles.modalSub}>
                {odometerAction.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
              <View style={styles.modalInputRow}>
                <MaterialCommunityIcons name="counter" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 45231"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={odometerValue}
                  onChangeText={setOdometerValue}
                  autoFocus
                />
                <Text style={styles.modalUnit}>km</Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setOdometerModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckpointAction} disabled={actionLoading}>
                  {actionLoading
                    ? <ActivityIndicator color={COLORS.white} />
                    : <Text style={styles.confirmText}>Confirm</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={22} color={COLORS.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },

  // Greeting
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  greetingName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  driverBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  driverIdText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginTop: 2 },

  // Phase
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    gap: 14,
    ...SHADOW.card,
  },
  phaseIconBox: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  phaseText: { flex: 1 },
  phaseLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  phaseValue: { fontSize: 18, fontWeight: '800', marginTop: 3 },
  phaseCountBox: { borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  phaseCountNum: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  phaseCountLabel: { fontSize: 11, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    ...SHADOW.card,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500' },

  // Scan QR
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 24,
    gap: 14,
    ...SHADOW.elevated,
  },
  scanBtnDisabled: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  scanIconBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  scanIconBoxDisabled: { backgroundColor: COLORS.surfaceAlt },
  scanTextCol: { flex: 1 },
  scanTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  scanTitleDisabled: { color: COLORS.textSecondary },
  scanSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  scanSubDisabled: { color: COLORS.textMuted },

  // Section
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14, letterSpacing: 0.2 },

  // Action grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: {
    width: '22%',
    flex: 1,
    minWidth: 74,
    maxWidth: 100,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.card,
    opacity: 0.45,
  },
  actionBtnActive: {
    opacity: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.surface,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  actionLabelActive: { color: COLORS.textPrimary },

  // Odometer Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 28,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, fontWeight: '500' },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 24,
  },
  modalInput: { flex: 1, fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  modalUnit: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },
  confirmBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

export default DriverDashboardScreen;
