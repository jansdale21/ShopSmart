# Activity 5 – Verify a Release Candidate

**Date:** November 12, 2026
**Release candidate:** commit `6ef54b5`, pushed to github.com/jansdale21/ShopSmart
**Deployment status:** Local release candidate only. Live staging was not completed for this release.

Evidence folder: `ShopSmart_Lab_Evidence/05_release/`

## Release checks

| Release check | Pass condition | Result | Evidence |
|---|---|---|---|
| Build and tests | `npm run check` completes, or each failure is listed | Pass – lint clean, frontend 17 passed, backend 6 passed, build OK | `01_release-candidate_npm-check.log`, `02_…png`, `02b_…png` |
| Health and API | `/api/health` responds and the frontend reaches the intended API | Pass – `{"status":"ok"}`; frontend loads products from `http://localhost:3000/api` | `03_smoke-health.png`, `04_smoke-products.png` |
| Database | Products load; an order can be placed without resetting earlier data | Pass – order #8 created; orders #5, #6, #7 still there | `07_smoke-order.png`, `09_data-survived.png` |
| Assistant | Answer is based on current products; an outage has a controlled result | Pass – keyboard answer with source link; Gemini outage falls back with a notice (TC-22) | `08_smoke-assistant.png`, `02_tests/TC22a…png` |
| Secrets | No `.env`, `DATABASE_URL` or provider key committed or in the frontend bundle | Pass – Git tracks only the two `.env.example` files; search of `frontend/dist/assets/*.js` for `DATABASE_URL`, `GEMINI`, `postgresql://`, `AIza` and `shopsmart_dev` found nothing | `10_secrets-check.png` |
| Privacy | Only fictional data; no real customer details | Pass – all orders use fictional names and `@example.com` emails; checkout shows a "Classroom demo" notice | `06_smoke-checkout-notice.png` |

## Smoke test

Run on the local app with `npm run dev`.

| Step | Action | Result |
|---|---|---|
| Health | Open `http://localhost:3000/api/health` | `{"status":"ok"}` |
| Products | Open `http://localhost:5173` | 6 products shown |
| Cart | Add Laptop Stand, open the cart | Items 1, ₱1,200 |
| Checkout | Juan Dela Cruz, `juan.delacruz@example.com`, 123 Sampaguita St., Angeles City, Pampanga | Order #8, ₱1,200.00, cart cleared |
| Assistant | Ask "Which keyboard is below ₱2,000?" | Compact Mechanical Keyboard, ₱1,850, with link |
| Data | Refresh the Order table in Prisma Studio | 4 orders (#5 to #8); nothing was reset |

## Commands used for the secrets check

```powershell
git ls-files | Select-String "\.env"
Select-String -Path frontend\dist\assets\*.js -Pattern "DATABASE_URL","GEMINI","postgresql://","AIza","shopsmart_dev"
```

The first command listed only `backend/.env.example` and `frontend/.env.example`. The second printed nothing.

## Version

The fixes, the `trust proxy` setting and the checkout notice were committed and pushed as `6ef54b5` (`11_git-commit-push.png`). After that commit only documentation and `backend/.env.example` changed. No application code changed.
