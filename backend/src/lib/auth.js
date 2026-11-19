import crypto from 'node:crypto';
import { promisify } from 'node:util';

// Customer sign-in helpers. Only Node's built-in crypto module is used, so no new package is needed.
const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export const SESSION_COOKIE = 'shopsmart_session';
export const SESSION_DAYS = 7;

// A hash of a random throwaway password. Login checks against it when the email is unknown,
// so a wrong email and a wrong password take about the same time to answer.
export const DUMMY_PASSWORD_HASH = 'scrypt$Gydwb_OvC9cgZFWk0wfuQA$HrA2WW8XhAr7HVAqk_gyWr_3imo-ErOQjcqtGOJXfY8FLKKYb9wuIOy4mh_u3mUAOtw2H8lLhpjaqqXvUH7wvw';

// Passwords are never stored. Each one gets a random salt and is stored as "scrypt$salt$hash".
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, storedHash) {
  const [scheme, salt, expected] = String(storedHash || '').split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const key = await scrypt(password, salt, KEY_LENGTH);
  const expectedBuffer = Buffer.from(expected, 'base64url');
  return expectedBuffer.length === key.length && crypto.timingSafeEqual(expectedBuffer, key);
}

// The browser keeps the random token in an httpOnly cookie. The database keeps only its SHA-256 hash,
// so a leaked database copy cannot be used to sign in.
export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function parseCookies(header = '') {
  const cookies = {};
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

// httpOnly: page JavaScript cannot read the cookie. sameSite=lax: other sites cannot send it with a POST.
// secure: in production the cookie only travels over HTTPS.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  };
}

export function sessionExpiry(now = new Date()) {
  return new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function publicCustomer(customer) {
  return { id: customer.id, name: customer.name, email: customer.email };
}
