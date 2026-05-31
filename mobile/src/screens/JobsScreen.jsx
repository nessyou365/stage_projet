import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getCandidateApplications, getJobs } from '../services/firebase';

const statusMeta = {
  Applied: { label: 'Envoyee', color: '#6b7280' },
  Reviewed: { label: 'En review', color: '#4f46e5' },
  Interview: { label: 'Interview', color: '#f59e0b' },
  Offered: { label: 'Offre', color: '#10b981' },
  Accepted: { label: 'Acceptee', color: '#10b981' },
  Rejected: { label: 'Refusee', color: '#ef4444' },
};

export default function JobsScreen({ navigation }) {
  const user = auth().currentUser;
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = getJobs(
      data => {
        setJobs(data);
        setError('');
        setLoading(false);
      },
      err => {
        setError(err.message || 'Impossible de charger les offres.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = getCandidateApplications(user.uid, setApplications);
    return unsub;
  }, [user]);

  const applicationByJob = Object.fromEntries(applications.map(app => [app.jobId, app]));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#4f46e5" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Offres disponibles</Text>
      {error ? (
        <View style={styles.empty}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune offre disponible pour le moment</Text>
        </View>
      ) : (
        jobs.map(job => {
          const application = applicationByJob[job.id];
          const meta = statusMeta[application?.status];

          return (
          <TouchableOpacity key={job.id} style={styles.card}
            onPress={() => navigation.navigate('JobDetail', { job, application })}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.meta}>{job.department} • {job.location}</Text>
            {meta && (
              <View style={[styles.statusBadge, { backgroundColor: `${meta.color}20` }]}>
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            )}
            <View style={styles.skills}>
              {(job.skills || []).slice(0, 3).map(s => (
                <View key={s} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>
              ))}
            </View>
          </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginTop: 20, marginBottom: 16 },
  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  meta: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  skills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  skill: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  skillText: { fontSize: 11, color: '#4f46e5', fontWeight: '500' },
});
