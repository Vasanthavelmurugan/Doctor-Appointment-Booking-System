const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getProfile: () => request('/auth/profile', { method: 'GET' }),
    getDemoAccounts: () => request('/auth/demo-accounts', { method: 'GET' })
  },

  // Doctors
  doctors: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/doctors${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/doctors/${id}`),
    getSlots: (id) => request(`/doctors/${id}/slots`),
    setSlots: (id, slots) => request(`/doctors/${id}/slots`, { method: 'POST', body: JSON.stringify({ slots }) }),
    updateProfile: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Patients
  patients: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/patients${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/patients/${id}`),
    updateProfile: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Appointments
  appointments: {
    getSlots: (doctorId, date) => request(`/appointments/slots?doctor_id=${doctorId}&date=${date}`),
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/appointments${qs ? `?${qs}` : ''}`);
    },
    book: (bookingData) => request('/appointments/book', { method: 'POST', body: JSON.stringify(bookingData) }),
    cancel: (id, reason) => request(`/appointments/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ cancellation_reason: reason }) }),
    updateStatus: (id, statusData) => request(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) })
  },

  // Notifications & Reminders
  notifications: {
    getMy: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    checkReminders: () => request('/notifications/check-reminders', { method: 'POST' })
  },

  // Admin
  admin: {
    getStats: () => request('/admin/stats'),
    createDoctor: (doctorData) => request('/admin/doctors', { method: 'POST', body: JSON.stringify(doctorData) }),
    deleteDoctor: (id) => request(`/admin/doctors/${id}`, { method: 'DELETE' })
  }
};
