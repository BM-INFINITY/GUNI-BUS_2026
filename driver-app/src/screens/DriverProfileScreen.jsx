import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const DriverProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!user) return null;

  const initial = user.name?.charAt(0)?.toUpperCase() || 'D';

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* ── Avatar Header ── */}
        <View style={styles.header}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user.name || 'Driver'}</Text>
          <Text style={styles.role}>GUNI University — Driver</Text>
        </View>

        {/* ── Account Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <InfoRow icon="id-card-outline" label="Employee ID" value={user.employeeId} />
          <InfoRow icon="time-outline"    label="Shift"       value={user.shift?.toUpperCase() || 'N/A'} isLast />
        </View>

        {/* ── Assignment Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assignment</Text>

          <InfoRow
            icon="map-outline"
            label="Route"
            value={user.assignedRoute?.routeName || 'Unassigned'}
          />
          <InfoRow
            icon="bus-outline"
            label="Bus Number"
            value={user.assignedBus?.busNumber || 'Unassigned'}
            isLast
          />
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App v1.0.0</Text>
      </ScrollView>
    </>
  );
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <View style={styles.infoIconBox}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },

  header: { alignItems: 'center', marginBottom: 28 },
  avatarBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    ...SHADOW.elevated,
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  role: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 16,
    ...SHADOW.card,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIconBox: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.danger + '55',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 24 },
});

export default DriverProfileScreen;
