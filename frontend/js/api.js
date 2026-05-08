// ===== LAAZIRI TRAVEL - API CLIENT =====
const API = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('lt_token'); }
function getUser() { const u = localStorage.getItem('lt_user'); return u ? JSON.parse(u) : null; }
function setAuth(token, user) {
  localStorage.setItem('lt_token', token);
  localStorage.setItem('lt_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('lt_token');
  localStorage.removeItem('lt_user');
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// Auth helpers
function requireAuth(role) {
  const user = getUser();
  if (!user) { window.location.href = '/pages/login.html'; return false; }
  if (role && user.role !== role) { window.location.href = '/'; return false; }
  return true;
}
function redirectIfAuth() {
  const user = getUser();
  if (!user) return;
  if (user.role === 'agence') window.location.href = '/pages/admin.html';
  else if (user.role === 'chauffeur') window.location.href = '/pages/chauffeur.html';
  else window.location.href = '/pages/dashboard.html';
}

// Navbar state
function updateNavbar() {
  const user = getUser();
  const guestNav = document.getElementById('nav-guest');
  const authNav = document.getElementById('nav-auth');
  const userNameEl = document.getElementById('nav-username');
  if (!guestNav && !authNav) return;
  if (user) {
    if (guestNav) guestNav.classList.add('hidden');
    if (authNav) authNav.classList.remove('hidden');
    if (userNameEl) userNameEl.textContent = user.prenom;
  } else {
    if (guestNav) guestNav.classList.remove('hidden');
    if (authNav) authNav.classList.add('hidden');
  }
}

// Status badges
const STATUT_MAP = {
  en_attente: { label: 'En attente', cls: 'badge-warning' },
  confirmee:  { label: 'Confirmée',  cls: 'badge-success' },
  en_cours:   { label: 'En cours',   cls: 'badge-primary' },
  terminee:   { label: 'Terminée',   cls: 'badge-muted'   },
  annulee:    { label: 'Annulée',    cls: 'badge-danger'  },
};
const SERVICE_MAP = {
  transfert: '✈️ Transfert', excursion: '🏔️ Excursion',
  circuit: '🗺️ Circuit', agafay: '🏜️ Agafay',
  ville: '🏙️ City Tour', golf: '⛳ Golf',
  hammam: '♨️ Hammam/SPA', restaurant: '🍽️ Restaurant',
};
function badgeHTML(statut) {
  const s = STATUT_MAP[statut] || { label: statut, cls: 'badge-muted' };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}
function serviceIcon(type) { return SERVICE_MAP[type] || type; }
function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatPrice(p) { return p ? `${Number(p).toLocaleString('fr-FR')} MAD` : '-'; }

// Show/hide modal
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
  if (e.target.classList.contains('modal-close')) e.target.closest('.modal-overlay')?.classList.remove('open');
});

// Toast notification
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `alert alert-${type} fade-in`;
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;min-width:280px;text-align:center;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', updateNavbar);
