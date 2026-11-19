import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

// Only allow redirects inside this site (for example "/checkout"), never to another website.
function safeNextPath(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '';
}

function formatPeso(amount) {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function SignInForms() {
  const { login, register } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nextPath = safeNextPath(searchParams.get('next'));

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
      if (nextPath) navigate(nextPath);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setError('');
  }

  return (
    <section className="account-layout">
      <form onSubmit={submit}>
        <p className="eyebrow">{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</p>
        <h1>{mode === 'login' ? 'Sign in to ShopSmart' : 'Create a test account'}</h1>
        <StatusMessage>Classroom demo: use a fictional name, an @example.com email and a password you do not use anywhere else.</StatusMessage>
        {nextPath && <StatusMessage>Please sign in to continue to checkout.</StatusMessage>}
        <StatusMessage type="error">{error}</StatusMessage>
        {mode === 'register' && (
          <label>Full name<input name="name" value={form.name} onChange={updateField} minLength="2" maxLength="80" required /></label>
        )}
        <label>Email address<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={updateField} minLength={mode === 'register' ? 8 : 1} maxLength="72" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
        <button disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="link-button" onClick={switchMode}>
          {mode === 'login' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
        </button>
      </form>
      <aside className="summary">
        <h2>Why sign in?</h2>
        <p>Your simulated orders are saved to your account. Only you can see them, and the server checks this on every request.</p>
      </aside>
    </section>
  );
}

function MyAccount() {
  const { customer, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getMyOrders()
      .then((data) => { if (active) setOrders(data.orders); })
      .catch((caught) => { if (active) setError(caught.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [customer.id]);

  return (
    <section className="account-layout">
      <div className="summary">
        <p className="eyebrow">MY ACCOUNT</p>
        <h1>{customer.name}</h1>
        <p>{customer.email}</p>
        <button type="button" className="button secondary" onClick={logout}>Sign out</button>
      </div>
      <div>
        <h2>My orders</h2>
        <StatusMessage type="error">{error}</StatusMessage>
        {loading && <p>Loading your orders…</p>}
        {!loading && !error && orders.length === 0 && (
          <p>You have no orders yet. <Link to="/">Browse products</Link></p>
        )}
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header>
                <strong>Order #{order.id}</strong>
                <strong>{formatPeso(order.total)}</strong>
              </header>
              <small>{new Date(order.createdAt).toLocaleString('en-PH')} • {order.status}</small>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>{item.productName} × {item.quantity}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AccountPage() {
  const { customer, checking } = useAuth();
  if (checking) return <section><p>Checking your account…</p></section>;
  return customer ? <MyAccount /> : <SignInForms />;
}
