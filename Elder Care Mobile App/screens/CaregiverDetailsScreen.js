import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { UserContext } from '../context/UserContext';

export default function CaregiverDetailsScreen({ navigation }) {
  const { caregiver, setCaregiver } = useContext(UserContext);

  const [name, setName] = useState(caregiver.name);
  const [relationship, setRelationship] = useState(caregiver.relationship);
  const [phone, setPhone] = useState(caregiver.phone);
  const [email, setEmail] = useState(caregiver.email);
  const [status, setStatus] = useState(caregiver.role);

  const handleSave = () => {
    setCaregiver({
      ...caregiver,
      name,
      relationship,
      phone,
      email,
      role: status,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Caregiver Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Relationship to Elderly Person</Text>
          <TextInput style={styles.input} value={relationship} onChangeText={setRelationship} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Emergency Contact Status</Text>
          <TextInput style={styles.input} value={status} onChangeText={setStatus} />
          <Text style={styles.helperText}>(e.g., Primary Caregiver / Secondary Caregiver)</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  formGroup: { marginBottom: spacing.m },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.m,
    color: colors.text,
  },
  helperText: { ...typography.caption, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.l,
  },
  saveButtonText: { color: colors.surface, fontWeight: 'bold', fontSize: 16 },
});
