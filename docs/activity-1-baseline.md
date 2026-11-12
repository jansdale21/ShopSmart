# Activity 1 – Start From a Known Baseline

**Date:** November 12, 2026
**Version tested:** commit `d0e7474` ("Fix AI Assistant bug"), before any fixes

## Environment

| Tool | Version |
|---|---|
| Operating system | Windows |
| Node.js | v24.21.0 (project needs 20.19 or newer) |
| npm | 11.19.0 |
| Git | 2.55.0 |
| PostgreSQL | 18 (service `postgresql-x64-18`, running) |
| Prisma migrations | 1 migration found, database schema up to date |

Both `.env` files exist, and a Gemini API key is set in `backend/.env`. Only the two `.env.example` files are tracked by Git.

## Baseline `npm run check`

I ran `npm run check` from the `ShopSmart-Starter` folder before changing anything.

| Part | Result |
|---|---|
| Frontend lint | No errors |
| Backend lint | No errors |
| Frontend tests (Vitest) | 8 passed, 0 failed |
| Backend tests (Node test runner) | 6 passed, 0 failed |
| Frontend build (Vite) | Built successfully |

The baseline check passed, so there was no failing workspace to reproduce. The defects in this project were found through the customer journey tests in Activity 2.

## App started with `npm run dev`

| Check | Result |
|---|---|
| `http://localhost:3000/api/health` | `{"status":"ok"}` |
| `http://localhost:3000/api/products` | 6 products returned |
| `http://localhost:5173` | Home page loads with product cards |

The product IDs start at 7 instead of 1 because the local database was seeded more than once before this activity. This is why I did not run `npm run db:seed` again during the activity.

## Features in this version

| Feature | Present? |
|---|---|
| Product list and product details page | Yes |
| Search, category filter and sort | Yes |
| Cart (add, change quantity, remove) | Yes |
| Simulated checkout with validation | Yes |
| Stock limit (in the cart and in the API) | Yes |
| Product assistant (rule-based) | Yes |
| **Live AI (Google Gemini) with rule-based fallback** | **Yes** |
| **Authentication / roles** | **No** – so the guest/owner permission tests do not apply |
| Cart kept after page refresh | No at baseline (fixed later as DEF-02) |

## Evidence

Folder: `ShopSmart_Lab_Evidence/01_baseline/`

| File | Shows |
|---|---|
| `00_setup-check.png` | Tool versions, PostgreSQL running, `.env` check, migration status, Git |
| `01_baseline_npm-check.log` | Full output of the baseline `npm run check` |
| `02_baseline_npm-check.png`, `02b_baseline_npm-check-end.png` | Screenshots of the check result |
| `03_api-health.png` | `/api/health` response |
| `04_api-products.png` | `/api/products` response |
| `05_home-page.png` | Home page |
