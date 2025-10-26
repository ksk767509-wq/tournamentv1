import { auth, db } from './firebase-config.js';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import * as UI from './ui.js';
import { renderTournamentCard, clear } from './ui.js';

// Realtime listener for upcoming tournaments
const tournamentsGrid = document.getElementById('tournaments-grid');
(async function loadTournaments(){
  const { collection: col, query: q, where: w, onSnapshot: os } = await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js');
  const tournamentsRef = col(db, 'tournaments');
  const qref = q(tournamentsRef, w('status','==','Upcoming'));
  onSnapshot(qref, snap => {
    clear(tournamentsGrid);
    snap.forEach(docSnap => {
      const data = docSnap.data(); data.id = docSnap.id;
      tournamentsGrid.appendChild(renderTournamentCard(data));
    });
  });
})();

// Join logic
export async function joinTournament(tournamentId){
  const user = auth.currentUser;
  if (!user) return UI.toast('Please sign in');
  const userRef = doc(db, 'users', user.uid);
  const tRef = doc(db, 'tournaments', tournamentId);
  const userSnap = await getDoc(userRef);
  const tSnap = await getDoc(tRef);
  if (!userSnap.exists() || !tSnap.exists()) return UI.toast('Data not found');
  const userData = userSnap.data();
  const tData = tSnap.data();
  const fee = Number(tData.entryFee || 0);
  if ((userData.walletBalance || 0) < fee) return UI.toast('Insufficient Balance');

  // Debit user
  await updateDoc(userRef, { walletBalance: (userData.walletBalance || 0) - fee });
  // create participant
  await addDoc(collection(db, 'participants'), {
    tournamentId, userId: user.uid, username: userData.username || user.email, status: 'Joined', createdAt: serverTimestamp()
  });
  // create transaction
  await addDoc(collection(db, 'transactions'), {
    userId: user.uid, amount: -fee, type: 'debit', description: `Entry: ${tData.title}`, createdAt: serverTimestamp()
  });
  UI.toast('Joined tournament — good luck!');
}

// My tournaments view
const myList = document.getElementById('my-tournaments-list');
const myTabActive = document.getElementById('my-tab-active');
const myTabCompleted = document.getElementById('my-tab-completed');

myTabActive.addEventListener('click', ()=>{ myTabActive.classList.add('bg-gray-700'); myTabCompleted.classList.remove('bg-gray-700'); renderMy('active'); });
myTabCompleted.addEventListener('click', ()=>{ myTabCompleted.classList.add('bg-gray-700'); myTabActive.classList.remove('bg-gray-700'); renderMy('completed'); });

async function renderMy(mode='active'){
  clear(myList);
  const user = auth.currentUser; if (!user) return UI.toast('Sign in to view');
  const q = query(collection(db, 'participants'), where('userId','==',user.uid));
  const snaps = await getDocs(q);
  const ids = [];
  snaps.forEach(s => { const d = s.data(); d.id = s.id; ids.push(d); });
  for (const p of ids){
    const tSnap = await getDoc(doc(db, 'tournaments', p.tournamentId));
    const t = tSnap.exists() ? tSnap.data() : null;
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-xl p-3';
    card.innerHTML = `<div class="flex justify-between"><div>${t ? t.title : 'Deleted'}</div><div>${p.status}</div></div>`;
    if (t && t.status === 'Live'){
      const info = document.createElement('div');
      info.className = 'mt-2 text-xs text-gray-400';
      info.textContent = `Room: ${t.roomId || '-'} | Password: ${t.roomPassword || '-'}`;
      card.appendChild(info);
    }
    myList.appendChild(card);
  }
}

// Wallet features
const addMoneyBtn = document.getElementById('add-money-btn');
const withdrawBtn = document.getElementById('withdraw-btn');
const transactionsList = document.getElementById('transactions-list');
addMoneyBtn.addEventListener('click', ()=> simulateTransaction(100));
withdrawBtn.addEventListener('click', ()=> simulateTransaction(-100));

async function simulateTransaction(amount){
  const user = auth.currentUser; if (!user) return UI.toast('Sign in to transact');
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const ubal = (userSnap.data().walletBalance || 0) + amount;
  await updateDoc(userRef, { walletBalance: ubal });
  await addDoc(collection(db, 'transactions'), { userId: user.uid, amount, type: amount>0? 'credit':'debit', description: amount>0? 'Add Money':'Withdraw', createdAt: serverTimestamp() });
  UI.toast('Transaction complete');
}

// Real-time transactions listing
auth.onAuthStateChanged(async (user) => {
  clear(transactionsList);
  if (!user) return;
  const q = query(collection(db, 'transactions'), where('userId','==',user.uid));
  onSnapshot(q, snap => {
    clear(transactionsList);
    snap.forEach(s => { const d = s.data(); const el = document.createElement('div'); el.className='p-2 bg-gray-800 rounded-lg'; el.innerHTML = `<div class="text-xs">${d.description || ''}</div><div class="text-sm">₹${d.amount}</div>`; transactionsList.appendChild(el); });
  });
});

// expose for other modules
export { renderMy };
