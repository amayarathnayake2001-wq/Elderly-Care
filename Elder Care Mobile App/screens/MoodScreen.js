import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function MoodScreen() {
  const { sensorData } = useContext(UserContext);

  const rawMood = sensorData?.ai?.mood?.emotion || 'neutral';
  const confidence = sensorData?.ai?.mood?.confidence || 0;
  const currentMood = rawMood.charAt(0).toUpperCase() + rawMood.slice(1);
  const timeString = sensorData?.ai?.mood?.timestamp ? new Date(sensorData.ai.mood.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';

  const moods = [
    { name: 'Happy', icon: 'happy', color: '#FFD700' },
    { name: 'Neutral', icon: 'remove-circle', color: colors.primary },
    { name: 'Sad', icon: 'sad', color: colors.textSecondary },
    { name: 'Angry', icon: 'flash', color: colors.danger },
    { name: 'Fear', icon: 'pulse', color: colors.warning },
    { name: 'Surprise', icon: 'alert', color: colors.success },
  ];

  // Find icon for current mood
  const activeMoodObj = moods.find(m => m.name.toLowerCase() === rawMood.toLowerCase());
  const activeIcon = activeMoodObj ? activeMoodObj.icon : 'help-circle';
  const activeColor = activeMoodObj ? activeMoodObj.color : colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mood Auxiliary Tracking</Text>
      <Text style={styles.subtitle}>
        *This is not a medical diagnosis. It serves as an auxiliary trend indicator based on behavioral patterns.
      </Text>

      <View style={styles.currentMoodContainer}>
        <Text style={styles.currentMoodLabel}>Current Detected Mood</Text>
        <Ionicons name={activeIcon} size={80} color={activeColor} />
        <Text style={[styles.currentMoodText, { color: activeColor }]}>{currentMood}</Text>
        <Text style={styles.confidenceText}>Confidence: {confidence}% • Last Updated: {timeString}</Text>
      </View>

      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <View key={mood.name} style={[styles.moodCard, currentMood === mood.name && styles.activeMoodCard]}>
            <Ionicons name={mood.icon} size={32} color={mood.color} />
            <Text style={styles.moodName}>{mood.name}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.m,
  },
  title: {
    ...typography.header,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  currentMoodContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentMoodLabel: {
    ...typography.title,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  currentMoodText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.s,
    marginBottom: spacing.xs,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.s,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodCard: {
    width: '30%',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeMoodCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.secondary,
  },
  moodName: {
    ...typography.caption,
    marginTop: spacing.s,
    textAlign: 'center',
    fontWeight: 'bold',
  }
});
