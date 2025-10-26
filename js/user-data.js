// js/user-data.js
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, runTransaction, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { showToast, formatCurrency, qs } from './utils.js';

// join tournament logic — uses a transaction to debit wallet and create participant + transaction entry
export async function joinTournament(tournamentId){
  const user = auth.currentUser;
  if(!user){ showToast('Please log in to join'); return; }
  try{
    const tourRef = doc(db,'tournaments',tournamentId);
    const userRef = doc(db,'users',user.uid);
    const participantsColl = collection(db,'participants');
    await runTransaction(db, async (tx)=>{
      const [tourSnap, userSnap] = await Promise.all([tx.get(tourRef), tx.get(userRef)]);
      if(!tourSnap.exists()) throw new Error('Tournament not found');
      const tour = tourSnap.data();
      const userData = userSnap.data();
      const balance = userData.walletBalance || 0;
      if(balance < tour.entryFee) throw new Error('Insufficient Balance');
      // debit user
      tx.update(userRef, { walletBalance: balance - tour.entryFee });
      // create participant doc
      const pRef = doc(participantsColl);
      tx.set(pRef, {
        tournamentId,
        userId: user.uid,
        username: userData.username || user.displayName || 'Player',
        status: 'Joined',
        joinedAt: serverTimestamp()
      });
      // create transaction doc
      const tRef = doc(collection(db,'transactions'));
      tx.set(tRef, {
        userId: user.uid,
        amount: tour.entryFee,
        type: 'debit',
        description: `Entry fee for ${tour.title}`,
        createdAt: serverTimestamp()
      });
    });
    showToast('Joined successfully');
  }catch(err){ console.error(err); showToast(err.message || 'Failed to join'); }
}

// Wallet helpers
export async function addMoney(amount=100){
  const user = auth.currentUser; if(!user){ showToast('Login first'); return; }
  try{
    const userRef = doc(db,'users',user.uid);
    await runTransaction(db, async (tx)=>{
      const u = await tx.get(userRef);
      const bal = (u.data().walletBalance||0) + amount;
      tx.update(userRef, { walletBalance: bal });
      const tr = doc(collection(db,'transactions'));
      tx.set(tr, { userId: user.uid, amount, type: 'credit', description: 'Add Money (simulation)', createdAt: serverTimestamp() });
    });
    showToast('₹'+amount+' added to wallet');
  }catch(e){ console.error(e); showToast('Could not add money'); }
}

export async function withdrawMoney(amount=100){
  const user = auth.currentUser; if(!user){ showToast('Login first'); return; }
  try{
    const userRef = doc(db,'users',user.uid);
    await runTransaction(db, async (tx)=>{
      const u = await tx.get(userRef);
      const bal = u.data().walletBalance||0;
      if(bal < amount) throw new Error('Insufficient Balance');
      tx.update(userRef, { walletBalance: bal - amount });
      const tr = doc(collection(db,'transactions'));
      tx.set(tr, { userId: user.uid, amount, type: 'debit', description: 'Withdraw (simulation)', createdAt: serverTimestamp() });
    });
    showToast('Withdraw successful');
  }catch(e){ console.error(e); showToast(e.message || 'Withdraw failed'); }
}

// Real-time listeners for wallet & transactions & my tournaments
import { onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

export function initUserListeners(){
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    const uRef = doc(db,'users',user.uid);
    onSnapshot(uRef, snap => {
      const data = snap.data();
      qs('#wallet-amount').textContent = formatCurrency(data?.walletBalance || 0);
      qs('#wallet-big').textContent = formatCurrency(data?.walletBalance || 0);
      qs('#profile-username').value = data?.username || '';
      qs('#profile-email').value = data?.email || user.email || '';
    });

    // transactions list
    const txQuery = query(collection(db,'transactions'), where('userId','==',user.uid), orderBy('createdAt','desc'));
    onSnapshot(txQuery, snap =>{
      const list = qs('#transactions-list'); list.innerHTML = '';
      snap.forEach(d=>{
        const t = d.data();
        const el = document.createElement('div');
        el.className = 'p-3 bg-slate-900/40 rounded-lg flex justify-between items-center text-sm';
        el.innerHTML = `<div>${t.description || t.type}</div><div>${t.type==='credit'?'+':'-'}₹${t.amount}</div>`;
        list.appendChild(el);
      });
    });

    // my tournaments
    const partQuery = query(collection(db,'participants'), where('userId','==',user.uid), orderBy('joinedAt','desc'));
    onSnapshot(partQuery, snap =>{
      const list = qs('#my-tournaments-list'); list.innerHTML = '';
      snap.forEach(async d=>{
        const p = d.data();
        // fetch tournament
        const tRef = doc(db,'tournaments', p.tournamentId);
        const tSnap = await getDoc(tRef);
        const t = tSnap.exists() ? tSnap.data() : { title: 'Deleted' };
        const el = document.createElement('div');
        el.className = 'p-3 bg-slate-900/40 rounded-lg';
        let roomInfo = '';
        if(t.status === 'Live') roomInfo = `<div class="text-xs text-slate-400">Room: ${t.roomId || '-'} / ${t.roomPassword || '-'}</div>`;
        el.innerHTML = `<div class="flex justify-between"><div><div class="font-semibold">${t.title}</div><div class="text-xs text-slate-400">${p.status}</div>${roomInfo}</div><div class="text-sm">${formatCurrency(t.prizePool)}</div></div>`;
        list.appendChild(el);
      });
    });

  });
}

// Wire Add/Withdraw buttons
qs('#btn-add-money').addEventListener('click', ()=> addMoney(100));
qs('#btn-withdraw').addEventListener('click', ()=> withdrawMoney(100));

// Initialize listeners on module load
initUserListeners();

console.log('User-data module loaded');
