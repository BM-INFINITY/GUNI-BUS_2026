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
} from 'react-native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const DriverLoginScreen = () => {
  const { login } = useAuth();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Ref allows keyboard "next" to move focus directly to the password field
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    // ── Input validation ──────────────────────────────────────────────────
    if (!employeeId.trim()) {
      setError('Please enter your Employee ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Calls POST /api/auth/driver/login via AuthContext.
      // On success the context state updates instantly →
      // AppNavigator switches to DriverNavigator without any polling delay.
      await login(employeeId, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Login Card ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.appName}>University Bus System</Text>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.description}>
            Login with your employee ID and password
          </Text>

          {/* Error banner */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          )}

          {/* Employee ID */}
          <Text style={styles.label}>Employee ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. DRV001"
            placeholderTextColor={COLORS.textSecondary}
            value={employeeId}
            onChangeText={(v) => {
              setEmployeeId(v);
              if (error) setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            editable={!loading}
            testID="input-employee-id"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError('');
              }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
              testID="input-password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            testID="btn-login"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { 
    flex: 1, 
    // Teal background to match web .login-container
    backgroundColor: COLORS.secondary, 
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100, // Matching web bottom padding
  },

  // Card (mimmicks .login-box)
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary, // Indigo
    marginBottom: 8,
  },
  title: { 
    color: '#333333', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 24,
  },
  description: { 
    color: '#666666', 
    fontSize: 14, 
    marginBottom: 24 
  },

  // Error (.error-message)
  errorBox: {
    backgroundColor: '#ffeeee', // light red
    borderRadius: 5,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#cc3333', fontSize: 13, lineHeight: 18 },

  // Labels (.form-group label)
  label: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },

  // Inputs (.form-group input)
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 5,
    padding: 12, // 0.75rem approx
    color: '#333333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dddddd',
    marginBottom: 16,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  eyeText: { fontSize: 18 },

  // Button (.auth-button)
  loginBtn: {
    backgroundColor: COLORS.primary, // Indigo
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: { backgroundColor: '#cccccc' },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DriverLoginScreen;
