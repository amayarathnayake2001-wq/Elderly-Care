import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { UserContext } from '../context/UserContext';
import { Ionicons } from '@expo/vector-icons';

const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={20} color={colors.primary} style={{ marginRight: 8 }} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function PatientReportScreen() {
  const { caregiver, elderly, sensorData } = useContext(UserContext);

  // Parse sensorData
  const alertsArray = sensorData?.alerts ? Object.values(sensorData.alerts) : [];
  const fallProb = sensorData?.ai?.fall?.fall_probability || 0;
  const isFallDetected = sensorData?.ai?.fall?.prediction === 'fall';
  const accMax = sensorData?.sensors?.movement?.latest?.features?.acc_max?.toFixed(2) || '0';
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.headerBanner}>
          <Ionicons name="document-text" size={32} color={colors.surface} />
          <Text style={styles.headerTitle}>Comprehensive Report</Text>
          <Text style={styles.headerSubtitle}>Complete Overview of Patient Status</Text>
        </View>

        {/* 1. Person Details */}
        <View style={styles.card}>
          <SectionHeader icon="person" title="Person Details" />
          <View style={styles.divider} />
          <DetailRow label="Name" value={elderly.name} />
          <DetailRow label="Age" value={elderly.age} />
          <DetailRow label="Gender" value={elderly.gender} />
          <DetailRow label="Date of Birth" value={elderly.dob} />
          <DetailRow label="Address" value={elderly.address} />
          <DetailRow label="Device ID" value={elderly.deviceId} />
        </View>

        {/* 2. Caregiver Details */}
        <View style={styles.card}>
          <SectionHeader icon="people" title="Caregiver Details" />
          <View style={styles.divider} />
          <DetailRow label="Caregiver Name" value={caregiver.name} />
          <DetailRow label="Relationship" value={caregiver.relationship} />
          <DetailRow label="Role" value={caregiver.role} />
          <DetailRow label="Primary Phone" value={caregiver.phone} />
          <DetailRow label="Email" value={caregiver.email} />
        </View>

        {/* 3. Doctor Details & Medical Info */}
        <View style={styles.card}>
          <SectionHeader icon="medical" title="Medical & Doctor Details" />
          <View style={styles.divider} />
          <DetailRow label="Doctor Name" value={elderly.doctorName} />
          <DetailRow label="Doctor Contact" value={elderly.doctorContact} />
          <DetailRow label="Existing Conditions" value={elderly.medicalNotes} />
          <DetailRow label="Allergies" value={elderly.allergies} />
        </View>

        {/* 4. History / Analysis */}
        <View style={styles.card}>
          <SectionHeader icon="analytics" title="AI Health Analysis & Sensors" />
          <View style={styles.divider} />
          
          <View style={styles.historyItem}>
            <View style={styles.historyIconWrapper}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>Overall Health AI</Text>
              <Text style={styles.historyDesc}>Status: {sensorData?.ai?.health?.status}. {sensorData?.ai?.health?.reasons?.[0]}</Text>
            </View>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyIconWrapper}>
              <Ionicons name={isFallDetected ? "warning" : "walk"} size={16} color={isFallDetected ? colors.danger : colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>Fall Probability</Text>
              <Text style={styles.historyDesc}>Current Risk: {(fallProb * 100).toFixed(1)}%. Accelerometer Max: {accMax}</Text>
            </View>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyIconWrapper}>
              <Ionicons name="alert-circle" size={16} color={alertsArray.length > 0 ? colors.danger : colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>Alerts History</Text>
              <Text style={styles.historyDesc}>{alertsArray.length} recorded alerts in the recent log.</Text>
            </View>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  headerBanner: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.l,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    ...typography.title,
    color: colors.surface,
    fontSize: 22,
    marginTop: spacing.s,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    alignItems: 'flex-start',
  },
  historyIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  historyTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  historyDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  }
});
