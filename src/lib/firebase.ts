import { initializeApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/** null khi chưa cấu hình .env.local → ứng dụng tự chuyển sang lưu localStorage */
export const db: Firestore | null = isFirebaseConfigured
  ? initializeFirestore(initializeApp(firebaseConfig), { ignoreUndefinedProperties: true })
  : null;

export const ATTEMPTS_COLLECTION = 'attempts';
