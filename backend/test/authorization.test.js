import test from 'node:test';
import assert from 'node:assert/strict';
import { hashToken } from '../src/lib/auth.js';
import { createRequireCustomer } from '../src/lib/authMiddleware.js';
import { canViewOrder } from '../src/lib/orderAccess.js';

// A fake session store, so no database is needed.
const ana = { id: 1, name: 'Ana Reyes', email: 'ana@example.com' };
const sessions = new Map([
  [hashToken('valid-token'), { id: 10, customer: ana, expiresAt: new Date(Date.now() + 60_000) }],
  [hashToken('old-token'), { id: 11, customer: ana, expiresAt: new Date(Date.now() - 60_000) }]
]);
const requireCustomer = createRequireCustomer(async (tokenHash) => sessions.get(tokenHash) || null);

function fakeResponse() {
  return {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

async function run(cookie) {
  const request = { headers: cookie ? { cookie } : {} };
  const response = fakeResponse();
  let nextCalled = false;
  await requireCustomer(request, response, () => { nextCalled = true; });
  return { request, response, nextCalled };
}

test('a guest with no session cookie is refused with 401', async () => {
  const { response, nextCalled } = await run();
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, 'AUTH_REQUIRED');
  assert.equal(nextCalled, false);
});

test('an unknown session token is refused with 401', async () => {
  const { response, nextCalled } = await run('shopsmart_session=made-up');
  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('an expired session is refused with 401', async () => {
  const { response, nextCalled } = await run('shopsmart_session=old-token');
  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('a valid session continues and identifies the customer', async () => {
  const { request, nextCalled } = await run('shopsmart_session=valid-token');
  assert.equal(nextCalled, true);
  assert.equal(request.customer.id, 1);
});

test('only the owner can view an order', () => {
  assert.equal(canViewOrder({ id: 5, customerId: 1 }, 1), true);
  assert.equal(canViewOrder({ id: 5, customerId: 1 }, 2), false);
});

test('an order with no owner is visible to no customer', () => {
  assert.equal(canViewOrder({ id: 3, customerId: null }, 1), false);
  assert.equal(canViewOrder(null, 1), false);
});
