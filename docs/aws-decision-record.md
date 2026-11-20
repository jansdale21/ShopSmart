# Decision Record – ShopSmart AWS Architecture

**Date:** November 20, 2026
**Author:** Jansdale S. Yusi (individual submission)
**Status:** Accepted and deployed – https://13-250-195-24.sslip.io

## Context

ShopSmart (React + Vite frontend, Express API, PostgreSQL through Prisma 6, optional Gemini assistant) had to run on AWS for a short classroom demo with fictional data only. Requirements from the activity guide: an HTTPS API (sign-in must not send passwords over HTTP), a private database, an API that survives restarts, committed migrations, server-only secrets, and cost kept inside a new AWS **Free plan** account (US$100 credits + US$20 earned from creating a budget; the plan ends after 6 months or when credits run out).

## Options considered

| Option | For | Against |
|---|---|---|
| **A. Single EC2 host** (Caddy + Express + PostgreSQL on one instance) | Fewest AWS services; frontend and API on **one HTTPS origin**, so no CORS, mixed-content or cross-site cookie problems; lowest credit use; quickest to finish in one day | Single point of failure; I maintain the OS, process, database, backups, HTTPS and cleanup |
| B. Amplify + EC2 + RDS | Each responsibility separated; managed database backups | More connections to configure (API needs its own HTTPS endpoint, CORS with credentials, cross-site cookies, private RDS + security-group rules); more services drawing credits |
| C. Local release only | No cloud cost | Not hosted; the guide allows it only when hosting or safe HTTPS is not available, and both were available |

## Decision

**Option A – a single EC2 host in ap-southeast-1 (Singapore)**, the Region closest to the Philippines.

- **EC2** `shopsmart-web`, t3.small (2 GB RAM plus 2 GB swap so `npm ci` and the Vite build do not run out of memory), Ubuntu 24.04 LTS, 20 GiB gp3 disk.
- **Elastic IP** 13.250.195.24, so the address does not change when the instance stops and starts. The hostname `13-250-195-24.sslip.io` is a free wildcard DNS name that points to that IP, which makes a real HTTPS certificate possible without buying a domain.
- **Caddy** is the only public entry point. It gets and renews a Let's Encrypt certificate automatically, redirects HTTP to HTTPS, serves the React build, rewrites unknown paths to `index.html` (SPA routing) and forwards only `/api/*` to Express.
- **Express** runs as the systemd service `shopsmart-api` (`Restart=always`, enabled at boot). Its port 3000 is **not** opened in the security group.
- **PostgreSQL 16** listens on `127.0.0.1:5432` only and port 5432 is not opened, so the browser can never reach the database.
- **Security group** `shopsmart-web-sg`: 443 and 80 from anywhere (80 only redirects), 22 from my own IP only.
- **Secrets** (`DATABASE_URL` with a random 48-character password, `GEMINI_API_KEY`) live only in `backend/.env` on the server, readable only by the `ubuntu` user (`chmod 600`). The frontend gets only the public setting `VITE_API_URL=/api` at build time.
- **AI provider:** live Google Gemini, called only by the server with a 10-second timeout. Gemini returns product IDs; the API keeps only IDs it selected itself and shows catalog wording, so unverified AI text is never displayed. Any failure falls back to rule-based catalog answers with a notice.

## Consequences

- **Good:** one HTTPS origin made sign-in cookies (`HttpOnly`, `Secure`, `SameSite=Lax`) work without CORS credentials; only one machine to monitor and remove; low credit use.
- **Accepted risks:** one machine is a single point of failure, which is acceptable for a short fictional-data demo. The database has no automatic backups – I take responsibility for it, and nothing needs to be kept after grading because all data is fictional (a `pg_dump` can be taken before removal if needed). Terminating the instance deletes its disk and database.
- **Before a real production release:** move the database to private RDS with automated backups, put the API behind a load balancer or a second instance, use a real domain, add AWS-managed SSH access (Session Manager) instead of a key, and add monitoring and alarms.
