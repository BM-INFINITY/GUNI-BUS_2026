import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';
import MainTabsNavigator from './MainTabsNavigator';
import ScanQRCodeScreen from '../screens/ScanQRCodeScreen';
import RouteDetailsScreen from '../screens/RouteDetailsScreen';
import ReportFoundItemScreen from '../screens/ReportFoundItemScreen';

const Stack = createStackNavigator();

const DriverNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
    <Stack.Screen name="ScanQRCode" component={ScanQRCodeScreen} />
    <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
    <Stack.Screen name="ReportFoundItem" component={ReportFoundItemScreen} />
  </Stack.Navigator>
);

export default DriverNavigator;
