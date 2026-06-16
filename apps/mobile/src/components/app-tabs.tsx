import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { Colors } from '@readme/shared/src/constants/theme';

import BookList from '../screens/Library/BookList';
import MapScreen from '../screens/Events/MapScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const colorScheme = useColorScheme();
  const activeColor = '#208AEF'; 

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true, // Mantém globalmente, mas vamos sobrepor no perfil
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
        }
      }}
    >
      <Tab.Screen 
        name="Library" 
        component={BookList} 
        options={{ tabBarLabel: 'My Books' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'Profile',
          headerShown: false,
        }} 
      />
    </Tab.Navigator>
  );
}
