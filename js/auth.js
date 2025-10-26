// js/auth.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateEmail, updatePassword, updateProfile } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { qs, showToast } from './utils.js';

// UI elements
const tabLogin = qs('#tab-login');
const tabSignup = qs('#tab-signup');
const loginForm = qs('#login-form');
const signupForm = qs('#signup-form');

// Toggle tabs
tabLogin.addEventListener('click', ()=> { loginForm.classList.remove('hidden'); signupForm.classList.add('hidden'); });
tabSignup.addEventListener('click', ()=> { signupForm.classList.remove('hidden'); loginForm.classList.add('hidden'); });

// Signup
qs('#btn-signup').addEventListener('click', async ()=>{
  const username = qs('#signup-username').value.trim();
  const email = qs('#signup-email').value.trim();
  const password = qs('#signup-password').value;
  if(!username || !email || !password){ showToast('Please fill all fields'); return; }
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // update display name
    await updateProfile(cred.user, { displayName: username });
    // create user doc in Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      username,
      email,
      walletBalance: 0,
      createdAt: serverTimestamp(),
      isAdmin: false
    });
    showToast('Account created — logged in');
  }catch(err){ console.error(err); showToast(err.message || 'Sign up failed'); }
});

// Login
qs('#btn-login').addEventListener('click', async ()=>{
  const email = qs('#login-email').value.trim();
  const password = qs('#login-password').value;
  if(!email || !password){ showToast('Please enter email & password'); return; }
  try{
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Logged in');
  }catch(err){ console.error(err); showToast(err.message || 'Login failed'); }
});

// Logout
qs('#btn-logout').addEventListener('click', async ()=>{
  await signOut(auth);
  showToast('Logged out');
});

// Profile update & password change
qs('#btn-update-profile').addEventListener('click', async ()=>{
  const username = qs('#profile-username').value.trim();
  const email = qs('#profile-email').value.trim();
  const user = auth.currentUser;
  if(!user){ showToast('No user'); return; }
  try{
    if(username) await updateProfile(user, { displayName: username });
    if(email && email !== user.email) await updateEmail(user, email);
    // update Firestore user doc
    await setDoc(doc(db, 'users', user.uid), { username, email }, { merge: true });
    showToast('Profile updated');
  }catch(err){ console.error(err); showToast(err.message || 'Update failed'); }
});

qs('#btn-change-password').addEventListener('click', async ()=>{
  const newPass = prompt('Enter new password (min length enforced by Firebase)');
  if(!newPass) return; const user = auth.currentUser; if(!user){ showToast('Not signed in'); return; }
  try{ await updatePassword(user, newPass); showToast('Password changed'); }catch(err){ console.error(err); showToast(err.message || 'Change failed'); }
});

// Broadcast auth changes via custom event
onAuthStateChanged(auth, async (user)=>{
  const evt = new CustomEvent('authChanged', { detail: { user } });
  window.dispatchEvent(evt);
  // If user logged in, ensure user doc exists
  if(user){
    try{
      const userDoc = await getDoc(doc(db,'users',user.uid));
      if(!userDoc.exists()){
        // create a minimal profile
        await setDoc(doc(db,'users',user.uid),{
          username: user.displayName || 'Player'+user.uid.substring(0,6),
          email: user.email,
          walletBalance: 0,
          createdAt: serverTimestamp(),
          isAdmin: false
        });
      }
    }catch(e){ console.error('Ensure user doc', e); }
  }
});

console.log('Auth module loaded');
