import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

/**
 * StudentCard
 * Displayed after a successful QR scan to show student info
 */
const StudentCard = ({ student, scanPhase, route, shift }) => {
  const isBoarding = scanPhase === 'boarding';

  return (
    <View style={[styles.card, isBoarding ? styles.boardingCard : styles.returnCard]}>
      {/* Phase Badge */}
      <View style={[styles.badge, isBoarding ? styles.boardingBadge : styles.returnBadge]}>
        <Text style={styles.badgeText}>
          {isBoarding ? '🟢 BOARDING' : '🔵 RETURN'}
        </Text>
      </View>

      {/* Student Name */}
      <Text style={styles.name}>{student?.name || 'N/A'}</Text>
      <Text style={styles.enrollment}>{student?.enrollment || ''}</Text>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <InfoItem label="Route" value={route} />
        <InfoItem label="Shift" value={shift?.toUpperCase()} />
      </View>

      {student?.mobile ? (
        <InfoItem label="Mobile" value={student.mobile} />
      ) : null}
    </View>
  );
};

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
  },
  boardingCard: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
  },
  returnCard: {
    backgroundColor: '#172554',
    borderColor: COLORS.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  boardingBadge: {
    backgroundColor: COLORS.success + '33',
  },
  returnBadge: {
    backgroundColor: COLORS.primary + '33',
  },
  badgeText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  enrollment: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  infoItem: {
    marginBottom: 6,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default StudentCard;
