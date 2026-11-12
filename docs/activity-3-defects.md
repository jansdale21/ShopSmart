# Activity 3 – Fix and Verify Defects

**Date:** November 12, 2026
**Fixes are in:** commit `6ef54b5`
**Code diff:** `ShopSmart_Lab_Evidence/03_fixes/00_DEF-01-02-04_code-changes.diff`

I put the most important defect first. None of the defects broke checkout, exposed data or gave wrong totals, so the failure message (DEF-04) was the main fix because it failed a required test case.

| ID | Problem | Severity | Status |
|---|---|---|---|
| DEF-04 | Raw "Failed to fetch" error when the API is down; no timeout | Medium | Fixed, 4 new tests |
| DEF-02 | Cart is lost when the page is refreshed | Medium | Fixed, 5 new tests |
| DEF-01 | Cart error messages look like success messages | Low | Fixed |
| DEF-03 | Cart remembers the stock from when the item was added | Low | Not fixed – known limitation |

---

## DEF-04 – Useless error message when the server cannot be reached

**Found in:** TC-23

**Reproduction**
- **Starting state:** Frontend running alone (`npm run dev --workspace frontend`), API stopped.
- **Action:** Refresh the Products page, then ask the assistant a question.
- **Actual result:** "Category options could not be loaded: Failed to fetch" and "Failed to fetch Make sure the backend is running." The assistant showed only "Failed to fetch".
- **Expected result:** One clear message telling the customer the server could not be reached and what to do.

**Cause:** In `frontend/src/services/api.js`, when the server cannot be reached, `fetch()` throws a browser `TypeError: Failed to fetch` before the code that makes friendly messages runs. That raw text was shown on every page. There was also no timeout, so a frozen server could leave the page loading forever.

**Fix:**
- `frontend/src/services/api.js`: catch the network error and show "We could not reach the ShopSmart server. Please check your connection and try again." Added a 15-second timeout that shows "The ShopSmart server took too long to respond. Please try again." Server error messages (for example 409 stock errors) are kept as before.
- `frontend/src/pages/ProductsPage.jsx`: show one error instead of two, and removed the developer wording "Make sure the backend is running."

**New tests:** `frontend/src/services/api.test.js` (4 tests). `fetch` is replaced with a fake, so no server is needed:
1. A network failure gives the friendly message, not "Failed to fetch".
2. A request with no answer stops and reports a timeout.
3. A 409 error keeps the server's message and status.
4. A normal response still returns its data.

**Retest:** TC-23 repeated. Products page and assistant both show "We could not reach the ShopSmart server. Please check your connection and try again." and loading ends.
Evidence: `03_fixes/03_DEF04_retest-products-api-down.png`, `03_fixes/04_DEF04_retest-assistant-api-down.png`

---

## DEF-02 – Cart is lost on page refresh

**Found in:** TC-11

**Reproduction**
- **Starting state:** Wireless Mouse ×3 in the cart (Items 3, ₱1,950).
- **Action:** Press F5.
- **Actual result:** Cart (0), "Your cart is empty".
- **Expected result:** The same cart after the refresh.

**Cause:** The cart was stored only in React state (`useState` in `frontend/src/context/CartContext.jsx`), which is cleared when the page reloads.

**Fix:**
- New `frontend/src/utils/cartStorage.js`: saves the cart to the browser's localStorage and loads it back, ignoring damaged data. When the cart becomes empty (for example after checkout) the saved copy is removed.
- `CartContext.jsx`: starts from the saved cart and saves on every change.
- Only product information is saved (id, name, price, stock, quantity). No customer details are stored in the browser.

**New tests:** `frontend/src/utils/cartStorage.test.js` (5 tests): save and load, empty when nothing saved, removed when empty, damaged data ignored, works when storage is not available.

**Retest:** Added Wireless Mouse and USB-C Study Lamp (Items 2, ₱1,550), pressed F5, and the cart stayed. Checked out as Juan Dela Cruz (order #7, ₱1,550.00), refreshed again, and the cart stayed empty.
Evidence: `03_fixes/06_DEF02_retest-cart-after-refresh.png`, `03_fixes/07_journey-rerun-checkout.png`, `03_fixes/08_DEF02_retest-empty-after-checkout-refresh.png`

---

## DEF-01 – Cart error looks like a success message

**Found in:** TC-09

**Reproduction**
- **Starting state:** Items in the cart.
- **Action:** Type `0` in a quantity box.
- **Actual result:** "Quantity must be a whole number greater than zero." in teal, the same style as "…was added to your cart."
- **Expected result:** The error shown in the red error style.

**Cause:** `CartPage.jsx` only treated a message as an error if it started with the word "Only" (`cartMessage.startsWith('Only')`). Other errors were shown as information. This is why "Only 6 unit(s) are available." in TC-15 was red but TC-09 was not.

**Fix:** `CartContext.jsx` now stores whether each message is an error or information (`cartMessageType`). `CartPage.jsx`, `ProductsPage.jsx` and `ProductDetailsPage.jsx` use that value.

**Retest:** Typed `0` again; the message is now red.
Evidence: `03_fixes/05_DEF01_retest-error-is-red.png`

---

## DEF-03 – Cart remembers old stock (not fixed)

**Found in:** TC-17

**What happens:** The cart saves each product's stock at the moment it is added. If someone else buys that product, the cart still allows the old quantity. For example, the cart kept allowing 6 Webcams after the stock dropped to 5.

**Impact:** The customer can be refused at checkout and has to lower the quantity by guessing.

**Why it is safe for now:** The API checks stock again when the order is placed. It refuses with status 409 and a clear message ("Only 5 unit(s) of 1080p Webcam are available."), keeps the cart, and creates no order (TC-16 and TC-17).

**Temporary limitation:** Listed in the release note. A later fix would reload the product stock when the cart or checkout page opens.

---

## Checks after the fixes

I ran `npm run check` again after the fixes.

| Part | Before | After |
|---|---|---|
| Frontend lint | No errors | No errors |
| Backend lint | No errors | No errors |
| Frontend tests | 8 passed | 17 passed (8 old + 9 new) |
| Backend tests | 6 passed | 6 passed |
| Build | Built | Built |

No test was deleted or weakened.

I also repeated the customer journey after the fixes (cart, checkout and assistant). Evidence: `03_fixes/01_after-fix_npm-check.log`, `02_after-fix_npm-check.png`, `02b_after-fix_npm-check.png`, `07_journey-rerun-checkout.png`, `09_smoke-assistant.png`
