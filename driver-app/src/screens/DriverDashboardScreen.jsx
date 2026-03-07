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
} from 'react-native';
import { COLORS } from '../utils/constants';
import { getDashboard } from '../services/driverService';
import {
  getCheckpointStatus,
  startShift,
  reachedUniversity,
  startReturn,
  reachedHome,
} from '../services/checkpointService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const PHASE_LABELS = {
  not_started: { label: 'Not Started', color: COLORS.textSecondary, icon: '⏳' },
  boarding: { label: 'Boarding', color: COLORS.success, icon: '🟢' },
  at_university: { label: 'At University', color: COLORS.warning, icon: '🏫' },
  returning: { label: 'Returning', color: COLORS.primary, icon: '🔵' },
  completed: { label: 'Completed', color: COLORS.textSecondary, icon: '✅' },
};

const DriverDashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [checkpoint, setCheckpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Odometer modal
  const [odometerModal, setOdometerModal] = useState(false);
  const [odometerAction, setOdometerAction] = useState('');
  const [odometerValue, setOdometerValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openOdometerModal = (action) => {
    setOdometerAction(action);
    setOdometerValue('');
    setOdometerModal(true);
  };

  const handleCheckpointAction = async () => {
    const reading = parseFloat(odometerValue);
    if (!reading || reading <= 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading.');
      return;
    }
    setActionLoading(true);
    try {
      switch (odometerAction) {
        case 'start-shift': await startShift(reading); break;
        case 'reached-university': await reachedUniversity(reading); break;
        case 'start-return': await startReturn(reading); break;
        case 'reached-home': await reachedHome(reading); break;
      }
      setOdometerModal(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(), // clears AsyncStorage + updates auth state instantly
      },
    ]);
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  const driver = dashboard?.driver;
  const analytics = dashboard?.analytics;
  const phase = checkpoint?.currentPhase || 'not_started';
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.not_started;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.employeeId}>ID: {driver?.employeeId}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Phase Status Card */}
      <View style={[styles.phaseCard, { borderColor: phaseInfo.color }]}>
        <Text style={styles.phaseIcon}>{phaseInfo.icon}</Text>
        <View style={styles.phaseInfo}>
          <Text style={styles.phaseLabel}>Current Phase</Text>
          <Text style={[styles.phaseValue, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
        </View>
        {checkpoint?.studentCount !== undefined && (
          <View style={styles.phaseCount}>
            <Text style={styles.phaseCountNum}>{checkpoint.studentCount}</Text>
            <Text style={styles.phaseCountLabel}>Students</Text>
          </View>
        )}
      </View>

      {/* Analytics Row */}
      <View style={styles.statsRow}>
        <StatCard label="Checked In" value={analytics?.checkedIn ?? '—'} icon="👥" />
        <StatCard label="Total Booked" value={analytics?.totalPassengers ?? '—'} icon="🎫" />
        <StatCard label="Revenue" value={analytics?.revenue ? `₹${analytics.revenue}` : '₹0'} icon="💰" />
      </View>

      {/* Trip Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Controls</Text>

        {/* ── Primary: Scan QR ─ full-width prominent button ─────────── */}
        <TouchableOpacity
          style={[
            styles.scanQRCard,
            (phase !== 'boarding' && phase !== 'returning') && styles.scanQRCardDisabled,
          ]}
          onPress={() => navigation.navigate('ScanQRCode')}
          disabled={phase !== 'boarding' && phase !== 'returning'}
          activeOpacity={0.8}
          testID="btn-open-scanner"
        >
          <Text style={styles.scanQRIcon}>📷</Text>
          <View style={styles.scanQRTextCol}>
            <Text style={styles.scanQRTitle}>Scan Student QR Code</Text>
            <Text style={styles.scanQRSub}>
              {(phase === 'boarding' || phase === 'returning')
                ? 'Tap to open camera scanner'
                : 'Start your shift first to enable scanning'}
            </Text>
          </View>
          {(phase === 'boarding' || phase === 'returning') && (
            <View style={styles.scanQRArrow}>
              <Text style={styles.scanQRArrowText}>›</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Secondary: Trip checkpoint buttons ──────────────────────── */}
        <View style={styles.actionsGrid}>
          <ActionButton
            label="Start Shift"
            icon="▶️"
            disabled={phase !== 'not_started'}
            onPress={() => openOdometerModal('start-shift')}
          />
          <ActionButton
            label="Reached Uni"
            icon="🏫"
            disabled={phase !== 'boarding'}
            onPress={() => openOdometerModal('reached-university')}
          />
          <ActionButton
            label="Start Return"
            icon="🔄"
            disabled={phase !== 'at_university'}
            onPress={() => openOdometerModal('start-return')}
          />
          <ActionButton
            label="Reached Home"
            icon="🏠"
            disabled={phase !== 'returning'}
            onPress={() => openOdometerModal('reached-home')}
          />
          <ActionButton
            label="Route Info"
            icon="🗺️"
            disabled={false}
            onPress={() => navigation.navigate('RouteDetails')}
          />
        </View>
      </View>

      {/* Odometer Modal */}
      <Modal visible={odometerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Odometer Reading</Text>
            <Text style={styles.modalSubtitle}>{odometerAction.replace(/-/g, ' ').toUpperCase()}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 45231"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={odometerValue}
              onChangeText={setOdometerValue}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setOdometerModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckpointAction} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const StatCard = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton = ({ label, icon, onPress, disabled, highlight }) => (
  <TouchableOpacity
    style={[styles.actionBtn, disabled && styles.actionBtnDisabled, highlight && styles.actionBtnHighlight]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: { color: COLORS.textSecondary, fontSize: 13 },
  driverName: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  employeeId: { color: COLORS.textSecondary, fontSize: 12 },
  logoutBtn: { backgroundColor: COLORS.errorBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
  phaseCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  phaseIcon: { fontSize: 32 },
  phaseInfo: { flex: 1 },
  phaseLabel: { color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  phaseValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  phaseCount: { alignItems: 'center' },
  phaseCountNum: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  phaseCountLabel: { color: COLORS.textSecondary, fontSize: 11 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, textAlign: 'center' },
  section: { padding: 16 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },

  // Scan QR primary card
  scanQRCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    gap: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  scanQRCardDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  scanQRIcon: { fontSize: 30 },
  scanQRTextCol: { flex: 1 },
  scanQRTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  scanQRSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  scanQRArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  scanQRArrowText: { color: COLORS.white, fontSize: 20, fontWeight: '700', lineHeight: 24 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnHighlight: { borderColor: COLORS.primary, backgroundColor: '#1e3a5f' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { color: COLORS.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  actionLabelDisabled: { color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 18, letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.surfaceLight, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmText: { color: COLORS.white, fontWeight: '700' },
});

export default DriverDashboardScreen;
