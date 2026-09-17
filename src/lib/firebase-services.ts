// Firebase services exports
import { app } from "./firebase";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Initialize Firebase services
export const auth = getAuth(app);

// Enforce local persistence so user authentication remains active across browser restarts and page reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Failed to set auth persistence:", err);
});

export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

export { app };
