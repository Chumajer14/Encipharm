import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  appId: "VITE_FIREBASE_APP_ID",
};

export const missingFirebaseConfigKeys = Object.entries(requiredConfig)
  .filter(([key]) => {
    const value = firebaseConfig[key];
    return !value || value.startsWith("your-");
  })
  .map(([, envName]) => envName);

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

export function getFirebaseConfigHelpMessage() {
  const missingKeys = missingFirebaseConfigKeys.join(", ");

  if (import.meta.env.PROD) {
    return `Faltan variables de Firebase en Vercel: ${missingKeys}. Configuralas en Project Settings > Environment Variables y ejecuta Redeploy.`;
  }

  return `Faltan variables de Firebase en frontend/.env: ${missingKeys}.`;
}

export const isOptionalFirebaseConfigComplete = [
  "storageBucket",
  "messagingSenderId",
  "measurementId",
].every((key) => {
  const value = firebaseConfig[key];
  return value && !value.startsWith("your-");
});

export const firebaseApp = isFirebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
