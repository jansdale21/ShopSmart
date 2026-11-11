import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
 addProductToCart,
 calculateCartItemCount,
 calculateCartTotal,
 updateCartQuantity
} from '../utils/cart.js';
import { loadCart, saveCart } from '../utils/cartStorage.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // DEF-02: start from the cart saved in the browser instead of an empty array.
  const [cart, setCart] = useState(() => loadCart());
  const [cartMessage, setCartMessage] = useState('');
  // DEF-01: remember whether the current message is an error or information.
  const [cartMessageType, setCartMessageType] = useState('info');

  // DEF-02: save the cart every time it changes.
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  function addToCart(product) {
    setCart((currentCart) => {
      const result = addProductToCart(currentCart, product);
      setCartMessage(result.error || `${product.name} was added to your cart.`);
      setCartMessageType(result.error ? 'error' : 'info');
      return result.cart;
    });
  }

  function setQuantity(productId, quantity) {
    setCart((currentCart) => {
      const result = updateCartQuantity(currentCart, productId, quantity);
      setCartMessage(result.error);
      setCartMessageType(result.error ? 'error' : 'info');
      return result.cart;
    });
  }

  function removeFromCart(productId) {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
    setCartMessage('Item removed from cart.');
    setCartMessageType('info');
  }

  function clearCart() {
    setCart([]);
    setCartMessage('');
    setCartMessageType('info');
  }

  const value = useMemo(() => ({
    cart,
    cartMessage,
    cartMessageType,
    itemCount: calculateCartItemCount(cart),
    total: calculateCartTotal(cart),
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart
  }), [cart, cartMessage, cartMessageType]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
