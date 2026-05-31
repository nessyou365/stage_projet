// ============================================================
// MOBILE APP (Candidate فقط)
// ============================================================

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const WEB_FIREBASE_PROJECT_ID = 'ai-recruitment-7cb75';
const WEB_FIREBASE_API_KEY = 'AIzaSyA1xmapjAqTUYF-7KUjXQAzpSxeJj-Z91I';

const parseFirestoreValue = (value) => {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  return null;
};

const parseFirestoreFields = (fields = {}) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, parseFirestoreValue(value)]));

const toFirestoreValue = (value) => {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (value && typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)])),
      },
    };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  return { stringValue: value == null ? '' : String(value) };
};

const toFirestoreFields = (data) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]));

const createWebFirestoreDocument = async (collectionPath, payload, documentId) => {
  const query = new URLSearchParams({ key: WEB_FIREBASE_API_KEY });
  if (documentId) query.set('documentId', documentId);

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${WEB_FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}?${query.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(payload) }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Synchronisation dashboard impossible.');

  return data.name?.split('/').pop();
};

const setWebFirestoreDocument = async (documentPath, payload) => {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${WEB_FIREBASE_PROJECT_ID}/databases/(default)/documents/${documentPath}?key=${WEB_FIREBASE_API_KEY}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(payload) }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Synchronisation dashboard impossible.');

  return data.name?.split('/').pop();
};

const syncApplicationToWeb = async (application) => {
  if (!application?.id || !application?.jobId || !application?.cvUrl) return;

  await setWebFirestoreDocument(`applications/${application.id}`, {
    jobId: application.jobId,
    userId: application.userId || '',
    jobTitle: application.jobTitle || application.role || 'Offre',
    role: application.role || application.jobTitle || 'Offre',
    department: application.department || '',
    location: application.location || '',
    type: application.type || '',
    jobSkills: application.jobSkills || [],
    jobDescription: application.jobDescription || '',
    cvUrl: application.cvUrl,
    cvFileName: application.cvFileName || application.cvUrl.split('/').pop() || 'cv.pdf',
    candidateName: application.candidateName || 'Candidat',
    candidateEmail: application.candidateEmail || '',
    status: application.status || 'Applied',
    score: Number(application.score || 0),
    matchingScore: Number(application.matchingScore || 0),
    aiStatus: application.aiStatus || 'pending',
    createdAt: application.createdAt?.toDate?.() || new Date(),
  });
};

const getWebProjectJobs = async () => {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${WEB_FIREBASE_PROJECT_ID}/databases/(default)/documents/jobs?key=${WEB_FIREBASE_API_KEY}`
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Impossible de charger les offres web.');

  return (data.documents || [])
    .map((doc) => ({
      id: doc.name.split('/').pop(),
      ...parseFirestoreFields(doc.fields),
    }))
    .filter(job => (job.status || 'Published') === 'Published')
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
};

// ================= AUTH =================

export const registerCandidate = async (email, password, name) => {
  const cred = await auth().createUserWithEmailAndPassword(email, password);
  const displayName = name || 'Candidat';

  await cred.user.updateProfile({ displayName });

  await firestore().collection('candidates').doc(cred.user.uid).set({
    name: displayName,
    email,
    role: 'candidate',
    createdAt: firestore.FieldValue.serverTimestamp()
  });

  return cred;
};

export const loginCandidate = (email, password) =>
  auth().signInWithEmailAndPassword(email, password);

export const logout = () => auth().signOut();


// ================= JOBS =================

export const getJobs = (callback, onError) =>
  firestore()
    .collection('jobs')
    .onSnapshot(async snap => {
      const nativeJobs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(job => (job.status || 'Published') === 'Published');

      if (nativeJobs.length > 0) {
        callback(nativeJobs);
        return;
      }

      try {
        callback(await getWebProjectJobs());
      } catch (error) {
        callback(nativeJobs);
        if (onError) onError(error);
      }
    }, async error => {
      try {
        callback(await getWebProjectJobs());
      } catch (fallbackError) {
        if (onError) onError(fallbackError || error);
      }
    }
    );


// ================= CANDIDATES =================

export const getCandidateProfile = async (userId) => {
  try {
    const snap = await firestore().collection('candidates').doc(userId).get();
    return snap.exists ? snap.data() : null;
  } catch {
    return null;
  }
};


// ================= CLOUDINARY UPLOAD =================

export const uploadCV = async (candidateId, fileUri, fileName = 'cv.pdf', mimeType = 'application/pdf') => {
  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    type: mimeType || "application/pdf",
    name: fileName || "cv.pdf",
  });

  formData.append("upload_preset", "cv_uploads2026");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/diaeq8qup/auto/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Impossible d'uploader le CV.");
  }

  return data.secure_url;
};


// ================= APPLY =================

export const submitApplication = async (job, user, cvUrl) => {
  if (!job?.id || !user?.uid || !cvUrl) {
    throw new Error("Dossier de candidature incomplet.");
  }

  const profile = await getCandidateProfile(user.uid);
  const candidateName = profile?.name || user.displayName || user.email?.split('@')[0] || 'Candidat';
  const candidateEmail = profile?.email || user.email || '';

  const appRef = await firestore().collection('applications').add({
    jobId: job.id,
    userId: user.uid,
    jobTitle: job.title || 'Offre',
    role: job.title || 'Offre',
    department: job.department || '',
    location: job.location || '',
    jobSkills: job.skills || [],

    cvUrl,
    cvFileName: cvUrl.split('/').pop() || 'cv.pdf',
    candidateName,
    candidateEmail,
    status: "Applied",
    score: 0,
    matchingScore: 0,
    aiStatus: "pending",
    aiFeedback: null,

    createdAt: firestore.FieldValue.serverTimestamp()
  });

  await createWebFirestoreDocument('applications', {
    jobId: job.id,
    userId: user.uid,
    jobTitle: job.title || 'Offre',
    role: job.title || 'Offre',
    department: job.department || '',
    location: job.location || '',
    type: job.type || '',
    jobSkills: job.skills || [],
    jobDescription: job.description || '',
    cvUrl,
    cvFileName: cvUrl.split('/').pop() || 'cv.pdf',
    candidateName,
    candidateEmail,
    status: 'Applied',
    score: 0,
    matchingScore: 0,
    aiStatus: 'pending',
    createdAt: new Date(),
  }, appRef.id);

  await firestore()
    .collection('notifications')
    .doc('hr')
    .collection('items')
    .add({
      title: 'Nouvelle candidature',
      message: `${candidateName} a postule pour ${job.title || 'une offre'}.`,
      type: 'application',
      applicationId: appRef.id,
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp()
    });

  await createWebFirestoreDocument('notifications/hr/items', {
    title: 'Nouvelle candidature',
    message: `${candidateName} a postule pour ${job.title || 'une offre'}. Analyse IA en attente.`,
    type: 'application',
    applicationId: appRef.id,
    candidateName,
    candidateEmail,
    jobId: job.id,
    jobTitle: job.title || 'Offre',
    read: false,
    createdAt: new Date(),
  });

  return appRef.id;
};


// ================= SPONTANEOUS =================

export const submitSpontaneous = async (
  userId,
  email,
  cvUrl,
  description
) => {
  await firestore().collection('spontaneous').add({
    userId,
    email,
    cvUrl,
    description,
    status: "New",
    createdAt: firestore.FieldValue.serverTimestamp()
  });
};


// ================= APPLICATIONS =================

export const getCandidateApplications = (userId, callback) =>
  firestore()
    .collection('applications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      const applications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(applications);
      applications.forEach(application => {
        syncApplicationToWeb(application).catch(() => {});
      });
    });

export const getApplicationById = (applicationId, callback) =>
  firestore()
    .collection('applications')
    .doc(applicationId)
    .onSnapshot(doc => callback(doc.exists ? { id: doc.id, ...doc.data() } : null));

export const submitInterviewAnswers = async (applicationId, answers) => {
  const cleanAnswers = answers
    .map(item => ({
      question: item.question,
      answer: (item.answer || '').trim(),
    }))
    .filter(item => item.question && item.answer);

  if (cleanAnswers.length === 0) {
    throw new Error('Veuillez repondre au moins a une question.');
  }

  const appRef = firestore().collection('applications').doc(applicationId);
  const appSnap = await appRef.get();
  const application = appSnap.exists ? appSnap.data() : null;

  await appRef.update({
    interviewAnswers: cleanAnswers,
    interviewStatus: 'submitted',
    interviewSubmittedAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  await firestore()
    .collection('notifications')
    .doc('hr')
    .collection('items')
    .add({
      title: 'Entretien soumis',
      message: `${application?.candidateName || 'Un candidat'} a repondu aux questions pour ${application?.role || application?.jobTitle || 'une offre'}.`,
      type: 'interview_submitted',
      applicationId,
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
};


// ================= NOTIFICATIONS =================

export const getNotifications = (userId, callback) =>
  firestore()
    .collection('notifications')
    .doc(userId)
    .collection('items')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

export const markNotifRead = (userId, notifId) =>
  firestore()
    .collection('notifications')
    .doc(userId)
    .collection('items')
    .doc(notifId)
    .update({ read: true });
