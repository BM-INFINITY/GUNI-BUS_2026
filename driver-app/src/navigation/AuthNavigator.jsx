import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DriverLoginScreen from '../screens/DriverLoginScreen';
import WebLoginScreen from '../screens/WebLoginScreen';

const Stack = createStackNavigator();
const USE_WEB_LOGIN = process.env.EXPO_PUBLIC_USE_WEB_LOGIN === 'true';

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen 
      name="Login" 
      component={USE_WEB_LOGIN ? WebLoginScreen : DriverLoginScreen} 
    />
  </Stack.Navigator>
);

export default AuthNavigator;
