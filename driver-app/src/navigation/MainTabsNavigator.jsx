import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

import DriverDashboardScreen from '../screens/DriverDashboardScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={DriverDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={DriverProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabsNavigator;
