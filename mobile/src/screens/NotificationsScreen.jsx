import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getNotifications, markNotifRead } from '../services/firebase';

export default function NotificationsScreen({ navigation }) {
  const user = auth().currentUser;
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = getNotifications(user.uid, data => { setNotifs(data); setLoading(false); });
    return unsub;
  }, [user]);

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.read);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await Promise.all(unread.map(n => markNotifRead(user.uid, n.id)));
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      setNotifs(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      await markNotifRead(user.uid, notification.id);
    }

    if (notification.applicationId) {
      navigation.navigate('ApplicationStatus', { applicationId: notification.applicationId });
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#4f46e5" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifs.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllRead}><Text style={styles.link}>Tout lire</Text></TouchableOpacity>
        )}
      </View>
      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        notifs.map(n => (
          <TouchableOpacity key={n.id} style={[styles.card, !n.read && styles.unread]}
            onPress={() => openNotification(n)}>
            <Text style={[styles.notifTitle, !n.read && styles.bold]}>{n.title}</Text>
            <Text style={styles.notifMsg}>{n.message}</Text>
            {n.applicationId && (
              <Text style={styles.actionText}>Voir le statut</Text>
            )}
            {n.aiFeedback && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackLabel}>🤖 Feedback IA :</Text>
                <Text style={styles.feedbackText}>{n.aiFeedback}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  link: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 },
  unread: { borderLeftWidth: 3, borderLeftColor: '#4f46e5', backgroundColor: '#fafaff' },
  notifTitle: { fontSize: 14, color: '#1f2937', marginBottom: 4 },
  bold: { fontWeight: '700' },
  notifMsg: { fontSize: 13, color: '#6b7280' },
  actionText: { color: '#4f46e5', fontSize: 12, fontWeight: '700', marginTop: 8 },
  feedback: { marginTop: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10 },
  feedbackLabel: { fontSize: 12, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  feedbackText: { fontSize: 12, color: '#374151' },
});
