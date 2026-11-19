import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

// Keeps track of the signed-in customer. The session itself lives in an httpOnly cookie
// that page JavaScript cannot read, so the app asks the API "who am I?" when it loads.
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api.getCurrentCustomer()
      .then((data) => { if (active) setCustomer(data.customer); })
      .catch(() => { if (active) setCustomer(null); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function login(details) {
    const data = await api.login(details);
    setCustomer(data.customer);
    return data.customer;
  }

  async function register(details) {
    const data = await api.register(details);
    setCustomer(data.customer);
    return data.customer;
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setCustomer(null);
    }
  }

  const value = { customer, checking, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
