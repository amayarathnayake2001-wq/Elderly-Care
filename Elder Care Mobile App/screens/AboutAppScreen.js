import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

export default function AboutAppScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.appName}>ElderCareApp</Text>
          <Text style={styles.version}>Version: 1.0.0</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.title}>Developed for:</Text>
          <Text style={styles.content}>Elderly Care Monitoring</Text>
          
          <Text style={styles.title}>Technology:</Text>
          <Text style={styles.content}>React Native / Expo</Text>
          
          <Text style={styles.title}>IoT Device:</Text>
          <Text style={styles.content}>ESP32</Text>
          
          <Text style={styles.title}>AI Feature:</Text>
          <Text style={styles.content}>Mood Detection</Text>
          
          <Text style={styles.title}>Backend:</Text>
          <Text style={styles.content}>Firebase</Text>
        </View>

        <View style={styles.linksCard}>
          <Text style={styles.linkText}>Terms & Conditions</Text>
          <View style={styles.divider} />
          <Text style={styles.linkText}>Privacy Policy</Text>
          <View style={styles.divider} />
          <Text style={styles.linkText}>Open Source Licenses</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  appName: {
    ...typography.header,
    color: colors.primary,
    marginBottom: spacing.s,
  },
  version: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.m,
  },
  title: {
    ...typography.title,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.s,
  },
  content: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  linksCard: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    paddingVertical: spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  }
});
