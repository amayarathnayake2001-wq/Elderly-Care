import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const ContactCard = ({ name, relationship, phone, isDoctor, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.cardInfo}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.relationship}>{relationship}</Text>
      <Text style={styles.phone}>{phone}</Text>
    </View>
    <View style={styles.actionsRow}>
      {onDelete && (
        <TouchableOpacity style={styles.iconButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.callButton}>
        <Ionicons name="call" size={20} color={colors.surface} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function EmergencyCallingScreen() {
  const [contacts, setContacts] = useState([
    { id: '1', name: 'John Doe', relationship: 'Primary Contact (Son)', phone: '+94 77 123 4567' },
    { id: '2', name: 'Jane Doe', relationship: 'Secondary Contact (Daughter)', phone: '+94 71 987 6543' },
  ]);

  const [medicalContacts, setMedicalContacts] = useState([
    { id: '1', name: 'Dr. Smith', relationship: 'Hospital / Clinic Name', phone: '+94 11 234 5678' }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('emergency'); // 'emergency' or 'medical'
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleAddContact = () => {
    if (newName && newPhone) {
      const newContact = {
        id: Date.now().toString(),
        name: newName,
        relationship: newRelationship,
        phone: newPhone
      };
      
      if (modalType === 'emergency') {
        setContacts([...contacts, newContact]);
      } else {
        setMedicalContacts([...medicalContacts, newContact]);
      }

      setNewName('');
      setNewRelationship('');
      setNewPhone('');
      setModalVisible(false);
    }
  };

  const handleDeleteContact = (id, type) => {
    if (type === 'emergency') {
      setContacts(contacts.filter(c => c.id !== id));
    } else {
      setMedicalContacts(medicalContacts.filter(c => c.id !== id));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={24} color={colors.danger} />
          <View style={{marginLeft: spacing.m, flex: 1}}>
            <Text style={styles.alertTitle}>Important</Text>
            <Text style={styles.alertText}>In a critical medical emergency, always call Emergency Services first.</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => openModal('emergency')} style={styles.addBadge}>
            <Ionicons name="add" size={16} color={colors.surface} />
            <Text style={styles.addBadgeText}>Add</Text>
          </TouchableOpacity>
        </View>

        {contacts.map(contact => (
          <ContactCard 
            key={contact.id} 
            name={contact.name} 
            relationship={contact.relationship} 
            phone={contact.phone} 
            onDelete={() => handleDeleteContact(contact.id, 'emergency')}
          />
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical Contacts</Text>
          <TouchableOpacity onPress={() => openModal('medical')} style={styles.addBadge}>
            <Ionicons name="add" size={16} color={colors.surface} />
            <Text style={styles.addBadgeText}>Add</Text>
          </TouchableOpacity>
        </View>

        {medicalContacts.map(contact => (
          <ContactCard 
            key={contact.id} 
            name={contact.name} 
            relationship={contact.relationship} 
            phone={contact.phone} 
            isDoctor
            onDelete={() => handleDeleteContact(contact.id, 'medical')}
          />
        ))}

        <Text style={styles.sectionTitle}>Emergency Services</Text>
        <View style={styles.servicesGrid}>
          <TouchableOpacity style={styles.serviceButton}>
            <Ionicons name="medical" size={28} color={colors.danger} />
            <Text style={styles.serviceText}>Ambulance</Text>
            <Text style={styles.serviceNumber}>1990</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceButton}>
            <Ionicons name="shield" size={28} color={colors.primary} />
            <Text style={styles.serviceText}>Police</Text>
            <Text style={styles.serviceNumber}>119</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceButton}>
            <Ionicons name="flame" size={28} color={colors.warning} />
            <Text style={styles.serviceText}>Fire & Rescue</Text>
            <Text style={styles.serviceNumber}>110</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New {modalType === 'medical' ? 'Medical' : ''} Contact</Text>
            
            <Text style={styles.label}>{modalType === 'medical' ? 'Doctor / Clinic Name' : 'Name'}</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="e.g. Sam" />
            
            <Text style={styles.label}>{modalType === 'medical' ? 'Specialty / Note' : 'Relationship'}</Text>
            <TextInput style={styles.input} value={newRelationship} onChangeText={setNewRelationship} placeholder={modalType === 'medical' ? "e.g. Cardiologist" : "e.g. Neighbor"} />
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" placeholder="e.g. 077 123 4567" />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveBtn]} onPress={handleAddContact}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.m, paddingBottom: spacing.xxl },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFE5E5',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.l,
    alignItems: 'center',
  },
  alertTitle: { color: colors.danger, fontWeight: 'bold', fontSize: 16 },
  alertText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.m, marginTop: spacing.s },
  sectionTitle: { ...typography.title, color: colors.text },
  addBadge: { flexDirection: 'row', backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignItems: 'center' },
  addBadgeText: { color: colors.surface, fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.m,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  name: { ...typography.title, fontSize: 16 },
  relationship: { ...typography.caption, color: colors.primary, marginVertical: 2 },
  phone: { ...typography.body, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: spacing.s, marginRight: spacing.s },
  callButton: {
    backgroundColor: colors.success,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
    marginTop: spacing.s,
  },
  serviceButton: {
    backgroundColor: colors.surface,
    width: '31%',
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceText: { ...typography.caption, fontWeight: 'bold', marginTop: spacing.s, textAlign: 'center' },
  serviceNumber: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.l },
  modalContent: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.l },
  modalTitle: { ...typography.title, marginBottom: spacing.l, textAlign: 'center' },
  label: { ...typography.caption, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.m, marginBottom: spacing.m },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.m },
  modalButton: { flex: 1, padding: spacing.m, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.background, marginRight: spacing.s },
  saveBtn: { backgroundColor: colors.primary, marginLeft: spacing.s },
  cancelBtnText: { fontWeight: 'bold', color: colors.text },
  saveBtnText: { fontWeight: 'bold', color: colors.surface }
});
