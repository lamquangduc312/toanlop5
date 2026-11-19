import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
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

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

/** null khi chưa cấu hình .env.local → ứng dụng tự chuyển sang lưu localStorage */
export const db: Firestore | null = app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null;

/** Đăng nhập Google của phụ huynh – phiên đăng nhập được nhớ trên trình duyệt (browserLocalPersistence mặc định) */
export const auth: Auth | null = app ? getAuth(app) : null;

export const ATTEMPTS_COLLECTION = 'attempts';
export const CHILDREN_COLLECTION = 'children';

/** Hồ sơ cũ của bé Hà Ngân (trước khi có đăng nhập) – thuộc về tài khoản Gmail dưới đây */
export const LEGACY_CHILD_ID = 'lam-ha-ngan-5a7';
export const LEGACY_OWNER_EMAIL = 'lamquangduc312@gmail.com';
