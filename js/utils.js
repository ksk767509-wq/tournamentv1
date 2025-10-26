// js/utils.js
// Small helpers shared across modules
export function qs(sel, parent=document) { return parent.querySelector(sel); }
export function qsa(sel, parent=document) { return Array.from(parent.querySelectorAll(sel)); }

export function showToast(msg, type='info', timeout=3000) {
  const area = qs('#toast-area');
  const el = document.createElement('div');
  el.className = 'mb-2 px-4 py-2 rounded-lg shadow-lg text-sm bg-slate-800/70 backdrop-blur';
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(()=> el.remove(), timeout);
}

export function formatCurrency(n){
  try { return '₹' + Number(n||0).toLocaleString('en-IN'); } catch(e){ return '₹' + n; }
}

// Tiny helper to toggle tabs
export function toggleTabs(activeId, group) {
  group.forEach(id => qs(id).classList.toggle('hidden', id !== activeId));
}
