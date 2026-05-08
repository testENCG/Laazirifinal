/**
 * API service with improved error handling and utilities
 */

const API = '/api'; // Proxied via Vite config

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (window.showToast) {
    window.showToast(message, type, duration);
  }
}

// ===================== AUTH =====================

export function getToken() {
  return localStorage.getItem('lt_token');
}

export function getUser() {
  const u = localStorage.getItem('lt_user');
  return u ? JSON.parse(u) : null;
}

export function setAuth(token, user) {
  localStorage.setItem('lt_token', token);
  localStorage.setItem('lt_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('lt_token');
  localStorage.removeItem('lt_user');
}

// ===================== API FETCH WITH ERROR HANDLING =====================

/**
 * Enhanced fetch with error handling and logging
 * @param {string} path - API endpoint path
 * @param {object} opts - Fetch options
 * @returns {Promise<object>} - Response data
 */
export async function apiFetch(path, opts = {}) {
  try {
    const token = getToken();
    const headers = { 
      'Content-Type': 'application/json', 
      ...(opts.headers || {}) 
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(API + path, { 
      ...opts, 
      headers,
      signal: opts.signal // Support AbortController
    });
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { error: 'Impossible de décoder la réponse serveur' };
    }
    
    // Handle non-OK responses
    if (!res.ok) {
      const errorMessage = data.error || `Erreur ${res.status}: ${res.statusText}`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'AbortError') {
      throw new Error('La requête a été annulée');
    }
    
    if (error instanceof TypeError) {
      throw new Error('Erreur de connexion - veuillez vérifier votre connexion internet');
    }
    
    throw error;
  }
}

/**
 * Wrapper for GET requests with error handling
 */
export async function apiGet(path, opts = {}) {
  try {
    const data = await apiFetch(path, { method: 'GET', ...opts });
    return { success: true, data };
  } catch (error) {
    console.error('API GET Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Wrapper for POST requests with error handling
 */
export async function apiPost(path, payload = {}, opts = {}) {
  try {
    const data = await apiFetch(path, { 
      method: 'POST', 
      body: JSON.stringify(payload),
      ...opts 
    });
    return { success: true, data };
  } catch (error) {
    console.error('API POST Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Wrapper for PUT requests with error handling
 */
export async function apiPut(path, payload = {}, opts = {}) {
  try {
    const data = await apiFetch(path, { 
      method: 'PUT', 
      body: JSON.stringify(payload),
      ...opts 
    });
    return { success: true, data };
  } catch (error) {
    console.error('API PUT Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Wrapper for DELETE requests with error handling
 */
export async function apiDelete(path, opts = {}) {
  try {
    const data = await apiFetch(path, { 
      method: 'DELETE', 
      ...opts 
    });
    return { success: true, data };
  } catch (error) {
    console.error('API DELETE Error:', error);
    return { success: false, error: error.message };
  }
}

// ===================== CONSTANTS & UTILITIES =====================

export const STATUT_MAP = {
  en_attente: { label: 'En attente', cls: 'badge-warning' },
  confirmee:  { label: 'Confirmée',  cls: 'badge-success' },
  en_cours:   { label: 'En cours',   cls: 'badge-primary' },
  terminee:   { label: 'Terminée',   cls: 'badge-muted'   },
  annulee:    { label: 'Annulée',    cls: 'badge-danger'  },
};

export const PAIEMENT_STATUT_MAP = {
  non_paye:  { label: 'Non payé',  cls: 'badge-warning', icon: '⏳' },
  paye:      { label: 'Payé',      cls: 'badge-success', icon: '✅' },
  rembourse: { label: 'Remboursé', cls: 'badge-muted',   icon: '↩️' },
};

export const PAIEMENT_MODE_MAP = {
  non_defini: { label: 'Non défini', icon: '❓' },
  especes:    { label: 'Espèces',    icon: '💵' },
  carte:      { label: 'Carte',      icon: '💳' },
};

export const SERVICE_MAP = {
  transfert: '✈️ Transfert', 
  excursion: '🏔️ Excursion',
  circuit: '🗺️ Circuit', 
  agafay: '🏜️ Agafay',
  ville: '🏙️ City Tour', 
  golf: '⛳ Golf',
  hammam: '♨️ Hammam/SPA', 
  restaurant: '🍽️ Restaurant',
};

export function serviceIcon(type) {
  return SERVICE_MAP[type] || type;
}

export function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (e) {
    return 'Date invalide';
  }
}

export function formatPrice(p) {
  if (p === null || p === undefined || p === '') return '-';
  try {
    return `${Number(p).toLocaleString('fr-FR')} MAD`;
  } catch (e) {
    return 'Prix invalide';
  }
}

// ===================== FORM VALIDATION =====================

export const VALIDATION_RULES = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: {
    minLength: 8,
    hasUpper: /[A-Z]/,
    hasLower: /[a-z]/,
    hasNumber: /\d/,
  },
  phone: /^\+?[1-9]\d{1,14}$/,
};

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email) return 'Email est requis';
  if (!VALIDATION_RULES.email.test(email)) return 'Email invalide';
  return null;
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password) return 'Mot de passe est requis';
  const rules = VALIDATION_RULES.password;
  if (password.length < rules.minLength) {
    return `Au moins ${rules.minLength} caractères requis`;
  }
  if (!rules.hasUpper.test(password)) {
    return 'Une lettre majuscule est requise';
  }
  if (!rules.hasLower.test(password)) {
    return 'Une lettre minuscule est requise';
  }
  if (!rules.hasNumber.test(password)) {
    return 'Un chiffre est requis';
  }
  return null;
}

/**
 * Validate name field
 */
export function validateName(name, fieldName = 'Nom') {
  if (!name) return `${fieldName} est requis`;
  if (name.trim().length < 2) return `${fieldName} trop court`;
  return null;
}

