import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const DriverLoginScreen = () => {
  const { login } = useAuth();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const passwordRef = useRef(null);

  const handleLogin = async () => {
    if (!employeeId.trim()) { setError('Employee ID is required.'); return; }
    if (!password)           { setError('Password is required.');    return; }

    setError('');
    setLoading(true);
    try {
      await login(employeeId.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Header ─────────────────────────── */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Ionicons name="bus" size={36} color={COLORS.white} />
            </View>
            <Text style={styles.brandName}>GUNI BUS</Text>
            <Text style={styles.brandSub}>Driver Portal</Text>
          </View>

          {/* ── Card ─────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Enter your employee credentials</Text>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Employee ID */}
            <Text style={styles.label}>Employee ID</Text>
            <View style={[styles.inputRow, focusedField === 'id' && styles.inputRowFocused]}>
              <Ionicons name="id-card-outline" size={18} color={focusedField === 'id' ? COLORS.primary : COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g. DRV001"
                placeholderTextColor={COLORS.textMuted}
                value={employeeId}
                onChangeText={(v) => { setEmployeeId(v); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                editable={!loading}
                onFocus={() => setFocusedField('id')}
                onBlur={() => setFocusedField(null)}
                testID="input-employee-id"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focusedField === 'pw' && styles.inputRowFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'pw' ? COLORS.primary : COLORS.textSecondary} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
                onFocus={() => setFocusedField('pw')}
                onBlur={() => setFocusedField(null)}
                testID="input-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              testID="btn-login"
            >
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <>
                    <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>GUNI University Transportation System</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
  },

  // Brand
  brand: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  brandName: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: 2 },
  brandSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, marginTop: 4, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    ...SHADOW.card,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1, lineHeight: 18 },

  // Label
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.3,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeBtn: { padding: 2 },

  // Button
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    marginTop: 28,
    ...SHADOW.elevated,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  footer: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12, marginTop: 32 },
});

export default DriverLoginScreen;
