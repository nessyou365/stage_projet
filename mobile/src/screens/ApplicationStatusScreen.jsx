import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getApplicationById } from '../services/firebase';

const statusSteps = [
  { key: 'pending', label: 'Pending' },
  { key: 'interview', label: 'Interview' },
  { key: 'accepted', label: 'Acceptee' },
  { key: 'rejected', label: 'Refusee' },
];

const normalizeStatus = (application) => {
  if (application?.status === 'Interview') return 'interview';
  if (application?.status === 'Accepted' || application?.status === 'Offered') return 'accepted';
  if (application?.status === 'Rejected') return 'rejected';
  return 'pending';
};

const formatDate = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR') : 'Date indisponible';
};

export default function ApplicationStatusScreen({ route, navigation }) {
  const { applicationId, initialApplication } = route.params || {};
  const user = auth().currentUser;
  const [application, setApplication] = useState(initialApplication || null);
  const [loading, setLoading] = useState(!initialApplication);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = getApplicationById(applicationId, data => {
      setApplication(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [applicationId]);

  const currentStatus = useMemo(() => normalizeStatus(application), [application]);
  const canAnswerInterview =
    application?.userId === user?.uid &&
    application?.status === 'Interview' &&
    application?.interviewStatus !== 'submitted';

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#4f46e5" />;

  if (!application || application.userId !== user?.uid) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>Candidature introuvable</Text>
        <Text style={styles.centerText}>Cette candidature n'est pas disponible pour ce compte.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.kicker}>Statut candidature</Text>
      <Text style={styles.title}>{application.jobTitle || application.role || 'Offre'}</Text>
      <Text style={styles.subtitle}>Postulee le {formatDate(application.createdAt)}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ou en est votre offre ?</Text>
        <View style={styles.statusLine}>
          {statusSteps.map((step, index) => {
            const active = step.key === currentStatus;
            const rejected = currentStatus === 'rejected' && step.key === 'rejected';
            const accepted = currentStatus === 'accepted' && step.key === 'accepted';

            return (
              <React.Fragment key={step.key}>
                <View style={styles.stepWrap}>
                  <View style={[
                    styles.stepDot,
                    active && styles.stepDotActive,
                    rejected && styles.stepDotRejected,
                    accepted && styles.stepDotAccepted,
                  ]}>
                    <Text style={[styles.stepDotText, active && styles.stepDotTextActive]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{step.label}</Text>
                </View>
                {index < statusSteps.length - 1 && <View style={styles.connector} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          {application.interviewStatus === 'submitted'
            ? 'Interview envoyee'
            : statusSteps.find(step => step.key === currentStatus)?.label}
        </Text>
        <Text style={styles.infoText}>
          {application.interviewStatus === 'submitted'
            ? "Vos reponses sont arrivees chez l'equipe RH."
            : currentStatus === 'interview'
              ? "L'equipe RH vous invite a repondre aux questions d'entretien."
              : currentStatus === 'accepted'
                ? "Votre candidature a recu une suite favorable."
                : currentStatus === 'rejected'
                  ? "Votre candidature n'a pas ete retenue pour cette offre."
                  : "Votre candidature est en cours de traitement par l'equipe RH."}
        </Text>
      </View>

      {canAnswerInterview && (
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Interview', { applicationId: application.id })}>
          <Text style={styles.btnText}>Passer l'entretien</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 16 },
  kicker: { marginTop: 10, color: '#4f46e5', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 16 },
  statusLine: { flexDirection: 'row', alignItems: 'center' },
  stepWrap: { width: 58, alignItems: 'center' },
  stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#e0e7ff' },
  stepDotActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  stepDotAccepted: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepDotRejected: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  stepDotText: { fontSize: 11, fontWeight: '800', color: '#6b7280' },
  stepDotTextActive: { color: '#fff' },
  stepLabel: { marginTop: 6, fontSize: 10, color: '#6b7280', fontWeight: '700' },
  stepLabelActive: { color: '#1f2937' },
  connector: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 2, marginBottom: 18 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  btn: { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  center: { flex: 1, backgroundColor: '#f8f9ff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  centerText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
