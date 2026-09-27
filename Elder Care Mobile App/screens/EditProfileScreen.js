import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { UserContext } from '../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen({ navigation }) {
  const { caregiver, setCaregiver } = useContext(UserContext);

  const [fullName, setFullName] = useState(caregiver.name);
  const [email, setEmail] = useState(caregiver.email);
  const [phone, setPhone] = useState(caregiver.phone);
  const [username, setUsername] = useState(caregiver.username);
  const [secondaryPhone, setSecondaryPhone] = useState(caregiver.secondaryPhone);
  const [address, setAddress] = useState(caregiver.address);
  const [profilePic, setProfilePic] = useState(caregiver.profilePic);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    setCaregiver({
      ...caregiver,
      name: fullName,
      email,
      phone,
      username,
      secondaryPhone,
      address,
      profilePic,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.photoContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.photoPicker}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profileImage} />
            ) : (
              <Ionicons name="camera" size={32} color={colors.primary} />
            )}
          </TouchableOpacity>
          <Text style={styles.photoText}>Tap to change photo</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} />
        </View>
        <TouchableOpacity style={styles.textButton}>
          <Text style={styles.textButtonLabel}>Change Password</Text>
        </TouchableOpacity>
        <Text style={styles.statusText}>Email Verification Status: <Text style={{color: colors.success}}>Verified</Text></Text>

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Primary Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Secondary Phone Number</Text>
          <TextInput style={styles.input} value={secondaryPhone} onChangeText={setSecondaryPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.title, color: colors.primary, marginTop: spacing.m, marginBottom: spacing.s },
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
  textButton: {
    paddingVertical: spacing.s,
    marginBottom: spacing.m,
  },
  textButtonLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.s,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.s,
  },
  cancelButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 16 },
  saveButtonText: { color: colors.surface, fontWeight: 'bold', fontSize: 16 },
  photoContainer: {
    alignItems: 'center',
    marginVertical: spacing.l,
  },
  photoPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.s,
    fontWeight: 'bold',
  }
});
