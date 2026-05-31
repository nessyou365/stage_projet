# 🔥 Guide d'intégration Firebase — TalentAI

## Architecture globale

```
Firebase Project: ai-recruitment-system-44349
├── Authentication    → Email/Password pour HR et Candidats
├── Firestore         → Base de données temps réel
└── Storage           → Stockage des CV (PDF/DOCX)
```

---

## 1. Structure Firestore

```
/users/{userId}
  name, email, role ("hr" | "candidate"), createdAt

/jobs/{jobId}
  title, department, location, type, salaryMin, salaryMax,
  skills[], description, status ("Published"|"Draft"|"Closed"),
  createdBy (userId RH), applicants (count), createdAt

/applications/{appId}
  jobId, jobTitle, userId (candidat), cvUrl,
  status ("En attente"|"Accepté"|"Rejeté"),
  aiFeedback (string, rempli par RH lors du rejet),
  createdAt

/spontaneous/{appId}
  userId, email, cvUrl, description,
  status ("New"|"Reviewed"|"Archived"),
  createdAt

/notifications/{userId}/items/{notifId}
  title, message, type ("application"|"ai"|"interview"),
  aiFeedback (optionnel, pour les rejets),
  read (bool), createdAt

/settings/{userId}
  notifications: { apps, ai, interviews, digest },
  darkMode
```

---

## 2. Règles Firestore (Security Rules)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Utilisateurs : lecture/écriture sur son propre profil
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Jobs : lecture publique (candidats), écriture RH uniquement
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr';
    }

    // Applications : le candidat crée, le RH lit tout
    match /applications/{appId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr');
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr';
    }

    // Candidatures spontanées
    match /spontaneous/{appId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr';
    }

    // Notifications : chaque user lit/écrit les siennes
    match /notifications/{userId}/items/{notifId} {
      allow read, write: if request.auth.uid == userId;
      allow create: if request.auth != null; // permet au système d'en créer
    }
  }
}
```

---

## 3. Connecter la Web App à Firebase Auth

Remplacer `AuthContext.jsx` pour utiliser Firebase Auth réel :

```jsx
// src/contexts/AuthContext.jsx (version Firebase)
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snap.data();
        setUser(firebaseUser);
        setRole(data?.role || "candidate");
        setUserName(data?.name || firebaseUser.email);
      } else {
        setUser(null); setRole(null); setUserName("");
      }
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, name, role = "candidate") => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), { name, email, role });
  };

  const logout = () => signOut(auth);

  const isAuthenticated = !!user;
  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userName, user, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 4. Créer des jobs depuis le RH (JobOffers.jsx)

```jsx
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

// Charger les jobs en temps réel
useEffect(() => {
  const q = query(collection(db, "jobs"));
  return onSnapshot(q, snap => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}, []);

// Créer une offre
const handleSave = async () => {
  if (editingId) {
    await updateDoc(doc(db, "jobs", editingId), { ...form, updatedAt: serverTimestamp() });
  } else {
    await addDoc(collection(db, "jobs"), { ...form, applicants: 0, createdAt: serverTimestamp() });
  }
};

// Supprimer
const handleDelete = async (id) => await deleteDoc(doc(db, "jobs", id));
```

---

## 5. Décision RH → Notification candidat avec feedback IA

```jsx
// Dans DecisionsPage.jsx
import { updateDoc, doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";

const handleDecision = async (application, action, aiFeedback = "") => {
  const newStatus = action === "approve" ? "Accepté" : "Rejeté";

  // Mettre à jour la candidature
  await updateDoc(doc(db, "applications", application.id), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(action === "reject" && { aiFeedback })
  });

  // Envoyer une notification au candidat
  await addDoc(collection(db, "notifications", application.userId, "items"), {
    title: action === "approve" ? "🎉 Candidature acceptée" : "Mise à jour de candidature",
    message: action === "approve"
      ? `Félicitations ! Votre candidature pour "${application.jobTitle}" a été acceptée.`
      : `Votre candidature pour "${application.jobTitle}" n'a pas été retenue.`,
    aiFeedback: action === "reject" ? aiFeedback : null,
    type: "decision",
    read: false,
    createdAt: serverTimestamp()
  });
};
```

---

## 6. Upload CV vers Firebase Storage

```jsx
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";

export const uploadCV = async (file, userId) => {
  const storageRef = ref(storage, `cvs/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
```

---

## 7. Créer le premier compte HR (one-time setup)

Dans Firebase Console → Authentication → Add user :
- Email : `rh@talentai.com`
- Password : (votre choix)

Puis dans Firestore → Créer manuellement :
```
Collection: users
Document ID: (uid du compte créé)
Fields:
  name: "Admin RH"
  email: "rh@talentai.com"
  role: "hr"
```

---

## 8. Lancer les projets

### Web App
```bash
cd web-app-updated
npm install
npm run dev
```

### Mobile App (Expo)
```bash
cd mobile-app
npm install
npx expo start
# Scanner le QR code avec l'app Expo Go
```

### Pour le build mobile natif
```bash
npx expo build:android  # APK Android
npx expo build:ios      # IPA iOS (Mac requis)
# OU avec EAS Build (recommandé)
npx eas build --platform android
```

---

## 9. Variables d'environnement (optionnel)

```env
# .env (web-app-updated)
VITE_FIREBASE_API_KEY=AIzaSyAa-8VluriE4S9PL5R6-rRT9dAIBV7LGkI
VITE_FIREBASE_AUTH_DOMAIN=ai-recruitment-system-44349.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-recruitment-system-44349
VITE_FIREBASE_STORAGE_BUCKET=ai-recruitment-system-44349.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=632954257476
VITE_FIREBASE_APP_ID=1:632954257476:web:3922fea55dd466b41e3c11
```

---

## Résumé du flow complet

```
Candidat (mobile/web)          RH (web app)
─────────────────────          ────────────
1. S'inscrit → Firestore       1. Se connecte (role=hr)
2. Voit les jobs               2. Crée des offres → Firestore
3. Uploade CV → Storage        3. Voit les candidatures
4. Soumet candidature          4. Analyse IA des CVs
   → applications collection   5. Approuve / Rejette
5. Notification "En attente"      → notification au candidat
6. Reçoit notification status  6. Gère pipeline, décisions
7. Si rejeté → feedback IA
```
