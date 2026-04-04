// Shared utilities and API helpers

export const API_BASE_URL = import.meta.env.DEV ? `http://${window.location.hostname}:5000` : '';

export const validatePhone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.slice(0, 10);
};

export const isValidPhone = (phone) => /^\d{10}$/.test(phone);

export const getShopUsername = () => localStorage.getItem('shop_username') || 'admin';

export const shopFetch = (url, options = {}) => {
  const headers = {
    ...options.headers,
    'X-Shop-Username': getShopUsername(),
  };
  return fetch(url, { ...options, headers });
};
