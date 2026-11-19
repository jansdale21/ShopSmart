import { prisma } from './prisma.js';
import { createRequireCustomer } from './authMiddleware.js';

// The real middleware used by the routes: it looks the session up in PostgreSQL.
export const requireCustomer = createRequireCustomer((tokenHash) =>
  prisma.session.findUnique({ where: { tokenHash }, include: { customer: true } })
);
