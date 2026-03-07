import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../utils/constants';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default LoadingSpinner;
