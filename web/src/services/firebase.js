import { initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1xmapjAqTUYF-7KUjXQAzpSxeJj-Z91I",
  authDomain: "ai-recruitment-7cb75.firebaseapp.com",
  projectId: "ai-recruitment-7cb75",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const authPersistenceReady = setPersistence(auth, inMemoryPersistence);
export const db = getFirestore(app);
