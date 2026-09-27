import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { UserContext } from '../context/UserContext';

export default function ElderlyPersonDetailsScreen({ navigation }) {
  const { elderly, setElderly, caregiver } = useContext(UserContext);

  const [name, setName] = useState(elderly.name);
  const [age, setAge] = useState(elderly.age);
  const [gender, setGender] = useState(elderly.gender);
  const [dob, setDob] = useState(elderly.dob);
  const [phone, setPhone] = useState(elderly.phone);
  const [address, setAddress] = useState(elderly.address);
  const [medicalNotes, setMedicalNotes] = useState(elderly.medicalNotes);
  const [allergies, setAllergies] = useState(elderly.allergies);
  const [doctorName, setDoctorName] = useState(elderly.doctorName);
  const [doctorContact, setDoctorContact] = useState(elderly.doctorContact);

  const handleSave = () => {
    setElderly({
      ...elderly,
      name, age, gender, dob, phone, address, medicalNotes, allergies, doctorName, doctorContact
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Elderly Person Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, {flex: 1, marginRight: spacing.s}]}>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} />
          </View>
          <View style={[styles.formGroup, {flex: 1, marginLeft: spacing.s}]}>
            <Text style={styles.label}>Gender</Text>
            <TextInput style={styles.input} value={gender} onChangeText={setGender} />
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput style={styles.input} value={dob} onChangeText={setDob} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline />
        </View>

        <Text style={styles.sectionTitle}>Medical Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Existing Conditions / Notes</Text>
          <TextInput style={styles.input} value={medicalNotes} onChangeText={setMedicalNotes} multiline />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Allergies</Text>
          <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Doctor Name</Text>
          <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Doctor Contact Number</Text>
          <TextInput style={styles.input} value={doctorContact} onChangeText={setDoctorContact} />
        </View>

        <Text style={styles.sectionTitle}>Device Information</Text>
        <View style={styles.deviceCard}>
          <Text style={styles.deviceInfo}>Primary Caregiver: {caregiver.name}</Text>
          <Text style={styles.deviceInfo}>ESP32 Device ID: {elderly.deviceId}</Text>
          <Text style={[styles.deviceInfo, {color: colors.success, fontWeight: 'bold'}]}>Status: Connected</Text>
          <Text style={styles.deviceInfo}>Last Connected: Just now</Text>
          <Text style={styles.deviceInfo}>Last Data Received: 1 min ago</Text>
          <Text style={styles.deviceInfo}>Device Battery: 85%</Text>
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
  sectionTitle: { ...typography.title, color: colors.primary, marginTop: spacing.m, marginBottom: spacing.s },
  formGroup: { marginBottom: spacing.m },
  row: { flexDirection: 'row' },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.m,
    color: colors.text,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceInfo: { ...typography.body, color: colors.text, marginBottom: 4 },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: { color: colors.surface, fontWeight: 'bold', fontSize: 16 },
});
