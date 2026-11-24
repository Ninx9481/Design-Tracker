import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// 'firestore' (ค่าเริ่มต้น) = ย่อภาพแล้วเก็บใน Firestore, 'storage' = Cloud Storage (ต้องใช้แพ็กเกจ Blaze)
export const IMAGE_STORE = env.VITE_IMAGE_STORE === 'storage' ? 'storage' : 'firestore';

export const configured = Boolean(config.apiKey && config.projectId && config.appId);

const app = configured ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app && IMAGE_STORE === 'storage' ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();
