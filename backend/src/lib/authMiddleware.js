import { SESSION_COOKIE, hashToken, parseCookies } from './auth.js';

// Builds the "must be signed in" middleware. The session lookup is passed in,
// so tests can use a fake lookup without a database.
export function createRequireCustomer(findSessionByTokenHash) {
  return async function requireCustomer(request, response, next) {
    try {
      const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
      if (!token) return sendAuthRequired(response);

      const session = await findSessionByTokenHash(hashToken(token));
      if (!session || new Date(session.expiresAt) <= new Date()) return sendAuthRequired(response);

      request.customer = session.customer;
      request.sessionId = session.id;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function sendAuthRequired(response) {
  return response.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Please sign in to continue.' } });
}
