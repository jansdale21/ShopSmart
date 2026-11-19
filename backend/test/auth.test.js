import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, hashPassword, hashToken, parseCookies, verifyPassword } from '../src/lib/auth.js';
import { loginSchema, registerSchema } from '../src/validators/schemas.js';

test('a password is stored as a salted hash and verifies only with the right password', async () => {
  const stored = await hashPassword('demo-pass-123');
  assert.match(stored, /^scrypt\$/);
  assert.ok(!stored.includes('demo-pass-123'));
  assert.equal(await verifyPassword('demo-pass-123', stored), true);
  assert.equal(await verifyPassword('wrong-pass-123', stored), false);
});

test('the same password gets a different hash each time (random salt)', async () => {
  assert.notEqual(await hashPassword('demo-pass-123'), await hashPassword('demo-pass-123'));
});

test('a damaged stored hash never verifies', async () => {
  assert.equal(await verifyPassword('anything', 'not-a-hash'), false);
});

test('session tokens are random and only their hash is stored', () => {
  const token = createSessionToken();
  assert.notEqual(token, createSessionToken());
  assert.equal(hashToken(token).length, 64);
  assert.notEqual(hashToken(token), token);
});

test('cookies are read from the Cookie header', () => {
  assert.deepEqual(parseCookies('a=1; shopsmart_session=abc%20d'), { a: '1', shopsmart_session: 'abc d' });
  assert.deepEqual(parseCookies(undefined), {});
});

test('registration rejects a short password and a bad email', () => {
  assert.equal(registerSchema.safeParse({ name: 'Ana Reyes', email: 'ana@example.com', password: 'short' }).success, false);
  assert.equal(registerSchema.safeParse({ name: 'Ana Reyes', email: 'not-an-email', password: 'demo-pass-123' }).success, false);
  assert.equal(registerSchema.safeParse({ name: 'Ana Reyes', email: 'ana@example.com', password: 'demo-pass-123' }).success, true);
});

test('login requires an email and a password', () => {
  assert.equal(loginSchema.safeParse({ email: 'ana@example.com', password: '' }).success, false);
});
