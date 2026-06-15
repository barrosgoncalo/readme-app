import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';

// Import your main app screens based on your file tree
import BookList from '../screens/Library/BookList';
import MapScreen from '../screens/Events/MapScreen';
import EventChatScreen from '../screens/Chat/EventChatScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const colorScheme = useColorScheme();
  
  // Set your app's primary color
  const activeColor = '#208AEF'; 

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true, // Shows the top header with the screen name
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
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
        name="Chat" 
        component={EventChatScreen} 
        options={{ tabBarLabel: 'Community' }}
      />
    </Tab.Navigator>
  );
}
