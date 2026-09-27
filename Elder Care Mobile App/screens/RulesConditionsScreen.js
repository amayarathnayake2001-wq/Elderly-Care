import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const AccordionItem = ({ title, content }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionContent}>
          {content.map((rule, idx) => (
            <Text key={idx} style={styles.ruleText}>• {rule}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default function RulesConditionsScreen() {
  const rules = [
    {
      title: 'General Usage Rules',
      content: [
        'The app should be used strictly for caregiver monitoring.',
        'Accurate account information must be provided.',
        'The app must not be used for unauthorized purposes.'
      ]
    },
    {
      title: 'Health Monitoring Rules',
      content: [
        'Readings such as Heart Rate and SpO₂ are for monitoring purposes only.',
        'The caregiver must take appropriate action if abnormal readings are detected.',
        'App readings must not be used as a substitute for professional medical diagnosis.'
      ]
    },
    {
      title: 'Emergency Alert Rules',
      content: [
        'The caregiver must check the app immediately when a fall detection, SOS, or abnormal health alert is received.',
        'In an emergency situation, emergency services or a medical professional should be contacted.',
        'Alerts must not be ignored unnecessarily.'
      ]
    },
    {
      title: 'Device Rules',
      content: [
        'The ESP32 device must be kept properly connected.',
        'Device battery, power, and internet connection must be checked regularly.',
        'The data connection from the device must be monitored periodically.'
      ]
    },
    {
      title: 'Notification Rules',
      content: [
        'Keeping critical notifications turned ON is highly recommended.',
        'The critical alert sound is reserved for emergency alerts only.'
      ]
    },
    {
      title: 'Account Rules',
      content: [
        'Login credentials must not be shared with others.',
        'Logging out is recommended to maintain account security.'
      ]
    },
    {
      title: 'Data & Privacy',
      content: [
        'The elderly person\'s health information must be handled confidentially.',
        'Health data must not be shared with unauthorized persons.'
      ]
    },
    {
      title: 'Acknowledgement',
      content: [
        'The caregiver is responsible for reviewing and acknowledging all alerts.'
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {rules.map((rule, index) => (
          <AccordionItem key={index} title={rule.title} content={rule.content} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  accordionContainer: {
    backgroundColor: colors.surface,
    marginBottom: spacing.m,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.surface,
  },
  accordionTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.text,
  },
  accordionContent: {
    padding: spacing.m,
    paddingTop: 0,
    backgroundColor: colors.surface,
  },
  ruleText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    lineHeight: 22,
  }
});
