// Firebase modular SDK initialization (ES module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';

// TODO: Replace these placeholders with your actual Firebase project config
const firebaseConfig = {
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_MESSAGING_SENDER_ID",
  appId: "REPLACE_APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('Firebase initialized (placeholder config). Replace keys in js/firebase-config.js');
