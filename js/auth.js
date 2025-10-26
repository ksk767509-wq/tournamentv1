import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, updateEmail } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import * as UI from './ui.js';
import * as Router from './router.js';

// Elements
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authForm = document.getElementById('auth-form');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
let mode = 'login';

tabLogin.addEventListener('click', () => { mode = 'login'; tabLogin.classList.add('bg-gray-700'); tabSignup.classList.remove('bg-gray-700'); });
tabSignup.addEventListener('click', () => { mode = 'signup'; tabSignup.classList.add('bg-gray-700'); tabLogin.classList.remove('bg-gray-700'); });

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  const username = authUsername.value.trim() || email.split('@')[0];
  try {
    if (mode === 'signup'){
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // create a Firestore profile
      await setDoc(doc(db, 'users', cred.user.uid), {
        username, email, walletBalance: 0, createdAt: serverTimestamp(), isAdmin: false
      });
      UI.toast('Account created — welcome!');
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      UI.toast('Logged in successfully');
    }
  } catch (err) {
    console.error(err);
    UI.toast(err.message || 'Auth error');
  }
});

// Apply guest button to create a temporary anonymous user (not using Firebase anonymous auth to keep rules simple)
const guestBtn = document.getElementById('guest-btn');
guestBtn.addEventListener('click', async () => {
  // Create a throwaway user with random credentials for demo purposes
  const rnd = Math.random().toString(36).slice(2,8);
  const email = `guest+${rnd}@example.com`;
  const password = `Pass#${rnd}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), { username: `Guest-${rnd}`, email, walletBalance: 0, createdAt: serverTimestamp(), isAdmin: false });
    UI.toast('Guest account created');
  } catch (err) { UI.toast(err.message); }
});

// Logout handler
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  UI.toast('Logged out');
});

// Profile save/change password
const saveProfileBtn = document.getElementById('save-profile-btn');
const changePasswordBtn = document.getElementById('change-password-btn');
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');

saveProfileBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return UI.toast('Not signed in');
  const newName = profileUsername.value.trim();
  const newEmail = profileEmail.value.trim();
  try {
    if (newEmail && newEmail !== user.email) await updateEmail(user, newEmail);
    await setDoc(doc(db, 'users', user.uid), { username: newName, email: newEmail }, { merge: true });
    UI.toast('Profile updated');
  } catch (err) { UI.toast(err.message); }
});

changePasswordBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  const newPass = prompt('Enter new password (min 6 chars)');
  if (!newPass) return;
  try { await updatePassword(user, newPass); UI.toast('Password updated'); }
  catch (err) { UI.toast(err.message); }
});

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // fetch additional profile
    const userDoc = await (await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js')).getDoc((await import('./firebase-config.js')).doc((await import('./firebase-config.js')).db, 'users', user.uid)).catch(()=>null);
    // Show home
    Router.navigate('home');
    UI.updateHeader(user.uid);
  } else {
    Router.navigate('auth');
    UI.updateHeader(null);
  }
});
