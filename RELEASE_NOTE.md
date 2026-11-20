# ShopSmart Release Note

## Version and date

- **Release:** commit `47ba3cc` on `main` (github.com/jansdale21/ShopSmart), deployed November 20, 2026
- **Previous release:** commit `6ef54b5` (local release candidate, November 12, 2026)
- After `47ba3cc` only documentation (`docs/`, this file) changed. No application code changed.

## Deployment status

**Hosted on AWS (online release).**

| Item | Value |
|---|---|
| Site URL | https://13-250-195-24.sslip.io |
| API | https://13-250-195-24.sslip.io/api (same HTTPS origin; health: `/api/health`) |
| AWS account plan | Free plan – US$120.00 credits (US$100 sign-up + US$20 budget bonus), US$0.00 used on Nov 20, 2026; the plan ends after 6 months (about May 21, 2027) or when credits run out |
| Region | ap-southeast-1 (Asia Pacific – Singapore), AZ ap-southeast-1c |
| AWS services | Amazon EC2 (t3.small instance `shopsmart-web`, 20 GiB gp3 EBS volume, Elastic IP 13.250.195.24, security group `shopsmart-web-sg`, key pair `shopsmart-key`), AWS Budgets |
| Architecture | Single EC2 host: Caddy (HTTPS, React build, `/api` proxy) → Express API (systemd) → PostgreSQL 16 (localhost only). See [docs/aws-decision-record.md](docs/aws-decision-record.md) |
| Tested URLs | `/`, `/cart` (direct refresh), `/checkout`, `/account`, `/assistant`, `/api/health`, `/api/products`, `/api/orders/1`, `/api/assistant/questions`, `http://13-250-195-24.sslip.io` (→ 308 to HTTPS) |
| Hosted checks | 8 of 8 passed on November 20, 2026 – details in [docs/activity-6-aws-deployment.md](docs/activity-6-aws-deployment.md) |
| Demo period / removal | Until the grade is released (latest December 15, 2026), then removed using [docs/aws-resource-register.md](docs/aws-resource-register.md) |

## What is new in this release

- **Customer sign-in:** create account, sign in, sign out, "My orders". Passwords are stored as salted hashes; sessions use an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- **Order ownership enforced by the API:** checkout requires sign-in and saves the order under the signed-in customer. `GET /api/orders/:id` → guest **401**, owner **200**, other customer **403**.
- **Committed migration** `20261120021500_customer_accounts` (Customer, Session, optional order owner). Old orders keep no owner and are visible to no one.
- **Deployment on AWS** with HTTPS, a private database, an API that restarts after crashes and reboots, and server-only secrets.
- **Fix:** the order success message no longer disappears when the cart is cleared after checkout.

## Improvements and retests

The exam instructions for "two improvements and retests" were not provided to me. The improvement completed in this release is customer sign-in with server-side order ownership, retested:

| Retest | Local result | Hosted result |
|---|---|---|
| Guest checkout is blocked, cart kept | Pass (`06`) | Pass (`24`) |
| Signed-in customer places an order | Pass – order #13 (`07`, `08`) | Pass – order #1, ₱3,150.00 (`25`, `26`) |
| Owner reads the order by direct API request | 200 (`09`) | 200 (`27`) |
| Guest reads the order | 401 `AUTH_REQUIRED` (`10`) | 401 (`28`) |
| Another customer reads the order | 403 `ORDER_FORBIDDEN` (`11`) | 403 (`29a`, `29b`) |
| Automated checks | `npm run check`: lint clean, 18 frontend + 19 backend tests, build OK (`05`) | – |

Evidence files are in `ShopSmart_Lab_Evidence/06_aws/`.

## Working features (verified on the hosted site)

- Browse products, search, category filter, sort, product details
- Cart: add, change quantity, remove, kept after refresh
- Sign in / create account / sign out, My orders
- Simulated checkout for signed-in customers; invalid details refused (422); quantity above stock refused (409)
- Product assistant: answers from current catalog records with links, clear no-match message, invalid input refused, safe fallback with a notice when Gemini fails or times out (10 s)
- API recovers automatically after a crash and after a server reboot; data is kept

## Known limitations

- **Single server.** One EC2 instance is a single point of failure, and the database has no automatic backups (fictional data only; accepted for a short demo).
- **No real domain.** The site uses the free `sslip.io` hostname of the Elastic IP.
- **Accounts are basic.** No password reset or email verification; sessions last 7 days. Use fictional details only.
- **Stock in the cart can be outdated (DEF-03).** The API still refuses orders above the real stock.
- **The cart is saved per browser** (localStorage).
- **AI depends on a key and the internet.** Without them the assistant uses rule-based answers with a notice.
- **Dependencies.** `npm audit` reports 13 vulnerabilities in third-party packages (5 moderate, 5 high, 3 critical). Not addressed in this activity.

## Local startup

Follow the project `README.md`, section "Set up the ShopSmart project", steps 1 to 11. Notes for this version:

- Apply migrations with `npm exec --workspace backend -- prisma migrate deploy` (the new `customer_accounts` migration is already committed).
- `npm run db:seed` only on a new, empty database – it deletes orders and products.
- Use `http://localhost:5173` (not `127.0.0.1`) so the sign-in cookie matches the API at `http://localhost:3000`.
- `GEMINI_API_KEY` in `backend/.env` is optional.

## Team record

This was a solo submission.

| Member | Test I ran | Contribution | Issue I can explain |
|---|---|---|---|
| Jansdale S. Yusi | All local retests and all 8 hosted checks | Created and secured the AWS account, launched and configured the EC2 server, deployed the release, ran every test, captured the evidence | Why a guest gets 401 but another customer gets 403: the session cookie identifies the customer, and the API compares the order's `customerId` with the session's customer |

## Tools used

Claude (an AI assistant) helped write the sign-in code, the server commands and this documentation. I created the AWS resources, ran every command and test, captured all evidence, and checked the results myself.
