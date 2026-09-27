import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function HealthDetailsScreen() {
  const { sensorData } = useContext(UserContext);

  // Use pending alerts to determine if there's an active fall risk
  const alertsArray = sensorData?.alerts ? Object.values(sensorData.alerts) : [];
  const hasPendingFallAlert = alertsArray.some(a => 
    a.status === 'new' && 
    (a.type?.toUpperCase() === 'FALL_DETECTED' || a.type?.toUpperCase() === 'FALL DETECTED')
  );
  const getIgnoreCase = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return undefined;
    const lowerKeys = keys.map(k => k.toLowerCase());
    for (const k of Object.keys(obj)) {
      if (lowerKeys.includes(k.toLowerCase())) return obj[k];
    }
    return undefined;
  };

  const s = sensorData;
  const env = getIgnoreCase(s, ['sensors']) ? getIgnoreCase(getIgnoreCase(s, ['sensors']), ['environment']) : undefined;
  const envLatest = getIgnoreCase(env, ['latest']) || env;
  const vit = getIgnoreCase(s, ['sensors']) ? getIgnoreCase(getIgnoreCase(s, ['sensors']), ['vitals']) : undefined;
  const vitLatest = getIgnoreCase(vit, ['latest']) || vit;

  const temp = 
    getIgnoreCase(s, ['temperature_c', 'temperature', 'temp']) ??
    getIgnoreCase(envLatest, ['temperature_c', 'temperature', 'temp']) ??
    getIgnoreCase(vitLatest, ['temperature_c', 'temperature', 'temp']) ?? '--';

  const hum = 
    getIgnoreCase(s, ['humidity_pct', 'humidity', 'hum']) ??
    getIgnoreCase(envLatest, ['humidity_pct', 'humidity', 'hum']) ??
    getIgnoreCase(vitLatest, ['humidity_pct', 'humidity', 'hum']) ?? '--';

  const hr = 
    getIgnoreCase(s, ['heart_rate_bpm', 'heart_rate', 'heartrate', 'hr']) ??
    getIgnoreCase(vitLatest, ['heart_rate_bpm', 'heart_rate', 'heartrate', 'hr']) ?? '--';

  const sp = 
    getIgnoreCase(s, ['spo2_pct', 'spo2', 'spO2']) ??
    getIgnoreCase(vitLatest, ['spo2_pct', 'spo2', 'spO2']) ?? '--';
  
  const healthData = {
    heartRate: { 
      current: hr, 
      status: hr !== '--' && hr > 100 ? 'Warning' : 'Normal', 
      history: true 
    },
    spO2: { 
      current: sp, 
      status: sp !== '--' && sp < 95 ? 'Warning' : 'Normal', 
      history: true 
    },
    activity: { 
      current: hasPendingFallAlert ? 'Fall Risk' : 'Stable', 
      status: hasPendingFallAlert ? 'Critical' : 'Normal' 
    },
    temperature: {
      current: temp,
      status: temp !== '--' && temp > 37.5 ? 'Warning' : 'Normal',
      history: true
    }
  };

  const renderStatusBadge = (status) => {
    let bgColor = colors.success + '20';
    let textColor = colors.success;
    if (status === 'Warning') {
      bgColor = colors.warning + '20';
      textColor = colors.warning;
    } else if (status === 'Critical') {
      bgColor = colors.danger + '20';
      textColor = colors.danger;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  const renderDetailCard = (title, icon, data, unit = '') => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name={icon} size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {renderStatusBadge(data.status)}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.currentValue}>{data.current} <Text style={styles.unitText}>{unit}</Text></Text>
      </View>
      {/* A simple placeholder for a chart/history */}
      {data.history && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Trend</Text>
          <View style={styles.trendLinePlaceholder}>
             <Ionicons name="trending-up" size={24} color={colors.textSecondary} />
             <Text style={{color: colors.textSecondary, marginLeft: 8}}>Stable</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Health Details</Text>
        
        {renderDetailCard('Heart Rate', 'heart', healthData.heartRate, 'BPM')}
        {renderDetailCard('SpO₂ Level', 'water', healthData.spO2, '%')}
        {renderDetailCard('Body Temperature', 'thermometer', healthData.temperature, '°C')}
        {renderDetailCard('Activity / Movement', 'walk', healthData.activity)}
        
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
    padding: spacing.m,
  },
  title: {
    ...typography.header,
    marginBottom: spacing.l,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.title,
    fontSize: 18,
    marginLeft: spacing.s,
  },
  badge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: spacing.m,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  unitText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  historyContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.m,
  },
  historyTitle: {
    ...typography.caption,
    marginBottom: spacing.s,
  },
  trendLinePlaceholder: {
    height: 40,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
