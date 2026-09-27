import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

export default function PushNotificationsScreen() {
  const [toggles, setToggles] = useState({
    fall: true,
    sos: true,
    heart: true,
    spo2: true,
    temp: false,
    activity: false,
    disconnect: true,
    mood: false,
  });

  const toggleSwitch = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderToggle = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={toggles[key]} onValueChange={() => toggleSwitch(key)} trackColor={{ true: colors.primary }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <View style={styles.card}>
          {renderToggle('Fall Detection', 'fall')}
          <View style={styles.divider} />
          {renderToggle('SOS Alert', 'sos')}
          <View style={styles.divider} />
          {renderToggle('Abnormal Heart Rate', 'heart')}
          <View style={styles.divider} />
          {renderToggle('Low SpO₂', 'spo2')}
          <View style={styles.divider} />
          {renderToggle('Abnormal Temperature', 'temp')}
          <View style={styles.divider} />
          {renderToggle('Unusual Activity', 'activity')}
          <View style={styles.divider} />
          {renderToggle('Device Disconnected', 'disconnect')}
          <View style={styles.divider} />
          {renderToggle('Mood Alert', 'mood')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.title, color: colors.text, marginBottom: spacing.m },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.m,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  label: { ...typography.body, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
});
