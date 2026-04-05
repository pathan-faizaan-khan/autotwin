// Firebase client SDK initialization
// Replace these config values with your Firebase project credentials from:
// Firebase Console → Project Settings → Your Apps → Web App → Config

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyClh2xWQFOYj4LgmiL-oxpIDfAFrVCwPiU",
  authDomain: "autotwin-ai.firebaseapp.com",
  projectId: "autotwin-ai",
  storageBucket: "autotwin-ai.firebasestorage.app",
  messagingSenderId: "1026999424356",
  appId: "1:1026999424356:web:bd9402b8475d1896cc5671",
  measurementId: "G-SLB1JCFR8Q"
};



// Prevent duplicate initialization in Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
