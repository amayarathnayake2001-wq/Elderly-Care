import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AlertHistoryScreen() {
  const historyData = [
    { id: '1', type: 'Abnormal Heart Rate', date: '2026-10-11 15:20', resolved: true },
    { id: '2', type: 'Low SpO2', date: '2026-10-09 08:15', resolved: true },
    { id: '3', type: 'Fall Detected', date: '2026-10-01 22:10', resolved: true },
    { id: '4', type: 'SOS Pressed', date: '2026-09-28 14:00', resolved: true },
  ];

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.iconContainer}>
        <Ionicons name="time" size={24} color={colors.textSecondary} />
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyType}>{item.type}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
      <View style={styles.resolvedBadge}>
        <Text style={styles.resolvedText}>Resolved</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={historyData}
        keyExtractor={item => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.title}>Alert History</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.header,
    padding: spacing.m,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxl,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.m,
    marginBottom: spacing.s,
  },
  iconContainer: {
    marginRight: spacing.m,
  },
  historyDetails: {
    flex: 1,
  },
  historyType: {
    ...typography.title,
    fontSize: 16,
    color: colors.text,
  },
  historyDate: {
    ...typography.caption,
    marginTop: 4,
  },
  resolvedBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resolvedText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  }
});
