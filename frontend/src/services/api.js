const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// DEF-04: stop waiting after this many milliseconds so a slow or frozen server
// can never leave a page stuck on "Loading…".
export const REQUEST_TIMEOUT_MS = 15000;

export const NETWORK_ERROR_MESSAGE =
  'We could not reach the ShopSmart server. Please check your connection and try again.';
export const TIMEOUT_ERROR_MESSAGE =
  'The ShopSmart server took too long to respond. Please try again.';

function createApiError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  if (status !== undefined) error.status = status;
  return error;
}

export async function request(path, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
  } catch (caught) {
    // DEF-04: fetch() rejects with a raw browser error such as "Failed to fetch"
    // when the server cannot be reached. Replace it with a customer-friendly message.
    if (caught?.name === 'AbortError') {
      throw createApiError(TIMEOUT_ERROR_MESSAGE, 'TIMEOUT');
    }
    throw createApiError(NETWORK_ERROR_MESSAGE, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || `Request failed with status ${response.status}.`;
    throw createApiError(message, data?.error?.code, response.status);
  }
  return data;
}

export const api = {
  getProducts: (query = '') => request(`/products${query ? `?search=${encodeURIComponent(query)}` : ''}`),
  getProduct: (id) => request(`/products/${id}`),
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  askAssistant: (question) => request('/assistant/questions', {
    method: 'POST', body: JSON.stringify({ question })
  })
};
