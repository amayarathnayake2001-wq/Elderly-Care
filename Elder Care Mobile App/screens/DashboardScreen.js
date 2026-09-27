import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function DashboardScreen({ navigation }) {
  const { caregiver, elderly, sensorData } = useContext(UserContext);
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Parse sensorData
  const safetyStatus = sensorData?.ai?.health?.status || 'NORMAL';
  const isCritical = safetyStatus === 'CRITICAL';
  
  // Format Timestamp
  const rawDate = sensorData?.ai?.health?.timestamp;
  const timeString = rawDate ? new Date(rawDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
  
  // Parse Alerts
  const alertsArray = sensorData?.alerts ? Object.values(sensorData.alerts) : [];
  const pendingAlerts = alertsArray.filter(a => a.status === 'new').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestAlert = pendingAlerts.length > 0 ? pendingAlerts[0] : null;

  const aiMood = sensorData?.ai?.mood?.emotion || 'Unknown';
  const capMood = aiMood.charAt(0).toUpperCase() + aiMood.slice(1);
  
  // Use pending alerts to determine if there's an active fall risk
  const hasPendingFallAlert = pendingAlerts.some(a => 
    a.type?.toUpperCase() === 'FALL_DETECTED' || 
    a.type?.toUpperCase() === 'FALL DETECTED'
  );

  // Robust case-insensitive fetch
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

  const mov = getIgnoreCase(s, ['sensors']) ? getIgnoreCase(getIgnoreCase(s, ['sensors']), ['movement']) : undefined;
  const movLatest = getIgnoreCase(mov, ['latest']) || mov;
  const features = getIgnoreCase(movLatest, ['features']);
  const accMax = getIgnoreCase(features, ['acc_max']);

  const currentData = {
    heartRate: hr || '--',
    spO2: sp || '--',
    activity: hasPendingFallAlert ? 'Fall Risk' : 'Stable',
    steps: `Acc Max: ${accMax ? Number(accMax).toFixed(1) : '0'}`,
    mood: capMood,
    temperature: temp,
    humidity: hum,
  };

  const renderMetricCard = (title, value, subtitle, icon, color, trend, trendPositive, onPress) => (
    <TouchableOpacity style={styles.metricCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.metricCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        {trend && (
           <View style={[styles.trendBadge, { backgroundColor: trendPositive ? colors.success + '15' : colors.danger + '15' }]}>
             <Ionicons name={trendPositive ? "arrow-up" : "arrow-down"} size={12} color={trendPositive ? colors.success : colors.danger} />
             <Text style={[styles.trendText, { color: trendPositive ? colors.success : colors.danger }]}>{trend}</Text>
           </View>
        )}
      </View>
      <View style={styles.metricInfo}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text style={styles.greeting}>{greeting}, {caregiver?.name?.split(' ')[0] || 'Caregiver'}</Text>
            <Text style={styles.patientName}>Monitoring: {elderly?.name || 'Grandpa'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarShadow}>
            <View style={styles.avatarPlaceholder}>
              {caregiver?.profilePic ? (
                <Image source={{ uri: caregiver.profilePic }} style={{ width: '100%', height: '100%', borderRadius: 26 }} />
              ) : (
                <Ionicons name="person" size={24} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Overall Safety Banner - Smart Look */}
        <View style={[styles.safetyBanner, isCritical && { backgroundColor: colors.danger }]}>
          <View style={styles.safetyIconWrapper}>
            <Ionicons name={isCritical ? "warning" : "shield-checkmark"} size={28} color="#FFF" />
          </View>
          <View style={styles.safetyTextCol}>
            <Text style={styles.safetyTitleWhite}>Overall Safety</Text>
            <Text style={styles.lastUpdatedWhite}>Last synced: {timeString}</Text>
          </View>
          <View style={[styles.safetyStatusBadge, isCritical && { backgroundColor: '#FF4757' }]}>
             <Text style={styles.safetyStatusText}>{safetyStatus}</Text>
          </View>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.grid}>
          {renderMetricCard('Heart Rate', `${currentData.heartRate} BPM`, 'Resting avg: 72', 'heart', colors.danger, '2 bpm', false, () => navigation.navigate('Health'))}
          {renderMetricCard('SpO₂', `${currentData.spO2}%`, 'Oxygen Level', 'water', colors.primary, '1%', true, () => navigation.navigate('Health'))}
          
          {renderMetricCard('Activity', currentData.activity, currentData.steps, 'walk', colors.success, null, null, () => navigation.navigate('Health'))}
          {renderMetricCard('Mood', currentData.mood, 'Stable', 'happy', colors.warning, null, null, () => navigation.navigate('Mood'))}
          
          {renderMetricCard('Temperature', `${currentData.temperature}°C`, 'Room Temp', 'thermometer', colors.textSecondary, '0.5°', true, () => {})}
          {renderMetricCard('Humidity', `${currentData.humidity}%`, 'Room Humidity', 'water-outline', colors.textSecondary, null, null, () => {})}
        </View>

        {/* Recent Alerts Section */}
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {latestAlert ? (
            <View style={[styles.alertCardEmpty, { borderColor: colors.danger + '40', borderWidth: 1 }]}>
              <View style={[styles.successIconCircle, { backgroundColor: colors.danger + '15' }]}>
                <Ionicons name="warning-outline" size={20} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertEmptyText, { color: colors.danger, fontWeight: 'bold' }]}>
                  {latestAlert.type.replace('_', ' ')}
                </Text>
                <Text style={styles.metricSubtitle}>{latestAlert.details?.message}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.alertCardEmpty}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-outline" size={20} color={colors.success} />
              </View>
              <Text style={styles.alertEmptyText}>No critical alerts recently. Everything looks good!</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Slightly cooler background for contrast
  },
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.s,
  },
  greeting: {
    ...typography.title,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  patientName: {
    ...typography.body,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  avatarShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
  },
  safetyBanner: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: spacing.l, // Increased padding
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.m,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  safetyIconWrapper: {
    width: 52, // Increased from 44
    height: 52, // Increased from 44
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  safetyTextCol: {
    flex: 1,
  },
  safetyTitleWhite: {
    ...typography.title,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontSize: 18, // Increased from 14
  },
  safetyStatusBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 16, // Increased
    paddingVertical: 8, // Increased
    borderRadius: 14,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  safetyStatusText: {
    fontSize: 16, // Increased from 14
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  lastUpdatedWhite: {
    fontSize: 12, // Increased from 10
    color: 'rgba(255,255,255,0.6)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  metricCard: {
    backgroundColor: '#FFF',
    width: '48%',
    borderRadius: 16,
    padding: 12,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  metricInfo: {
    justifyContent: 'flex-end',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 1,
  },
  metricSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.7,
  },
  alertsSection: {
    marginBottom: spacing.s,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 16,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  alertCardEmpty: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  successIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  alertEmptyText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
});
