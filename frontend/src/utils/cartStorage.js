// DEF-02: keep the cart in the browser's localStorage so a page refresh does not empty it.
// Only product information is stored (id, name, price, stock, quantity) - never customer details.
export const CART_STORAGE_KEY = 'shopsmart-cart';

function getDefaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isValidCartItem(item) {
  return Boolean(item) &&
    Number.isInteger(item.productId) && item.productId > 0 &&
    typeof item.name === 'string' &&
    Number.isFinite(item.price) && item.price >= 0 &&
    Number.isInteger(item.stock) && item.stock >= 0 &&
    Number.isInteger(item.quantity) && item.quantity >= 1;
}

export function loadCart(storage = getDefaultStorage()) {
  try {
    const saved = storage?.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // Ignore damaged or edited data instead of crashing the app.
    return Array.isArray(parsed) ? parsed.filter(isValidCartItem) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart, storage = getDefaultStorage()) {
  try {
    if (!storage) return;
    if (cart.length === 0) {
      storage.removeItem(CART_STORAGE_KEY);
    } else {
      storage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  } catch {
    // Storage can be full or blocked (e.g. private mode). The cart still works in memory.
  }
}
