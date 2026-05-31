import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getCandidateApplications } from '../services/firebase';

export default function HomeScreen({ navigation }) {
  const user = auth().currentUser;
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = getCandidateApplications(user.uid, setApplications);
    return unsub;
  }, [user]);

  const statusMeta = (s) => ({
    Applied: { label: 'Pending', color: '#6b7280' },
    Reviewed: { label: 'Pending', color: '#4f46e5' },
    Interview: { label: 'Interview', color: '#f59e0b' },
    Offered: { label: 'Offre', color: '#10b981' },
    Accepted: { label: 'Acceptee', color: '#10b981' },
    Rejected: { label: 'Refusee', color: '#ef4444' },
  }[s] || { label: s || 'En attente', color: '#6b7280' });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour 👋</Text>
        <Text style={styles.name}>{user?.displayName || 'Candidat'}</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity style={[styles.card, { backgroundColor: '#ede9fe' }]} onPress={() => navigation.navigate('Jobs')}>
          <Text style={styles.cardIcon}>💼</Text>
          <Text style={styles.cardTitle}>Offres d'emploi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { backgroundColor: '#fef3c7' }]} onPress={() => navigation.navigate('Spontaneous')}>
          <Text style={styles.cardIcon}>📨</Text>
          <Text style={styles.cardTitle}>Candidature spontanée</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Mes candidatures</Text>
      {applications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune candidature pour le moment</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
            <Text style={styles.link}>Voir les offres →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        applications.map(app => {
          const meta = statusMeta(app.status);

          return (
          <TouchableOpacity
            key={app.id}
            style={styles.appCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ApplicationStatus', { applicationId: app.id, initialApplication: app })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.appTitle}>{app.jobTitle || app.role}</Text>
              <Text style={styles.appDate}>{app.createdAt?.toDate?.().toLocaleDateString('fr-FR') || '—'}</Text>
              <Text style={styles.openHint}>Voir le statut</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${meta.color}20` }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{app.interviewStatus === 'submitted' ? 'Interview envoyee' : meta.label}</Text>
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
  header: { marginTop: 20, marginBottom: 24 },
  greeting: { fontSize: 14, color: '#6b7280' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#1f2937' },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  card: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  cardIcon: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontSize: 12, fontWeight: '600', textAlign: 'center', color: '#374151' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  link: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  appCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  appTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  appDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  openHint: { color: '#4f46e5', fontSize: 12, fontWeight: '700', marginTop: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
