import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DriverLoginScreen from '../screens/DriverLoginScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={DriverLoginScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
