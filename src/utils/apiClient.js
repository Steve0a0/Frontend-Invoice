import { ensureValidToken } from './tokenManager';

// Wrapper for fetch that automatically handles token refresh
export const fetchWithAuth = async (url, options = {}) => {
  // Ensure token is valid before making request
  const token = await ensureValidToken();

  if (!token) {
    // No valid token, redirect to login
    window.location.href = '/';
    throw new Error('No valid authentication token');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Make the actual fetch request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get 401 Unauthorized, token might be invalid
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  return response;
};

// Helper for common API patterns
export const apiClient = {
  get: (url, options = {}) => fetchWithAuth(url, { ...options, method: 'GET' }),
  
  post: (url, data, options = {}) => fetchWithAuth(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  }),
  
  put: (url, data, options = {}) => fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  }),
  
  patch: (url, data, options = {}) => fetchWithAuth(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  }),
  
  delete: (url, options = {}) => fetchWithAuth(url, { ...options, method: 'DELETE' }),
};

export default apiClient;
