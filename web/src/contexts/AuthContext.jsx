import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, authPersistenceReady, db } from "@/services/firebase";

const AuthContext = createContext(undefined);
const DEFAULT_DEPT = "Human Resources";

const getAuthErrorMessage = (error) => {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email ou mot de passe incorrect. Verifiez aussi que ce compte existe dans le meme projet Firebase que la web app.";
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Reessayez plus tard ou reinitialisez le mot de passe dans Firebase.";
    case "auth/operation-not-allowed":
      return "La connexion Email/Password n'est pas activee dans Firebase Authentication.";
    case "auth/email-already-in-use":
      return "Cet email existe deja. Connectez-vous avec ce compte ou utilisez un autre email.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible. Utilisez au moins 6 caracteres.";
    case "auth/network-request-failed":
      return "Connexion Firebase impossible. Verifiez votre connexion internet.";
    case "permission-denied":
      return "Profil RH inaccessible. Publiez les regles Firestore du projet puis reessayez.";
    default:
      return error?.message || "Connexion RH impossible.";
  }
};

const buildHrProfile = (firebaseUser, overrides = {}) => ({
  name: overrides.name || firebaseUser.displayName || firebaseUser.email || "Admin RH",
  email: firebaseUser.email || overrides.email || "",
  role: "hr",
  dept: overrides.dept || DEFAULT_DEPT,
});

const saveHrProfile = async (firebaseUser, overrides = {}) => {
  const profile = buildHrProfile(firebaseUser, overrides);
  await setDoc(
    doc(db, "users", firebaseUser.uid),
    {
      ...profile,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return profile;
};

const getOrCreateHrProfile = async (firebaseUser, overrides = {}) => {
  const profileRef = doc(db, "users", firebaseUser.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return saveHrProfile(firebaseUser, overrides);
  }

  return profileSnap.data();
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userDept, setUserDept] = useState(DEFAULT_DEPT);
  const [loading, setLoading] = useState(true);
  const pendingHrRegistration = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsAuthenticated(false);
        setRole(null);
        setUserName("");
        setUserEmail("");
        setUserDept(DEFAULT_DEPT);
        setLoading(false);
        return;
      }

      try {
        const profile = await getOrCreateHrProfile(firebaseUser);

        if (pendingHrRegistration.current) {
          return;
        }

        if (profile.role !== "hr") {
          await signOut(auth);
          setIsAuthenticated(false);
          setRole(null);
          setUserName("");
          setUserEmail("");
          setUserDept(DEFAULT_DEPT);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setRole("hr");
        setUserName(profile.name || firebaseUser.email || "Admin RH");
        setUserEmail(profile.email || firebaseUser.email || "");
        setUserDept(profile.dept || DEFAULT_DEPT);
        setLoading(false);
      } catch (error) {
        console.error("Unable to load HR profile", error);
        await signOut(auth);
        setIsAuthenticated(false);
        setRole(null);
        setUserName("");
        setUserEmail("");
        setUserDept(DEFAULT_DEPT);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await authPersistenceReady;
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getOrCreateHrProfile(credential.user, { email: email.trim() });

      if (profile.role !== "hr") {
        await signOut(auth);
        throw new Error("Ce compte n'a pas acces a l'espace RH.");
      }
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const register = async ({ name, email, password, dept = DEFAULT_DEPT }) => {
    try {
      await authPersistenceReady;
      pendingHrRegistration.current = true;
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const displayName = name.trim() || "Admin RH";

      await updateFirebaseProfile(credential.user, { displayName });
      await saveHrProfile(credential.user, { name: displayName, email: email.trim(), dept });
      setIsAuthenticated(true);
      setRole("hr");
      setUserName(displayName);
      setUserEmail(credential.user.email || email.trim());
      setUserDept(dept);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      pendingHrRegistration.current = false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = (data) => {
    if (data.name !== undefined) setUserName(data.name);
    if (data.email !== undefined) setUserEmail(data.email);
    if (data.dept !== undefined) setUserDept(data.dept);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      role,
      userName,
      userEmail,
      userDept,
      loading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [isAuthenticated, role, userName, userEmail, userDept, loading],
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
};
