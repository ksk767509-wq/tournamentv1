// js/router.js
import { qs, showToast } from './utils.js';

const routes = {
  auth: qs('#auth-section'),
  home: qs('#home-section'),
  my: qs('#my-tournaments-section'),
  wallet: qs('#wallet-section'),
  profile: qs('#profile-section'),
  admin: qs('#admin-dashboard-section'),
  tournament: qs('#tournament-section'),
  manage: qs('#manage-tournament-section')
};

let currentRoute = 'auth';

export function navigateTo(route){
  // hide all
  Object.values(routes).forEach(s => s.classList.add('hidden'));
  // show selected
  if(routes[route]) routes[route].classList.remove('hidden');
  currentRoute = route;
}

// bottom nav handlers
qs('#bottom-nav').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-route]');
  if(!btn) return;
  const route = btn.dataset.route;
  // If user not signed in and route is not auth, show auth
  if(route !== 'home' && route !== 'auth' && route !== 'profile' && route !== 'wallet' && route !== 'my'){
    navigateTo('home');
    return;
  }
  if(route === 'home') navigateTo('home');
  if(route === 'my') navigateTo('my');
  if(route === 'wallet') navigateTo('wallet');
  if(route === 'profile') navigateTo('profile');
});

// Listen to auth changes to auto-route
window.addEventListener('authChanged', (e)=>{
  const user = e.detail.user;
  if(user) {
    navigateTo('home');
  } else {
    navigateTo('auth');
  }
});

// Expose for other modules
export default { navigateTo };
