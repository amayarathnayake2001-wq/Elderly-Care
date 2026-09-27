import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
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
          {content.map((text, idx) => (
            <Text key={idx} style={styles.ruleText}>{text}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default function HelpSupportScreen() {
  const helpData = [
    {
      title: 'Getting Started',
      content: [
        '• How to use the app',
        '• How to connect the device',
        '• How to monitor health data',
        '• How to check alerts'
      ]
    },
    {
      title: 'Health Monitoring',
      content: [
        '• What is Heart Rate?',
        '• What is SpO₂?',
        '• What does Activity mean?',
        '• How does Mood Detection work?'
      ]
    },
    {
      title: 'Emergency Alerts',
      content: [
        '• What should I do when a Fall Alert appears?',
        '• What should I do when an SOS alert appears?',
        '• How to acknowledge an alert?',
        '• How to contact emergency contacts?'
      ]
    },
    {
      title: 'Device Support',
      content: [
        '• Device not connected',
        '• No health data received',
        '• Device data not updating',
        '• ESP32 connection problems'
      ]
    },
    {
      title: 'Account Support',
      content: [
        '• Change password',
        '• Edit profile',
        '• Login problems',
        '• Logout'
      ]
    }
  ];

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@eldercareapp.com?subject=Support Request').catch(err => {
      Alert.alert('Error', 'Unable to open email app.');
    });
  };

  const handlePhoneSupport = () => {
    Linking.openURL('tel:+94112345678').catch(err => {
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  const handleReportProblem = () => {
    Linking.openURL('mailto:support@eldercareapp.com?subject=Problem Report&body=Please describe the problem you are facing...').catch(err => {
      Alert.alert('Error', 'Unable to open email app.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {helpData.map((item, index) => (
          <AccordionItem key={index} title={item.title} content={item.content} />
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Support</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
            <Ionicons name="mail-outline" size={20} color={colors.surface} style={{marginRight: 8}}/>
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handlePhoneSupport}>
            <Ionicons name="call-outline" size={20} color={colors.surface} style={{marginRight: 8}}/>
            <Text style={styles.contactButtonText}>Phone Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactButton, styles.outlineButton]} onPress={handleReportProblem}>
            <Ionicons name="bug-outline" size={20} color={colors.primary} style={{marginRight: 8}}/>
            <Text style={[styles.contactButtonText, {color: colors.primary}]}>Report a Problem</Text>
          </TouchableOpacity>
        </View>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
  },
  accordionTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.text,
  },
  accordionContent: {
    padding: spacing.m,
    paddingTop: 0,
  },
  ruleText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    lineHeight: 22,
  },
  contactSection: {
    marginTop: spacing.l,
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactTitle: {
    ...typography.title,
    marginBottom: spacing.l,
    color: colors.primary,
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  outlineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  contactButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
