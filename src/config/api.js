// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://freeinvoice-backend.onrender.com';

export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};
