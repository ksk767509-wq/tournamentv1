import { db } from './firebase-config.js';
import { doc, getDoc, onSnapshot, collection, query, where } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import { auth } from './firebase-config.js';

// Simple toast
export function toast(msg, timeout=3000){
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'mb-2 px-3 py-2 rounded-lg bg-gray-800 shadow';
  el.innerText = msg;
  root.appendChild(el);
  setTimeout(()=> el.remove(), timeout);
}

export function updateHeader(uid){
  const walletEl = document.getElementById('wallet-balance');
  if (!uid){ walletEl.innerText = '₹0'; return; }
  const userRef = doc(db, 'users', uid);
  onSnapshot(userRef, snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    walletEl.innerText = `₹${data.walletBalance || 0}`;
    const walletDisplay = document.getElementById('wallet-display');
    if (walletDisplay) walletDisplay.innerText = `₹${data.walletBalance || 0}`;
  });
}

// Render a tournament card
export function renderTournamentCard(t){
  const card = document.createElement('div');
  card.className = 'bg-gray-800 rounded-xl p-3';
  card.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <div class="text-sm font-semibold">${t.title}</div>
        <div class="text-xs text-gray-400">${t.gameName} • ${t.matchTime || ''}</div>
      </div>
      <div class="text-right">
        <div class="text-sm">Prize ₹${t.prizePool}</div>
        <div class="text-xs text-gray-400">Entry ₹${t.entryFee}</div>
      </div>
    </div>
    <div class="mt-3 flex gap-2">
      <button class="join-btn flex-1 py-2 rounded-lg bg-indigo-600">Join Now</button>
      <button class="details-btn py-2 px-3 rounded-lg bg-gray-700">Details</button>
    </div>
  `;
  // attach handlers
  card.querySelector('.join-btn').addEventListener('click', ()=>{
    import('./user-data.js').then(m => m.joinTournament(t.id));
  });
  card.querySelector('.details-btn').addEventListener('click', ()=>{
    toast(`${t.title} — ${t.gameName}`);
  });
  return card;
}

// simple helper to clear children
export function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }

export { toast };
