// src/lib/api.js
// Connexio amb el backend de Centims

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================
// HELPER: fetch amb auth
// ============================================
const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('centims_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error del servidor');
  }

  return data;
};

// ============================================
// AUTH
// ============================================
export const authAPI = {
  register: async (email, name, password, username) => {
    const data = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, ...(username ? { username } : {}) }),
    });
    if (data.token) {
      localStorage.setItem('centims_token', data.token);
      localStorage.setItem('centims_user', JSON.stringify(data.user));
    }
    return data;
  },

  login: async (email, password) => {
    const data = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('centims_token', data.token);
      localStorage.setItem('centims_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('centims_token');
    localStorage.removeItem('centims_user');
  },

  getMe: async () => {
    return authFetch('/auth/me');
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('centims_user');
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('centims_token');
  },
};

// ============================================
// PRODUCTES
// ============================================
export const productsAPI = {
  getAll: async () => {
    return authFetch('/products');
  },

  getById: async (id) => {
    return authFetch(`/products/${id}`);
  },
};

// ============================================
// TRANSACCIONS
// ============================================
export const transactionsAPI = {
  buy: async (productId, amountEUR) => {
    return authFetch('/transactions/buy', {
      method: 'POST',
      body: JSON.stringify({ productId, amountEUR }),
    });
  },

  sell: async (productId, fractions) => {
    return authFetch('/transactions/sell', {
      method: 'POST',
      body: JSON.stringify({ productId, fractions }),
    });
  },

  getHistory: async (page = 1, limit = 20) => {
    return authFetch(`/transactions?page=${page}&limit=${limit}`);
  },
};

// ============================================
// PORTFOLIO
// ============================================
export const portfolioAPI = {
  get: async () => {
    return authFetch('/portfolio');
  },

  getBalance: async () => {
    return authFetch('/portfolio/balance');
  },
};

// ============================================
// ADMIN
// ============================================
export const adminAPI = {
  getDashboard: async () => {
    return authFetch('/admin/dashboard');
  },

  consolidate: async (productId) => {
    return authFetch(`/admin/consolidate/${productId}`, {
      method: 'POST',
    });
  },

  getUsers: async (page = 1) => {
    return authFetch(`/admin/users?page=${page}`);
  },

  addBalance: async (userId, amount) => {
    return authFetch(`/admin/users/${userId}/balance`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
  },

  banUser: async (userId, isBanned) => {
    return authFetch(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ isBanned }),
    });
  },

  getTransactions: async (page = 1) => {
    return authFetch(`/admin/transactions?page=${page}`);
  },
  // Propostes
  getProposals: async () => {
    return authFetch('/admin/proposals');
  },

  acceptProposal: async (id, p0, k) => {
    return authFetch(`/admin/proposals/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ p0, k }),
    });
  },

  rejectProposal: async (id, reason = null) => {
    return authFetch(`/admin/proposals/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  deleteProduct: async (productId) => {
    return authFetch(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
  },

  setSeasonalBoost: async (id, multiplier, notes) => {
    return authFetch(`/admin/products/${id}/seasonal-boost`, {
      method: 'PUT',
      body: JSON.stringify({ multiplier, notes }),
    });
  },

  setBoost: async (id, data) => {
    return authFetch(`/admin/products/${id}/boost`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// PROPOSTES DE TOKENS
// ============================================
export const proposalsAPI = {
  create: async (data) => {
    return authFetch('/proposals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMine: async () => {
    return authFetch('/proposals');
  }
};

// ============================================
// RANKINGS
// ============================================
export const rankingsAPI = {
  getCurrent: async () => {
    return authFetch('/rankings/current');
  },

  getForMonth: async (month) => {
    return authFetch(`/rankings/${month}`);
  },

  getAvailableMonths: async () => {
    return authFetch('/rankings/months/available');
  },
};

// ============================================
// ASSOLIMENTS
// ============================================
export const achievementsAPI = {
  getForMonth: async (month) => {
    return authFetch(`/achievements/${month}`);
  },
};

// ============================================
// PREMIS MENSUALS
// ============================================
export const prizesAPI = {
  getForMonth: async (month) => {
    return authFetch(`/prizes/${month}`);
  },

  setForMonth: async (month, prizes) => {
    return authFetch(`/prizes/${month}`, {
      method: 'POST',
      body: JSON.stringify({ prizes }),
    });
  },

  update: async (month, pos, data) => {
    return authFetch(`/prizes/${month}/${pos}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// USUARIS
// ============================================
export const usersAPI = {
  changeUsername: async (username) => {
    return authFetch('/users/me/username', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
  },

  getStats: async () => {
    return authFetch('/users/me/stats');
  },
};

// ============================================
// EMAILS (ADMIN)
// ============================================
export const emailsAPI = {
  sendWinners: async (month) => {
    return authFetch('/emails/send-winners', {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  },

  sendWeekly: async () => {
    return authFetch('/emails/send-weekly', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  sendCustom: async (recipients, subject, body) => {
    return authFetch('/emails/send-custom', {
      method: 'POST',
      body: JSON.stringify({ recipients, subject, body }),
    });
  },

  getHistory: async (page = 1) => {
    return authFetch(`/emails/history?page=${page}`);
  },
};