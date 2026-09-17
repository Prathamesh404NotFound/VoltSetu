// Firebase core services — initialised eagerly (needed at startup)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCeRiFBS4sKaM0KOaIgrC8VkxFHYARoS8s",
  authDomain: "charge-nest.firebaseapp.com",
  databaseURL: "https://charge-nest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "charge-nest",
  storageBucket: "charge-nest.firebasestorage.app",
  messagingSenderId: "25271736707",
  appId: "1:25271736707:web:f4e792c64ce5b69dce7eb6",
  measurementId: "G-HVLLLQYEG9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Eager singletons needed on every page render
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

/**
 * Deferred Analytics initialisation.
 *
 * getAnalytics() loads the Google Analytics SDK (≈15 KB gzip) and fires an
 * initial page-view ping. Neither is needed to render the UI, so we defer
 * it until the browser is idle (after paint, non-blocking) using
 * requestIdleCallback with a 4-second deadline.
 *
 * This moves Analytics completely off the critical path and improves TTI.
 */
let analyticsInitialised = false;

function initAnalytics() {
  if (analyticsInitialised) return;
  analyticsInitialised = true;
  import("firebase/analytics").then(({ getAnalytics }) => {
    getAnalytics(app);
  });
}

if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(initAnalytics, { timeout: 4000 });
} else {
  // Safari / older browsers fallback
  setTimeout(initAnalytics, 3000);
}

export { app };
export default app;
