import { describe, expect, it } from 'vitest';
import { CART_STORAGE_KEY, loadCart, saveCart } from './cartStorage.js';

function createFakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; }
  };
}

const mouse = { productId: 7, name: 'Wireless Mouse', price: 650, stock: 12, quantity: 3 };

// DEF-02 regression tests: the cart must survive a page refresh.
describe('cart storage', () => {
  it('restores a saved cart, as after a page refresh', () => {
    const storage = createFakeStorage();
    saveCart([mouse], storage);
    expect(loadCart(storage)).toEqual([mouse]);
  });

  it('returns an empty cart when nothing was saved', () => {
    expect(loadCart(createFakeStorage())).toEqual([]);
  });

  it('removes the saved cart when the cart becomes empty, as after checkout', () => {
    const storage = createFakeStorage();
    saveCart([mouse], storage);
    saveCart([], storage);
    expect(storage.data[CART_STORAGE_KEY]).toBeUndefined();
  });

  it('ignores damaged or invalid saved data instead of crashing', () => {
    expect(loadCart(createFakeStorage({ [CART_STORAGE_KEY]: 'not json' }))).toEqual([]);
    expect(loadCart(createFakeStorage({
      [CART_STORAGE_KEY]: JSON.stringify([mouse, { productId: 'x', quantity: -1 }])
    }))).toEqual([mouse]);
  });

  it('keeps working when storage is unavailable', () => {
    expect(loadCart(null)).toEqual([]);
    expect(() => saveCart([mouse], null)).not.toThrow();
  });
});
