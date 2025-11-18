import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/api'

// Check if token is expired or will expire soon
export const isTokenExpiringSoon = (token, hoursBeforeExpiry = 24) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Current time in seconds
    const expiryTime = decoded.exp;
    const timeUntilExpiry = expiryTime - currentTime;
    const hoursUntilExpiry = timeUntilExpiry / 3600; // Convert to hours

    // Return true if token expires in less than specified hours
    return hoursUntilExpiry < hoursBeforeExpiry;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat invalid tokens as expired
  }
};

// Check if token is completely expired
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Refresh token from backend
export const refreshAuthToken = async () => {
  try {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken || isTokenExpired(currentToken)) {
      return null;
    }

    const response = await fetch('${API_BASE_URL}/api/refresh-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const newToken = data.token;
      
      // Update token in localStorage
      localStorage.setItem('token', newToken);
      
      return newToken;
    } else {
      console.error('Failed to refresh token');
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Auto-refresh token if needed
export const ensureValidToken = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    window.location.href = '/';
    return null;
  }

  if (isTokenExpiringSoon(token, 24)) {
    const newToken = await refreshAuthToken();
    return newToken || token;
  }

  return token;
};
