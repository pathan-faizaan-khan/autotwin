// Firebase client SDK initialization
// Replace these config values with your Firebase project credentials from:
// Firebase Console → Project Settings → Your Apps → Web App → Config

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyClh2xWQFOYj4LgmiL-oxpIDfAFrVCwPiU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "autotwin-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "autotwin-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "autotwin-ai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1026999424356",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1026999424356:web:bd9402b8475d1896cc5671",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SLB1JCFR8Q",
  databaseURL: "https://autotwin-ai-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Prevent duplicate initialization in Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimedb = getDatabase(app);
export default app;
