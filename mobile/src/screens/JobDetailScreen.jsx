import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import auth from '@react-native-firebase/auth';
import { uploadCV, submitApplication } from '../services/firebase';

export default function JobDetailScreen({ route, navigation }) {
  const { job, application } = route.params;
  const user = auth().currentUser;
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const statusLabel = (status) => ({
    Applied: 'Pending',
    Reviewed: 'Pending',
    Interview: 'Interview',
    Offered: 'Offre',
    Accepted: 'Acceptee',
    Rejected: 'Refusee',
  }[status] || status || 'Pending');

  const pickCV = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] });
    if (!result.canceled && result.assets?.[0]) setCvFile(result.assets[0]);
  };

  const handleApply = async () => {
    if (!cvFile) { Alert.alert('CV requis', 'Veuillez uploader votre CV pour postuler.'); return; }
    if (!user) { Alert.alert('Connexion requise', 'Veuillez vous connecter pour postuler.'); return; }
    setLoading(true);
    try {
      const cvUrl = await uploadCV(user.uid, cvFile.uri, cvFile.name, cvFile.mimeType);
      await submitApplication(job, user, cvUrl);
      setSubmitted(true);
    } catch (e) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <View style={styles.success}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Candidature envoyée !</Text>
      <Text style={styles.successText}>L'équipe RH a bien reçu votre candidature.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.meta}>{job.department} • {job.location} • {job.type}</Text>
      {job.description && <Text style={styles.desc}>{job.description}</Text>}
      {(job.skills || []).length > 0 && (
        <View style={styles.skillsRow}>
          {job.skills.map(s => <View key={s} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>)}
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{application ? 'Statut de votre candidature' : 'Postuler'}</Text>
        {application ? (
          <>
            <Text style={styles.statusText}>{application.interviewStatus === 'submitted' ? 'Interview envoyee' : statusLabel(application.status)}</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('ApplicationStatus', { applicationId: application.id, initialApplication: application })}>
              <Text style={styles.secondaryBtnText}>Voir la ligne de statut</Text>
            </TouchableOpacity>
            {application.status === 'Interview' && application.interviewStatus !== 'submitted' && (
              <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Interview', { applicationId: application.id })}>
                <Text style={styles.btnText}>Passer l'entretien</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
        <TouchableOpacity style={cvFile ? styles.cvUploaded : styles.cvPicker} onPress={pickCV}>
          <Text style={cvFile ? styles.cvUploadedText : styles.cvPickerText}>
            {cvFile ? `✓ ${cvFile.name}` : '📎 Uploader votre CV (PDF / DOCX) *'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleApply} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer ma candidature</Text>}
        </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginTop: 8, marginBottom: 6 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 14 },
  desc: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 14 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  skill: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  skillText: { fontSize: 12, color: '#4f46e5', fontWeight: '500' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  statusText: { alignSelf: 'flex-start', backgroundColor: '#ede9fe', color: '#4f46e5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#c7d2fe', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#4f46e5', fontWeight: '800', fontSize: 14 },
  cvPicker: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 14, padding: 14, alignItems: 'center' },
  cvPickerText: { color: '#9ca3af', fontSize: 14 },
  cvUploaded: { borderWidth: 2, borderColor: '#10b981', borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: '#ecfdf5' },
  cvUploadedText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  success: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  successText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
