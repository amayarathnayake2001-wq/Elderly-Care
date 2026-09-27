import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.title}>Data We Collect</Text>
          <Text style={styles.content}>• Caregiver information</Text>
          <Text style={styles.content}>• Elderly person information</Text>
          <Text style={styles.content}>• Health monitoring data</Text>
          <Text style={styles.content}>• Emergency alert data</Text>
          <Text style={styles.content}>• Device information</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>How Data Is Used</Text>
          <Text style={styles.content}>• Elderly person's safety monitoring</Text>
          <Text style={styles.content}>• Health status monitoring</Text>
          <Text style={styles.content}>• Emergency alert generation</Text>
          <Text style={styles.content}>• Caregiver notifications</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Data Protection</Text>
          <Text style={styles.content}>• Personal information should be protected.</Text>
          <Text style={styles.content}>• Health information should only be accessed by authorized users.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>User Control</Text>
          <Text style={styles.content}>• User can update profile information.</Text>
          <Text style={styles.content}>• User can manage notifications.</Text>
          <Text style={styles.content}>• User can logout from the account.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderRadius: 8,
  },
  title: { ...typography.title, color: colors.primary, marginBottom: spacing.s },
  content: { ...typography.body, color: colors.textSecondary, marginBottom: 4, lineHeight: 22 },
});
