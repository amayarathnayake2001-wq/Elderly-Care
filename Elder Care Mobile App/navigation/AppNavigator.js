import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmergencyAlertsScreen from '../screens/EmergencyAlertsScreen';
import HealthDetailsScreen from '../screens/HealthDetailsScreen';
import MoodScreen from '../screens/MoodScreen';
import AlertHistoryScreen from '../screens/AlertHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import New Settings Screens
import EditProfileScreen from '../screens/EditProfileScreen';
import CaregiverDetailsScreen from '../screens/CaregiverDetailsScreen';
import ElderlyPersonDetailsScreen from '../screens/ElderlyPersonDetailsScreen';
import EmergencyCallingScreen from '../screens/EmergencyCallingScreen';
import PushNotificationsScreen from '../screens/PushNotificationsScreen';
import CriticalAlertsSoundScreen from '../screens/CriticalAlertsSoundScreen';
import RulesConditionsScreen from '../screens/RulesConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import PatientReportScreen from '../screens/PatientReportScreen';
import SignUpScreen from '../screens/SignUpScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Health') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Health" component={HealthDetailsScreen} />
      <Tab.Screen name="Alerts" component={EmergencyAlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MainApp" 
          component={HomeTabs} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Mood" 
          component={MoodScreen} 
          options={{ title: 'Mood Auxiliary' }} 
        />
        <Stack.Screen 
          name="AlertHistory" 
          component={AlertHistoryScreen} 
          options={{ title: 'Alert History' }} 
        />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="CaregiverDetails" component={CaregiverDetailsScreen} options={{ title: 'Caregiver Details' }} />
        <Stack.Screen name="ElderlyPersonDetails" component={ElderlyPersonDetailsScreen} options={{ title: 'Elderly Person Details' }} />
        <Stack.Screen name="EmergencyCalling" component={EmergencyCallingScreen} options={{ title: 'Emergency Calling' }} />
        <Stack.Screen name="PushNotifications" component={PushNotificationsScreen} options={{ title: 'Push Notifications' }} />
        <Stack.Screen name="CriticalAlertsSound" component={CriticalAlertsSoundScreen} options={{ title: 'Critical Alerts Sound' }} />
        <Stack.Screen name="RulesConditions" component={RulesConditionsScreen} options={{ title: 'Rules and Conditions' }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ title: 'Help and Support' }} />
        <Stack.Screen name="AboutApp" component={AboutAppScreen} options={{ title: 'About App' }} />
        <Stack.Screen name="PatientReport" component={PatientReportScreen} options={{ title: 'Comprehensive Report' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
