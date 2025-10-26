// Firebase modular SDK initialization (ES module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';

// TODO: Replace these placeholders with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBxfnqCGm_KGojyIlMwlOPvnuw1l_e0z9Q",
  authDomain: "tournamentv1-1a92e.firebaseapp.com",
  projectId: "tournamentv1-1a92e",
  storageBucket: "tournamentv1-1a92e.firebasestorage.app",
  messagingSenderId: "340131295667",
  appId: "1:340131295667:web:8e5be4429cfc778dd2dbc6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('Firebase initialized (placeholder config). Replace keys in js/firebase-config.js');
