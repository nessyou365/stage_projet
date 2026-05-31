import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import auth from '@react-native-firebase/auth';

import HomeScreen from './src/screens/HomeScreen';
import JobsScreen from './src/screens/JobsScreen';
import SpontaneousScreen from './src/screens/SpontaneousScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import InterviewScreen from './src/screens/InterviewScreen';
import ApplicationStatusScreen from './src/screens/ApplicationStatusScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
      tabBarActiveTintColor: '#4f46e5',
      tabBarInactiveTintColor: '#9ca3af',
      headerShown: false,
    }}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
    <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: 'Offres' }} />
    <Tab.Screen name="Spontaneous" component={SpontaneousScreen} options={{ title: 'Spontané' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifs' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
  </Tab.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ApplicationStatus" component={ApplicationStatusScreen} options={{ headerShown: true, title: "Statut candidature" }} />
          <Stack.Screen name="Interview" component={InterviewScreen} options={{ headerShown: true, title: "Entretien" }} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ headerShown: true, title: "Détail de l'offre" }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
