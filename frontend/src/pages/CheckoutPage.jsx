import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';
import { calculateItemSubtotal } from '../utils/cart.js';

export default function CheckoutPage() {
  const { customer, checking } = useAuth();
  const { cart } = useCart();

  if (checking) return <section><p>Checking your account…</p></section>;
  // Signed-in customers always get CheckoutForm. It decides between the success card and the
  // empty-cart message, because placing an order empties the cart and the success card must still show.
  if (customer) return <CheckoutForm customer={customer} />;
  if (cart.length === 0) return <EmptyCart />;
  // Checkout needs a signed-in customer so the server can save the order under their account.
  return (
    <section>
      <div className="empty-state">
        <p className="eyebrow">SIGN IN REQUIRED</p>
        <h1>Please sign in to check out</h1>
        <p>Your cart is kept. After signing in you will come back here.</p>
        <Link className="button" to="/account?next=/checkout">Sign in or create an account</Link>
      </div>
    </section>
  );
}

function EmptyCart() {
  return <section><div className="empty-state"><h1>Your cart is empty</h1><Link className="button" to="/">Browse products</Link></div></section>;
}

function CheckoutForm({ customer }) {
  const { cart, total, clearCart } = useCart();
  const [form, setForm] = useState({ customerName: customer.name, email: customer.email, address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const created = await api.createOrder({
        ...form,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      });
      setOrder(created);
      clearCart();
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (order) return (
    <section className="success-card">
      <p className="eyebrow">ORDER RECEIVED</p>
      <h1>Thank you, {order.customerName}!</h1>
      <p>Your simulated order number is <strong>#{order.id}</strong>.</p>
      <p>Total: <strong>₱{Number(order.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></p>
      <p><Link className="button" to="/account">View my orders</Link> <Link className="button secondary" to="/">Continue shopping</Link></p>
    </section>
  );

  if (cart.length === 0) return <EmptyCart />;

  return (
    <section className="checkout-layout">
      <form onSubmit={submitOrder}>
        <p className="eyebrow">SIMULATED CHECKOUT</p><h1>Delivery information</h1>
        <StatusMessage>Classroom demo: use fictional names, emails and addresses only. Do not enter real personal information.</StatusMessage>
        <StatusMessage type="error">{error}</StatusMessage>
        <label>Full name<input name="customerName" value={form.customerName} onChange={updateField} minLength="2" maxLength="80" required /></label>
        <label>Email address<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
        <label>Delivery address<textarea name="address" value={form.address} onChange={updateField} minLength="10" maxLength="300" required /></label>
        <button disabled={submitting}>{submitting ? 'Submitting order…' : 'Place simulated order'}</button>
      </form>
      <aside className="summary">
        <h2>Order review</h2>
        <div className="checkout-items">
          {cart.map((item) => (
            <div className="checkout-item" key={item.productId}>
              <div><strong>{item.name}</strong><span>Qty: {item.quantity}</span></div>
              <strong>&#8369;{calculateItemSubtotal(item).toLocaleString('en-PH')}</strong>
            </div>
          ))}
        </div>
        <p className="summary-total"><span>Total</span><strong>&#8369;{total.toLocaleString('en-PH')}</strong></p>
        <small>No actual payment will be collected.</small>
      </aside>
    </section>
  );
}
