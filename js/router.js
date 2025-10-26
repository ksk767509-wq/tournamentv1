// Very small router: shows/hides sections
const routes = {
  auth: document.getElementById('auth-section'),
  home: document.getElementById('home-section'),
  my: document.getElementById('my-tournaments-section'),
  wallet: document.getElementById('wallet-section'),
  profile: document.getElementById('profile-section'),
  admin: document.getElementById('admin-dashboard-section'),
  manage: document.getElementById('manage-tournament-section')
};

export function navigate(route){
  Object.values(routes).forEach(s => s.classList.add('hidden'));
  if (routes[route]) routes[route].classList.remove('hidden');
}

// attach bottom nav events
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.getAttribute('data-route')));
});

// Expose default route -> auth
navigate('auth');
