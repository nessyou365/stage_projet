import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getApplicationById, submitInterviewAnswers } from '../services/firebase';

const fallbackQuestions = [
  'Presentez une experience recente qui montre votre impact dans ce poste.',
  'Comment organisez-vous votre travail quand les priorites changent rapidement ?',
  'Quelles competences voulez-vous renforcer pendant les 90 premiers jours ?',
];

export default function InterviewScreen({ route, navigation }) {
  const { applicationId } = route.params || {};
  const user = auth().currentUser;
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return undefined;
    }

    const unsub = getApplicationById(applicationId, data => {
      setApplication(data);
      setLoading(false);
    });

    return unsub;
  }, [applicationId]);

  const questions = useMemo(() => {
    const fromApplication = application?.interviewQuestions || [];
    return fromApplication.length > 0 ? fromApplication : fallbackQuestions;
  }, [application]);

  const alreadySubmitted = application?.interviewStatus === 'submitted';
  const canOpen = application?.userId === user?.uid && application?.status === 'Interview';

  const handleSubmit = async () => {
    if (!applicationId || submitting) return;

    const payload = questions.map(question => ({ question, answer: answers[question] || '' }));
    setSubmitting(true);

    try {
      await submitInterviewAnswers(applicationId, payload);
      Alert.alert('Entretien envoye', 'Vos reponses ont ete envoyees a l equipe RH.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible d envoyer vos reponses.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#4f46e5" />;

  if (!application || !canOpen) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>Entretien indisponible</Text>
        <Text style={styles.centerText}>Cette invitation n est pas disponible pour ce compte ou ce statut.</Text>
      </View>
    );
  }

  if (alreadySubmitted) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>OK</Text>
        <Text style={styles.centerTitle}>Reponses envoyees</Text>
        <Text style={styles.centerText}>L equipe RH peut maintenant consulter votre entretien.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>Entretien</Text>
      <Text style={styles.title}>{application.role || application.jobTitle || 'Offre'}</Text>
      <Text style={styles.subtitle}>Repondez aux questions ci-dessous. Vos reponses seront visibles cote RH.</Text>

      <View style={styles.card}>
        {questions.map((question, index) => (
          <View key={question} style={styles.questionBlock}>
            <Text style={styles.questionIndex}>Question {index + 1}</Text>
            <Text style={styles.question}>{question}</Text>
            <TextInput
              value={answers[question] || ''}
              onChangeText={value => setAnswers(current => ({ ...current, [question]: value }))}
              placeholder="Votre reponse..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.input}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, submitting && styles.btnDisabled]} disabled={submitting} onPress={handleSubmit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer mes reponses</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 16 },
  kicker: { marginTop: 10, color: '#4f46e5', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginTop: 6, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 16 },
  questionBlock: { gap: 8 },
  questionIndex: { fontSize: 11, color: '#4f46e5', fontWeight: '700' },
  question: { fontSize: 14, color: '#1f2937', fontWeight: '600', lineHeight: 20 },
  input: {
    minHeight: 110,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  btn: { marginTop: 16, marginBottom: 32, backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  center: { flex: 1, backgroundColor: '#f8f9ff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  centerText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  successIcon: { color: '#10b981', fontSize: 28, fontWeight: '900', marginBottom: 12 },
});
