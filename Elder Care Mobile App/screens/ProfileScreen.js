import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function ProfileScreen({ navigation }) {
  const { caregiver } = useContext(UserContext);
  
  const handleLogout = () => {
    navigation.replace('Login');
  };

  const renderMenuItem = (icon, title, onPress) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.avatar}>
            {caregiver.profilePic ? (
              <Image source={{ uri: caregiver.profilePic }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Ionicons name="person" size={40} color={colors.primary} />
            )}
          </View>
          <Text style={styles.name}>{caregiver.name}</Text>
          <Text style={styles.role}>{caregiver.role}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports & Summaries</Text>
          {renderMenuItem('document-text-outline', 'Comprehensive Report', () => navigation.navigate('PatientReport'))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderMenuItem('create-outline', 'Edit Profile', () => navigation.navigate('EditProfile'))}
          {renderMenuItem('people-outline', 'Caregiver Details', () => navigation.navigate('CaregiverDetails'))}
          {renderMenuItem('body-outline', 'Elderly Person Details', () => navigation.navigate('ElderlyPersonDetails'))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency & Safety</Text>
          {renderMenuItem('call-outline', 'Emergency Calling', () => navigation.navigate('EmergencyCalling'))}
          {renderMenuItem('notifications-outline', 'Push Notifications', () => navigation.navigate('PushNotifications'))}
          {renderMenuItem('volume-high-outline', 'Critical Alerts Sound', () => navigation.navigate('CriticalAlertsSound'))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          {renderMenuItem('document-text-outline', 'Rules and Conditions', () => navigation.navigate('RulesConditions'))}
          {renderMenuItem('shield-checkmark-outline', 'Privacy Policy', () => navigation.navigate('PrivacyPolicy'))}
          {renderMenuItem('help-circle-outline', 'Help and Support', () => navigation.navigate('HelpSupport'))}
          {renderMenuItem('information-circle-outline', 'About App', () => navigation.navigate('AboutApp'))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{marginRight: 8}}/>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  role: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.l,
    paddingHorizontal: spacing.m,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.primary,
    marginBottom: spacing.m,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.m,
    marginBottom: 2,
    borderRadius: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: spacing.m,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginHorizontal: spacing.m,
    padding: spacing.m,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
