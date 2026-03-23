import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { API_BASE_URL } from './src/utils/constants';

const CURRENT_VERSION = '1.0.0';

export default function App() {
  const [appState, setAppState] = useState('loading'); // 'loading', 'ready', 'maintenance', 'update_required'
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/driver/app-version`);
        if (!res.ok) {
          console.warn('Network response was not ok. API might be unreachable or not deployed yet! Allowing app to start.');
          setAppState('ready');
          return;
        }
        
        const data = await res.json();
        
        if (data.maintenanceMode) {
          setAppState('maintenance');
          return;
        }

        const isOutdated = CURRENT_VERSION < data.minVersion; 

        if (isOutdated) {
          setAppData(data);
          setAppState('update_required');
          return;
        }

        setAppState('ready');
      } catch (err) {
        console.warn('App Version Check Failed (Network error or server down). Allowing app to start anyway.', err);
        setAppState('ready'); // Fallback instead of maintenance block
      }
    };
    checkVersion();
  }, []);

  if (appState === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (appState === 'maintenance') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Server Maintenance 🛠️</Text>
        <Text style={styles.subtitle}>The system is currently unreachable.</Text>
        <Text style={styles.subtitle}>Please try again later.</Text>
      </View>
    );
  }

  if (appState === 'update_required') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Update Required ⚠️</Text>
        <Text style={styles.subtitle}>Your app version ({CURRENT_VERSION}) is outdated.</Text>
        {appData?.updateUrl && (
           <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(appData.updateUrl)}>
             <Text style={styles.btnText}>Download Update</Text>
           </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0F172A',
    padding: 20,
  },
  title: {
    fontSize: 24, 
    fontWeight: '700', 
    color: '#FFF', 
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16, 
    color: '#94A3B8', 
    marginBottom: 5,
    textAlign: 'center'
  },
  btn: {
    marginTop: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16
  }
});
