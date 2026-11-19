import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireCustomer } from '../lib/session.js';
import {
  DUMMY_PASSWORD_HASH,
  SESSION_COOKIE,
  createSessionToken,
  hashPassword,
  hashToken,
  parseCookies,
  publicCustomer,
  sessionCookieOptions,
  sessionExpiry,
  verifyPassword
} from '../lib/auth.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

// Slows down password guessing: at most 10 register/login attempts per minute per visitor.
const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

async function startSession(response, customerId) {
  const token = createSessionToken();
  const expiresAt = sessionExpiry();
  await prisma.session.create({ data: { tokenHash: hashToken(token), customerId, expiresAt } });
  response.cookie(SESSION_COOKIE, token, { ...sessionCookieOptions(), expires: expiresAt });
}

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(422).json({ error: { code: 'INVALID_REGISTRATION', message: 'Enter a name, a valid email and a password of 8 to 72 characters.', details: parsed.error.flatten() } });
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return response.status(409).json({ error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists. Please sign in.' } });

    const customer = await prisma.customer.create({
      data: { name: parsed.data.name, email, passwordHash: await hashPassword(parsed.data.password) }
    });
    await startSession(response, customer.id);
    return response.status(201).json({ customer: publicCustomer(customer) });
  } catch (error) {
    if (error?.code === 'P2002') return response.status(409).json({ error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists. Please sign in.' } });
    return next(error);
  }
});

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: { code: 'INVALID_LOGIN', message: 'Enter your email and password.' } });

    const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const passwordOk = await verifyPassword(parsed.data.password, customer?.passwordHash || DUMMY_PASSWORD_HASH);
    // Same message for a wrong email and a wrong password, so the API does not reveal which accounts exist.
    if (!customer || !passwordOk) return response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });

    await startSession(response, customer.id);
    return response.json({ customer: publicCustomer(customer) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (request, response, next) => {
  try {
    const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
    if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    response.clearCookie(SESSION_COOKIE, sessionCookieOptions());
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireCustomer, (request, response) => response.json({ customer: publicCustomer(request.customer) }));

export default router;
