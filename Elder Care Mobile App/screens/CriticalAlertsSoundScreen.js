import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function CriticalAlertsSoundScreen() {
  const [toggles, setToggles] = useState({
    main: true,
    fall: true,
    sos: true,
    health: true,
  });
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSwitch = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function playSound() {
    try {
      setIsPlaying(true);
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=emergency-alarm-with-reverb-29431.mp3' } 
      );
      setSound(sound);
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.log('Error playing sound', error);
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const renderToggle = (label, key) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={toggles[key]} onValueChange={() => toggleSwitch(key)} trackColor={{ true: colors.primary }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.card}>
          {renderToggle('Critical Alert Sound', 'main')}
          <View style={styles.divider} />
          {renderToggle('Fall Detection Sound', 'fall')}
          <View style={styles.divider} />
          {renderToggle('SOS Sound', 'sos')}
          <View style={styles.divider} />
          {renderToggle('Abnormal Health Sound', 'health')}
        </View>

        <Text style={styles.sectionTitle}>Notification Volume</Text>
        <View style={styles.volumeCard}>
          <Ionicons name="volume-low" size={24} color={colors.textSecondary} />
          <View style={styles.sliderPlaceholder}>
             <View style={styles.sliderFill} />
          </View>
          <Ionicons name="volume-high" size={24} color={colors.textSecondary} />
        </View>

        <TouchableOpacity 
          style={[styles.testButton, isPlaying && styles.testButtonPlaying]} 
          onPress={playSound}
          disabled={isPlaying}
        >
          <Ionicons name={isPlaying ? "volume-high" : "play"} size={20} color={colors.surface} style={{marginRight: 8}} />
          <Text style={styles.testButtonText}>{isPlaying ? "Playing..." : "Test Alert Sound"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.title, color: colors.text, marginTop: spacing.l, marginBottom: spacing.m },
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
  label: { ...typography.body, color: colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  volumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 8,
  },
  sliderPlaceholder: {
    flex: 1,
    height: 6,
    backgroundColor: colors.secondary,
    marginHorizontal: spacing.m,
    borderRadius: 3,
  },
  sliderFill: {
    width: '80%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  testButtonPlaying: {
    backgroundColor: colors.success,
  },
  testButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
