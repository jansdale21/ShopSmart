# ShopSmart Release Note

## Version and date

- **Release candidate:** commit `6ef54b5` on `main` (github.com/jansdale21/ShopSmart), November 12, 2026
- **Baseline before this work:** commit `d0e7474`
- After `6ef54b5` only documentation (`docs/`, this file) and `backend/.env.example` changed. No application code changed.

## Deployment status

**Local release candidate only.** Live staging was not completed for this submission. The deployment plan for Render is in [docs/activity-4-deployment-plan.md](docs/activity-4-deployment-plan.md).

Local smoke test on November 12, 2026: **passed** (health, products, cart, checkout, assistant). Details are in [docs/activity-5-release-check.md](docs/activity-5-release-check.md).

## Working features (verified)

- Browse products, search, category filter, sort, and product details
- Cart: add, change quantity, remove, and keep the cart after a page refresh
- Simulated checkout: invalid details refused in the browser and in the API (422); valid details create exactly one order
- Stock rule: the cart and the API both block quantities above stock (409), with no order created
- Product assistant: answers from the current catalog with product links, says honestly when nothing matches, and refers warranty questions to staff
- Live AI with Google Gemini, falling back to rule-based answers with a notice when Gemini cannot be reached
- Clear message when the server cannot be reached, and a 15-second timeout

Test record: [docs/activity-2-test-record.md](docs/activity-2-test-record.md) (23 cases, 21 pass and 2 fail before fixes; both passed after fixes). Fixes: [docs/activity-3-defects.md](docs/activity-3-defects.md).

## Known limitations

- **No authentication.** There are no user accounts or roles, so order history and admin actions are not protected. Only fictional data should be entered; the checkout page says so.
- **Stock in the cart can be outdated (DEF-03).** The cart remembers the stock from when an item was added. The API still refuses orders above the real stock with a clear message.
- **The cart is saved per browser.** The cart is kept in the browser's localStorage. It is not shared between devices or browsers.
- **AI depends on a key and the internet.** Without `GEMINI_API_KEY` or without internet, the assistant uses rule-based answers. A live Gemini answer took about 6 seconds in testing.
- **Hosting.** Not deployed for this release (local only).
- **Dependencies.** `npm audit` reports 11 vulnerabilities in third-party packages (5 moderate, 5 high, 1 critical). They were not addressed in this lab.

## Local startup

Follow the project `README.md`, section "Set up the ShopSmart project", steps 1 to 11:

1. Create `backend/.env` and `frontend/.env` from the `.env.example` files (README step 3).
2. `npm install` (step 4), `npm run db:generate` (step 5), `npm run db:migrate` (step 6).
3. `npm run db:seed` (step 7) – **only on a new, empty database**, because it deletes orders and products.
4. `npm run check` (step 8), then `npm run dev` (step 9).
5. Open `http://localhost:3000/api/health` and `http://localhost:5173` (steps 10–11).

**Extra configuration added in this version:**

- `GEMINI_API_KEY` in `backend/.env` – optional. Without it, the assistant uses rule-based answers. It is listed in `backend/.env.example` with an empty value.

## Team record

This was a solo submission.

| Member | Test I ran | Contribution | Issue I can explain |
|---|---|---|---|
| Jansdale S. Yusi | All 23 customer journey tests (TC-01 to TC-23), including the API-down test TC-23 | Ran and recorded the tests and evidence, verified the fixes, ran the release checks, and drew the deployment diagram | DEF-04: why "Failed to fetch" appeared when the API was down, and how `api.js` now shows a clear message and a timeout |
## Tools used

Claude (an AI assistant) helped draft the code fixes and this documentation. I ran every test, captured all evidence, and checked the results myself.
