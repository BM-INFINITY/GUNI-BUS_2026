import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/constants';

const WebLoginScreen = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();

    const handleSubmit = async () => {
        if (!loginId.trim() || !password) {
            setError('Please enter both Employee ID and password.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await login(loginId.trim(), password);
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.loginContainer}>
                    <View style={styles.loginBox}>
                        <Text style={styles.h1}>University Bus System</Text>
                        <Text style={styles.h2}>Login</Text>
                        <Text style={styles.subtitle}>
                            Login with your enrollment number and password
                        </Text>

                        {!!error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorMessage}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Enrollment No. / Employee ID</Text>
                            <TextInput
                                style={styles.input}
                                value={loginId}
                                onChangeText={setLoginId}
                                placeholder="Enter Enrollment No. or Employee ID"
                                placeholderTextColor="#999"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.primaryBtn, loading && styles.disabledBtn]} 
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.btnText}>Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loginBox: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        ...SHADOW.elevated,
    },
    h1: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    h2: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
    },
    errorBox: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 4,
        marginBottom: 20,
    },
    errorMessage: {
        color: '#d32f2f',
        textAlign: 'center',
        fontSize: 14,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        display: 'flex',
        marginBottom: 8,
        fontWeight: 'bold',
        color: '#555',
        fontSize: 14,
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    primaryBtn: {
        width: '100%',
        padding: 14,
        backgroundColor: '#0056b3',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    disabledBtn: {
        backgroundColor: '#6c757d',
        opacity: 0.8,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WebLoginScreen;
