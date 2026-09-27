import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { ref, update } from 'firebase/database';
import { database } from '../services/firebaseConfig';

export default function EmergencyAlertsScreen({ navigation }) {
  const { sensorData, caregiver } = useContext(UserContext);
  
  // Convert object of alerts to an array and sort descending by timestamp
  const rawAlerts = sensorData?.alerts || {};
  const alertsData = Object.keys(rawAlerts).map(key => {
    const alert = rawAlerts[key];
    return {
      id: key,
      type: alert.type.replace(/_/g, ' '),
      date: new Date(alert.timestamp).toLocaleString(),
      status: alert.status === 'new' ? 'Pending' : 'Resolved',
      critical: alert.severity === 'critical',
      message: alert.details?.message || '',
      resolvedBy: alert.resolved_by || null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : null
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAcknowledge = (alertId) => {
    Alert.alert(
      "Respond to Alert",
      "Are you sure you want to mark this alert as resolved? This will log your response and reset the safety status.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark as Resolved", 
          onPress: () => {
            const updates = {};
            updates[`elderly/elderly_001/alerts/${alertId}/status`] = 'resolved';
            updates[`elderly/elderly_001/alerts/${alertId}/resolved_by`] = caregiver.name || 'Caregiver';
            updates[`elderly/elderly_001/alerts/${alertId}/resolved_at`] = new Date().toISOString();
            
            // Also reset health status to NORMAL
            updates[`elderly/elderly_001/ai/health/status`] = 'NORMAL';

            // Reset fall risk prediction to normal so the dashboard activity is marked Stable
            updates[`elderly/elderly_001/ai/fall/prediction`] = 'no_fall';
            updates[`elderly/elderly_001/ai/fall/fall_probability`] = 0.0;
            
            update(ref(database), updates).catch(err => console.log('Error acknowledging alert: ', err));
          }
        }
      ]
    );
  };

  const renderAlertItem = ({ item }) => (
    <View style={[styles.alertCard, item.critical ? styles.criticalBorder : styles.warningBorder]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTypeContainer}>
          <Ionicons 
            name={item.type === 'Fall Detected' ? 'warning' : item.type === 'SOS Pressed' ? 'help-buoy' : 'pulse'} 
            size={24} 
            color={item.critical ? colors.danger : colors.warning} 
          />
          <Text style={styles.alertType}>{item.type}</Text>
        </View>
        <Text style={[styles.statusBadge, item.status === 'Pending' ? styles.statusPending : styles.statusAck]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.alertDate}>{item.date}</Text>
      
      {item.status === 'Pending' ? (
        <TouchableOpacity style={styles.ackButton} onPress={() => handleAcknowledge(item.id)}>
          <Text style={styles.ackButtonText}>Respond</Text>
        </TouchableOpacity>
      ) : (
        item.resolvedBy && (
          <View style={styles.resolvedContainer}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{marginRight: 4}} />
            <Text style={styles.resolvedText}>
              Responded by: <Text style={{fontWeight: 'bold'}}>{item.resolvedBy}</Text>
            </Text>
          </View>
        )
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Emergency Alerts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AlertHistory')} style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={alertsData}
        keyExtractor={item => item.id}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No alerts found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
  },
  title: {
    ...typography.header,
    color: colors.text,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  historyButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxl,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  criticalBorder: {
    borderLeftColor: colors.danger,
  },
  warningBorder: {
    borderLeftColor: colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  alertTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertType: {
    ...typography.title,
    fontSize: 16,
    marginLeft: spacing.s,
    color: colors.text,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusPending: {
    backgroundColor: '#FFE5E5',
    color: colors.danger,
  },
  statusAck: {
    backgroundColor: '#E5F6E5',
    color: colors.success,
  },
  alertDate: {
    ...typography.caption,
    marginBottom: spacing.m,
  },
  ackButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.s,
    alignItems: 'center',
  },
  ackButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: spacing.s,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  resolvedText: {
    ...typography.caption,
    color: colors.success,
  }
});
