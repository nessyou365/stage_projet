import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import auth from '@react-native-firebase/auth';
import { uploadCV, submitSpontaneous } from '../services/firebase';

export default function SpontaneousScreen() {
  const user = auth().currentUser;
  const [email, setEmail] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pickCV = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword'] });
    if (!result.canceled && result.assets?.[0]) setCvFile(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!email || !cvFile || !description) { Alert.alert('Champs requis', 'Veuillez remplir tous les champs.'); return; }
    if (!user) { Alert.alert('Connexion requise', 'Veuillez vous connecter pour envoyer votre candidature.'); return; }
    setLoading(true);
    try {
      const cvUrl = await uploadCV(user.uid, cvFile.uri, cvFile.name, cvFile.mimeType);
      await submitSpontaneous(user.uid, email, cvUrl, description);
      setSubmitted(true);
    } catch (e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <View style={styles.success}>
      <Text style={styles.successIcon}>📨</Text>
      <Text style={styles.successTitle}>Candidature envoyée !</Text>
      <Text style={styles.successText}>L'équipe RH vous recontactera prochainement.</Text>
      <TouchableOpacity onPress={() => { setSubmitted(false); setEmail(''); setCvFile(null); setDescription(''); }}>
        <Text style={styles.link}>Envoyer une autre candidature</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Candidature spontanée</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email de l'entreprise *</Text>
        <TextInput style={styles.input} placeholder="rh@entreprise.com" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>CV (PDF / DOCX) *</Text>
        <TouchableOpacity style={cvFile ? styles.cvUploaded : styles.cvPicker} onPress={pickCV}>
          <Text style={cvFile ? styles.cvUploadedText : styles.cvPickerText}>
            {cvFile ? `✓ ${cvFile.name}` : '📎 Uploader votre CV'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.label}>Message de motivation *</Text>
        <TextInput style={styles.textarea} placeholder="Présentez-vous..." value={description}
          onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top" />
        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer ma candidature</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginTop: 20, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, height: 120 },
  cvPicker: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 14, padding: 14, alignItems: 'center' },
  cvPickerText: { color: '#9ca3af', fontSize: 14 },
  cvUploaded: { borderWidth: 2, borderColor: '#10b981', borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: '#ecfdf5' },
  cvUploadedText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  success: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  successText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  link: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
});
