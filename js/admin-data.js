// js/admin-data.js
import { auth, db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, where, getDocs, runTransaction } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { qs, showToast, formatCurrency } from './utils.js';

// create tournament UI
qs('#btn-create-tournament').addEventListener('click', ()=>{
  // open tournament creation area
  // for simplicity we show the tournament-section
  document.querySelectorAll('section').forEach(s=>s.classList.add('hidden'));
  qs('#tournament-section').classList.remove('hidden');
});

qs('#btn-save-tournament').addEventListener('click', async ()=>{
  const title = qs('#t-title').value.trim();
  const gameName = qs('#t-game').value.trim();
  const entryFee = Number(qs('#t-entry').value) || 0;
  const prizePool = Number(qs('#t-prize').value) || 0;
  const matchTime = qs('#t-time').value ? new Date(qs('#t-time').value) : new Date();
  const commissionRate = Number(qs('#t-commission').value) || 0;
  if(!title || !gameName){ showToast('Title & Game required'); return; }
  try{
    await addDoc(collection(db,'tournaments'),{
      title, gameName, entryFee, prizePool, matchTime, commissionRate, status: 'Upcoming', roomId: '', roomPassword: '', createdAt: new Date()
    });
    showToast('Tournament created');
    // clear
    qs('#t-title').value=''; qs('#t-game').value=''; qs('#t-entry').value=''; qs('#t-prize').value=''; qs('#t-time').value=''; qs('#t-commission').value='';
  }catch(e){ console.error(e); showToast('Create failed'); }
});

// list all tournaments
const adminTournamentsList = qs('#admin-all-tournaments');
const allTournamentsQuery = query(collection(db,'tournaments'), orderBy('createdAt','desc'));
onSnapshot(allTournamentsQuery, snap =>{
  adminTournamentsList.innerHTML = '';
  snap.forEach(docSnap =>{
    const t = { id: docSnap.id, ...docSnap.data() };
    const el = document.createElement('div');
    el.className = 'p-3 bg-slate-900/40 rounded-lg flex justify-between items-center';
    el.innerHTML = `<div><div class="font-semibold">${t.title}</div><div class="text-xs text-slate-400">${t.gameName} • ${t.status}</div></div><div class="flex gap-2"><button data-id="${t.id}" class="btn-manage py-1 px-2 rounded bg-indigo-600 text-sm">Manage</button><button data-id="${t.id}" class="btn-delete py-1 px-2 rounded bg-red-600 text-sm">Delete</button></div>`;
    el.querySelector('.btn-delete').addEventListener('click', async ()=>{ if(confirm('Delete?')) await deleteDoc(doc(db,'tournaments', t.id)); });
    el.querySelector('.btn-manage').addEventListener('click', ()=> openManage(t.id));
    adminTournamentsList.appendChild(el);
  });
});

// Manage single tournament
async function openManage(tournamentId){
  // show manage section
  document.querySelectorAll('section').forEach(s=>s.classList.add('hidden'));
  qs('#manage-tournament-section').classList.remove('hidden');
  // show header
  const tRef = doc(db,'tournaments',tournamentId);
  const tSnap = await (await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')).getDoc(tRef);
  const t = tSnap.data();
  qs('#manage-tournament-header').innerHTML = `<div class="font-semibold">Manage: ${t.title}</div><div class="text-xs text-slate-400">${t.gameName}</div>`;
  qs('#room-id').value = t.roomId || '';
  qs('#room-pass').value = t.roomPassword || '';

  // participants listener
  const pQuery = query(collection(db,'participants'), where('tournamentId','==',tournamentId));
  onSnapshot(pQuery, snap =>{
    const list = qs('#participants-list'); list.innerHTML = '';
    snap.forEach(d=>{
      const p = d.data();
      const el = document.createElement('div'); el.className='p-2 bg-slate-900/40 rounded-lg flex justify-between items-center text-sm';
      el.innerHTML = `<div>${p.username}</div><div class="text-xs text-slate-400">${p.status}</div>`;
      list.appendChild(el);
    });
  });

  // save room
  qs('#btn-save-room').onclick = async ()=>{
    await updateDoc(tRef, { roomId: qs('#room-id').value, roomPassword: qs('#room-pass').value });
    showToast('Room saved');
  };

  // declare winner — open a prompt with userId
  qs('#btn-declare').onclick = async ()=>{
    // fetch participants
    const snaps = await getDocs(query(collection(db,'participants'), where('tournamentId','==',tournamentId)));
    const participants = snaps.docs.map(d=> ({ id: d.id, ...d.data() }));
    if(participants.length === 0){ showToast('No participants'); return; }
    const names = participants.map((p,i)=>`${i+1}. ${p.username}`).join('\n');
    const sel = prompt('Pick a winner (enter number)\n\n' + names);
    const idx = Number(sel) - 1; if(isNaN(idx) || idx < 0 || idx >= participants.length) { showToast('Invalid selection'); return; }
    const winner = participants[idx];
    // run prize distribution transaction
    try{
      await runTransaction(db, async (tx)=>{
        const winnerRef = doc(db,'users',winner.userId);
        const winnerSnap = await tx.get(winnerRef);
        const winnerBal = winnerSnap.data().walletBalance || 0;
        const tourSnap = await tx.get(tRef);
        const prize = tourSnap.data().prizePool || 0;
        // credit winner
        tx.update(winnerRef, { walletBalance: winnerBal + prize });
        // update participants winner status
        const winnerPartRef = doc(db,'participants', winner.id);
        tx.update(winnerPartRef, { status: 'Winner' });
        // mark tournament complete
        tx.update(tRef, { status: 'Completed' });
        // create transaction doc
        const trRef = doc(collection(db,'transactions'));
        tx.set(trRef, { userId: winner.userId, amount: prize, type: 'credit', description: `Prize for ${tourSnap.data().title}`, createdAt: new Date() });
      });
      showToast('Winner declared & prize distributed');
    }catch(e){ console.error(e); showToast('Distribution failed'); }
  };
}

console.log('Admin module loaded');
