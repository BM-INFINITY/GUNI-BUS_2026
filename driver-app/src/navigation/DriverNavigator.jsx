import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';
import DriverDashboardScreen from '../screens/DriverDashboardScreen';
import ScanQRCodeScreen from '../screens/ScanQRCodeScreen';
import RouteDetailsScreen from '../screens/RouteDetailsScreen';

const Stack = createStackNavigator();

const DriverNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="Dashboard" component={DriverDashboardScreen} />
    <Stack.Screen name="ScanQRCode" component={ScanQRCodeScreen} />
    <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
  </Stack.Navigator>
);

export default DriverNavigator;
