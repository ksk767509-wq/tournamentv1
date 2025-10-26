import { auth, db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, deleteDoc, query, getDocs, where } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import * as UI from './ui.js';

const adminList = document.getElementById('admin-tournaments-list');
const adminStats = document.getElementById('admin-stats');
const createBtn = document.getElementById('create-new-btn');

createBtn.addEventListener('click', async () =>{
  const title = prompt('Title') || 'Untitled';
  const gameName = prompt('Game name') || 'Game';
  const entryFee = Number(prompt('Entry fee')||0);
  const prizePool = Number(prompt('Prize pool')||0);
  const matchTime = prompt('Match time') || new Date().toISOString();
  const commissionRate = Number(prompt('Commission %')||0);
  try{
    await addDoc(collection(db,'tournaments'), { title, gameName, entryFee, prizePool, matchTime, commissionRate, status: 'Upcoming', createdAt: serverTimestamp() });
    UI.toast('Tournament created');
  }catch(err){UI.toast(err.message)}
});

// Real-time list of all tournaments
onSnapshot(collection(db,'tournaments'), snap=>{
  adminList.innerHTML = '';
  snap.forEach(s=>{
    const t = s.data(); t.id = s.id;
    const el = document.createElement('div'); el.className = 'bg-gray-800 rounded-xl p-3 flex justify-between items-center';
    el.innerHTML = `<div><div class="text-sm font-semibold">${t.title}</div><div class="text-xs text-gray-400">${t.gameName} • ${t.matchTime}</div></div>
      <div class="flex gap-2">
        <button class="edit-btn px-3 py-1 rounded bg-yellow-600">Edit</button>
        <button class="manage-btn px-3 py-1 rounded bg-indigo-600">Manage</button>
        <button class="del-btn px-3 py-1 rounded bg-red-600">Delete</button>
      </div>`;
    adminList.appendChild(el);
    el.querySelector('.del-btn').addEventListener('click', async ()=>{ await deleteDoc(doc(db,'tournaments',t.id)); UI.toast('Deleted'); });
    el.querySelector('.manage-btn').addEventListener('click', ()=> openManage(t.id));
    el.querySelector('.edit-btn').addEventListener('click', async ()=>{
      const newTitle = prompt('New title', t.title);
      if (newTitle) await updateDoc(doc(db,'tournaments',t.id), { title: newTitle });
    });
  });
});

async function openManage(tournamentId){
  // show manage UI
  document.querySelector('#manage-tournament-section').classList.remove('hidden');
  document.querySelector('#admin-dashboard-section').classList.add('hidden');
  // load details & participants
  const tRef = doc(db,'tournaments',tournamentId);
  onSnapshot(tRef, snap => {
    const t = snap.data(); document.getElementById('manage-details').innerHTML = `<div class="text-sm font-semibold">${t.title}</div><div class="text-xs text-gray-400">Status: ${t.status}</div>`;
  });
  const pQuery = query(collection(db,'participants'), where('tournamentId','==',tournamentId));
  onSnapshot(pQuery, snap=>{
    const parts = document.getElementById('manage-participants'); parts.innerHTML = '<h4 class="text-sm">Participants</h4>';
    const select = document.createElement('select'); select.className='w-full p-2 rounded bg-gray-900 mt-2';
    snap.forEach(s=>{ const d=s.data(); const opt = document.createElement('option'); opt.value=s.id; opt.textContent=d.username; select.appendChild(opt); });
    parts.appendChild(select);
    // attach winner logic
    document.getElementById('declare-winner-btn').onclick = async ()=>{
      const selected = select.value; if (!selected) return UI.toast('Select a participant');
      const pDoc = await (await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js')).getDoc(doc(db,'participants',selected));
      const p = pDoc.data();
      const tDoc = await (await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js')).getDoc(tRef);
      const tdata = tDoc.data();
      // credit winner
      const winnerRef = doc(db,'users',p.userId);
      const winnerSnap = await (await import('https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js')).getDoc(winnerRef);
      await updateDoc(winnerRef, { walletBalance: (winnerSnap.data().walletBalance||0) + Number(tdata.prizePool||0) });
      // transaction
      await addDoc(collection(db,'transactions'), { userId: p.userId, amount: Number(tdata.prizePool||0), type: 'credit', description: `Prize: ${tdata.title}`, createdAt: serverTimestamp() });
      // set tournament completed
      await updateDoc(tRef, { status: 'Completed' });
      // update participant status
      await updateDoc(doc(db,'participants',selected), { status: 'Winner' });
      UI.toast('Winner declared and prize distributed');
    };
    // update room
    document.getElementById('update-room-btn').onclick = async ()=>{
      const rid = prompt('Room ID'); const pwd = prompt('Room Password');
      if (rid!==null) await updateDoc(tRef, { roomId: rid, roomPassword: pwd}); UI.toast('Room updated');
    };
  });
}

// Admin stats (simple aggregates)
onSnapshot(collection(db,'users'), snap=>{ document.getElementById('admin-stats').innerHTML = `<div class="bg-gray-800 p-3 rounded">Users<br><div class="text-lg font-bold">${snap.size}</div></div>`; });

onSnapshot(collection(db,'tournaments'), snap=>{ const total = snap.size; document.getElementById('admin-stats').innerHTML += `<div class="bg-gray-800 p-3 rounded">Tournaments<br><div class="text-lg font-bold">${total}</div></div>`; });

// note: more advanced aggregation (sum) would require Cloud Functions or ANS; this is a simplified demo
