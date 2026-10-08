import { describe, expect, it } from 'vitest';
import {
addProductToCart, calculateCartItemCount,
calculateCartTotal, updateCartQuantity
} from './cart.js'

describe('cart utilities', () => {
  it('calculates the cart total', () => {
    expect(calculateCartTotal([
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 }
    ])).toBe(350);
  });

  it('adds a new product', () => {
    const result = addProductToCart([], { id: 1, name: 'Mouse', price: 500, stock: 2 });
    expect(result.error).toBe('');
    expect(result.cart[0].quantity).toBe(1);
  });

  it('prevents a quantity above stock', () => {
    const cart = [{ productId: 1, name: 'Mouse', price: 500, stock: 1, quantity: 1 }];
    expect(updateCartQuantity(cart, 1, 2).error).toContain('Only 1');
  });

  it('counts all cart units and handles an empty cart', () => {
    expect(calculateCartItemCount([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
    expect(calculateCartItemCount([])).toBe(0);
  });

  it('increases only the chosen item by one', () => {
    const cart = [
      { productId: 1, quantity: 1, stock: 3 },
      { productId: 2, quantity: 2, stock: 3 }
    ];
    const result = updateCartQuantity(cart, 1, 2);
    expect(result.cart.map((item) => item.quantity)).toEqual([2, 2]);
  });

  it('decreases an item by one', () => {
    const cart = [{ productId: 1, quantity: 2, stock: 3 }];
    expect(updateCartQuantity(cart, 1, 1).cart[0].quantity).toBe(1);
  });

  it('does not allow quantity below one', () => {
    const cart = [{ productId: 1, quantity: 1, stock: 3 }];
    expect(updateCartQuantity(cart, 1, 0).error).toContain('greater than zero');
  });

  it('allows the stock limit but not one beyond it', () => {
    const cart = [{ productId: 1, quantity: 1, stock: 2 }];
    expect(updateCartQuantity(cart, 1, 2).error).toBe('');
    expect(updateCartQuantity(cart, 1, 3).error).toContain('Only 2');
  });
});
