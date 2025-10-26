// js/ui.js
import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { qs, showToast, formatCurrency } from './utils.js';
import { joinTournament } from './user-data.js';

const tournamentsGrid = qs('#tournaments-grid');

// Real-time listener for upcoming tournaments
export function initTournamentsFeed(){
  const q = query(collection(db, 'tournaments'), where('status','==','Upcoming'), orderBy('matchTime'));
  onSnapshot(q, snap => {
    tournamentsGrid.innerHTML = '';
    snap.forEach(doc => {
      const t = { id: doc.id, ...doc.data() };
      tournamentsGrid.appendChild(cardForTournament(t));
    });
  }, err => console.error(err));
}

function cardForTournament(t){
  const el = document.createElement('div');
  el.className = 'bg-slate-900/40 p-3 rounded-lg';
  el.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <div class="text-sm font-semibold">${t.title}</div>
        <div class="text-xs text-slate-400">${t.gameName} • ${new Date((t.matchTime && t.matchTime.seconds) ? t.matchTime.seconds*1000 : t.matchTime).toLocaleString()}</div>
      </div>
      <div class="text-right">
        <div class="text-xs text-slate-400">Entry</div>
        <div class="font-semibold">₹${t.entryFee}</div>
      </div>
    </div>
    <div class="mt-3 flex items-center justify-between">
      <div class="text-sm text-slate-300">Prize: ${formatCurrency(t.prizePool)}</div>
      <button data-id="${t.id}" class="btn-join py-2 px-3 rounded-lg bg-indigo-600 text-sm">Join Now</button>
    </div>
  `;
  el.querySelector('.btn-join').addEventListener('click', ()=> joinTournament(t.id));
  return el;
}

// init on load
initTournamentsFeed();

console.log('UI module loaded');
