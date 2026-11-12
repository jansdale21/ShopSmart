# Activity 2 – Test the Customer Journey

**Date:** November 12, 2026
**Version tested:** commit `d0e7474` (before fixes)
**Setup:** `npm run dev` running locally (frontend `http://localhost:5173`, API `http://localhost:3000`). Prisma Studio (`npm run db:studio`) was used only to look at the Order and Product tables.
**Test data:** fictional only – names "Juan Dela Cruz" and "Maria Santos", emails ending in `@example.com`.

Evidence files are in `ShopSmart_Lab_Evidence/02_tests/`. Each case follows the lab's test record template.

## Summary

| Area | Cases | Result |
|---|---|---|
| Browse and search | TC-01 to TC-05 | 5 pass |
| Cart | TC-06 to TC-11 | 5 pass, 1 fail (DEF-02) |
| Checkout | TC-12 to TC-14 | 3 pass |
| Stock | TC-15 to TC-17 | 3 pass |
| Assistant | TC-18 to TC-21 | 4 pass |
| Failure | TC-22 to TC-23 | 1 pass, 1 fail (DEF-04) |
| Permissions (auth) | – | Not applicable: this version has no sign-in |
| **Total** | **23** | **21 pass, 2 fail** |

Defects found here (DEF-01 to DEF-04) are written up in [activity-3-defects.md](activity-3-defects.md). Both failed cases passed when repeated after the fixes.

---

## Browse and search

### TC-01 – Products load
- **Case and starting state:** Home page, Category = All, Sort = Default.
- **Action and test data:** Open `http://localhost:5173`, zoom out to see all cards.
- **Expected result:** 6 product cards with the same prices and stock as `/api/products`.
- **Observed result and evidence:** 6 cards: Wireless Mouse ₱650 (12), Compact Mechanical Keyboard ₱1,850 (8), USB-C Study Lamp ₱900 (10), 1080p Webcam ₱1,450 (6), Laptop Stand ₱1,200 (9), USB Headset ₱1,350 (7). `TC01_products-loaded.png`
- **Decision:** Pass

### TC-02 – Search with a match
- **Case and starting state:** Home page, all products shown.
- **Action and test data:** Type `keyboard` in Search products.
- **Expected result:** Only the Compact Mechanical Keyboard is shown.
- **Observed result and evidence:** One card: Compact Mechanical Keyboard, ₱1,850.00, "Only 8 left". `TC02_search-keyboard.png`
- **Decision:** Pass

### TC-03 – Search with no match
- **Case and starting state:** Home page.
- **Action and test data:** Type `xyz123` in Search products.
- **Expected result:** A clear "no results" message, not a blank page.
- **Observed result and evidence:** "No products match your search or filters." `TC03_search-no-results.png`
- **Decision:** Pass

### TC-04 – Category filter and sort
- **Case and starting state:** Home page, search cleared.
- **Action and test data:** Category = Study, Sort = Price: High to Low.
- **Expected result:** Only the two Study products, most expensive first.
- **Observed result and evidence:** Laptop Stand (₱1,200), then USB-C Study Lamp (₱900). `TC04_category-sort.png`
- **Decision:** Pass

### TC-05 – Product details page
- **Case and starting state:** Home page, Category = All.
- **Action and test data:** Click Details on 1080p Webcam.
- **Expected result:** A details page with the name, ₱1,450 and stock 6.
- **Observed result and evidence:** `/products/10` shows "1080p Webcam", ₱1,450.00, "6 unit(s) available". `TC05_product-details.png`
- **Decision:** Pass

## Cart

### TC-06 – Add one product
- **Case and starting state:** Cart (0).
- **Action and test data:** Add to cart on Wireless Mouse (₱650), then open Cart.
- **Expected result:** Items 1, Total ₱650.
- **Observed result and evidence:** Cart (1), Items 1, Total ₱650, message "Wireless Mouse was added to your cart." `TC06_cart-add-mouse.png`
- **Decision:** Pass

### TC-07 – Add a second product
- **Case and starting state:** Items 1, Total ₱650.
- **Action and test data:** Add Compact Mechanical Keyboard (₱1,850).
- **Expected result:** Items 2, Total ₱2,500.
- **Observed result and evidence:** Cart (2), Items 2, Total ₱2,500. `TC07_cart-add-keyboard.png`
- **Decision:** Pass

### TC-08 – Increase quantity
- **Case and starting state:** Items 2, Total ₱2,500.
- **Action and test data:** Press + twice on Wireless Mouse.
- **Expected result:** Mouse ×3 (₱1,950), Items 4, Total ₱3,800.
- **Observed result and evidence:** Mouse ×3 = ₱1,950, Items 4, Total ₱3,800. `TC08_cart-increase-qty.png`
- **Decision:** Pass

### TC-09 – Invalid quantity
- **Case and starting state:** Items 4, Total ₱3,800.
- **Action and test data:** Type `0` in the Keyboard quantity box.
- **Expected result:** An error message, and the quantity and total do not change.
- **Observed result and evidence:** "Quantity must be a whole number greater than zero." Keyboard stayed at 1, total stayed ₱3,800. But the message was shown in the same teal style as success messages. `TC09_cart-invalid-qty.png`
- **Decision:** Pass for validation; styling problem logged as **DEF-01**

### TC-10 – Remove an item
- **Case and starting state:** Items 4, Total ₱3,800.
- **Action and test data:** Click Remove on the Keyboard.
- **Expected result:** Mouse ×3 left, Items 3, Total ₱1,950.
- **Observed result and evidence:** Items 3, Total ₱1,950, "Item removed from cart." `TC10_cart-remove.png`
- **Decision:** Pass

### TC-11 – Refresh the page
- **Case and starting state:** Items 3, Total ₱1,950.
- **Action and test data:** Press F5 on the cart page.
- **Expected result:** A customer expects the cart to stay.
- **Observed result and evidence:** Cart (0), "Your cart is empty". The cart only lived in React memory. `TC11_cart-after-refresh.png`
- **Decision:** Fail – **DEF-02**. Retest after fix: pass (`03_fixes/06_DEF02_retest-cart-after-refresh.png`)

## Checkout

### TC-12 – Invalid details in the browser
- **Case and starting state:** Wireless Mouse ×1 in the cart, checkout page open.
- **Action and test data:** Name `Juan Dela Cruz`, email `juan@`, address `Angeles`; click Place simulated order.
- **Expected result:** The order is refused.
- **Observed result and evidence:** Browser messages: "Please enter a part following '@'." and "Please lengthen this text to 10 characters or more (you are currently using 7 characters)." No order was sent. `TC12_checkout-invalid-input.png`, `TC12b_checkout-invalid-input.png`
- **Decision:** Pass

### TC-13 – Invalid details sent straight to the API
- **Case and starting state:** API running. This checks that the server validates even if the browser form is skipped.
- **Action and test data:** PowerShell `Invoke-RestMethod` POST to `/api/orders` with name `J`, email `not-an-email`, address `short`, item productId 7 × 1.
- **Expected result:** Status 422 with code `INVALID_ORDER`.
- **Observed result and evidence:** `Status: 422`, `"code":"INVALID_ORDER"`, with one message per field (name at least 2 characters, invalid email, address at least 10 characters). `TC13_api-invalid-order-422.png`
- **Decision:** Pass

### TC-14 – Valid order creates one order
- **Case and starting state:** Order table has 0 rows; Wireless Mouse stock 12; Mouse ×1 in the cart. (`TC14a_db-orders-before.png`, `TC14b_db-stock-before.png`)
- **Action and test data:** Name `Juan Dela Cruz`, email `juan.delacruz@example.com`, address `123 Sampaguita St., Angeles City, Pampanga`; click Place simulated order once.
- **Expected result:** Exactly one order, total ₱650, cart cleared, mouse stock 11.
- **Observed result and evidence:** "Thank you, Juan Dela Cruz!", order #5, Total ₱650.00, Cart (0). Order table: 1 row (id 5, PENDING, 650, 1 OrderItem). Mouse stock 12 → 11; other products unchanged. The ID is 5 because PostgreSQL keeps counting after rows from older seeds were deleted. `TC14c_checkout-confirmation.png`, `TC14d_db-orders-after.png`, `TC14e_db-stock-after.png`
- **Decision:** Pass

## Stock

### TC-15 – Cart blocks more than the stock
- **Case and starting state:** 1080p Webcam (stock 6) ×1 in the cart.
- **Action and test data:** Type `7` in the quantity box, then type `6`.
- **Expected result:** 7 is refused with no change; 6 is accepted.
- **Observed result and evidence:** 7 → red message "Only 6 unit(s) are available.", quantity stayed 1, total ₱1,450. 6 → total ₱8,700 and the + button is disabled. `TC15a_cart-stock-limit-error.png`, `TC15b_cart-at-stock-limit.png`
- **Decision:** Pass

### TC-16 – API blocks more than the stock
- **Case and starting state:** Webcam stock 6; Order table has 1 row.
- **Action and test data:** POST to `/api/orders` with valid fictional details and productId 10 × 7.
- **Expected result:** Status 409 `INSUFFICIENT_STOCK`; no order created; stock unchanged.
- **Observed result and evidence:** `Status: 409`, "Only 6 unit(s) of 1080p Webcam are available." Order table still 1 row; Webcam stock still 6. `TC16a_api-insufficient-stock-409.png`, `TC16b_db-orders-unchanged.png`, `TC16c_db-stock-unchanged.png`
- **Decision:** Pass

### TC-17 – Stock changes while an item is in the cart
- **Case and starting state:** Webcam ×6 in the cart; Webcam stock 6.
- **Action and test data:** First, another fictional customer (Maria Santos, `maria.santos@example.com`) buys 1 Webcam through the API. Then I check out the 6 Webcams in the browser as Juan Dela Cruz.
- **Expected result:** Checkout is refused with a clear message; the cart is kept; no extra order.
- **Observed result and evidence:** Maria's order #6 created, Webcam stock 5. My checkout showed "Only 5 unit(s) of 1080p Webcam are available.", Cart (6) was kept, and the Order table had 2 rows (no third order). `TC17a_other-customer-order.png`, `TC17b_checkout-stock-changed.png`, `TC17c_db-after-stock-changed.png`, `TC17d_db-after-stock-changed.png`
- **Decision:** Pass. Side note logged as **DEF-03** (the cart still allows 6 because it remembers the old stock)

## Assistant

### TC-18 – Supported catalog question
- **Case and starting state:** Assistant page, internet on, Gemini key set.
- **Action and test data:** Ask `Which keyboard is below ₱2,000?`, then click the product link.
- **Expected result:** Recommends the Compact Mechanical Keyboard (₱1,850) with a link to the product.
- **Observed result and evidence:** Recommended the Compact Mechanical Keyboard ₱1,850 with a source link; the link opened `/products/8`. No "AI service is temporarily unavailable" note, and the server log shows `POST /api/assistant/questions 200 6445 ms`, so the live Gemini answer was used. `TC18a_assistant-keyboard.png`, `TC18b_assistant-source-link.png`
- **Decision:** Pass

### TC-19 – No product within budget
- **Action and test data:** Ask `Is there a keyboard below ₱1,000?`
- **Expected result:** An honest "no match", without suggesting other products as keyboards.
- **Observed result and evidence:** "I could not find an in-stock product matching that request…" `TC19_assistant-no-match-budget.png`
- **Decision:** Pass

### TC-20 – Product not in the catalog
- **Action and test data:** Ask `Do you sell drones?`
- **Expected result:** An honest "no match"; no invented product.
- **Observed result and evidence:** "Could not find" answer, no product suggested. `TC20_assistant-no-match-product.png`
- **Decision:** Pass

### TC-21 – Question the catalog cannot answer
- **Action and test data:** Ask `What is the warranty of the webcam?`
- **Expected result:** Says it cannot verify the warranty and refers to store staff; does not make one up.
- **Observed result and evidence:** "I cannot verify warranty… Please confirm… with store staff." `TC21_assistant-warranty-escalation.png`
- **Decision:** Pass

## Failure

### TC-22 – AI provider cannot be reached
- **Case and starting state:** App running, Wi-Fi turned off (localhost still works, Gemini cannot be reached).
- **Action and test data:** Ask `Which mouse do you recommend?`
- **Expected result:** Loading ends and a fallback answer is shown with a notice.
- **Observed result and evidence:** Recommended Wireless Mouse (₱650) with "The AI service is temporarily unavailable. This answer uses current ShopSmart catalog information." Server log: `Gemini unavailable. Using rule-based fallback.` `TC22a_ai-provider-failure-fallback.png`, `TC22b_ai-provider-failure-log.png`
- **Decision:** Pass

### TC-23 – API server is down
- **Case and starting state:** Only the frontend running (`npm run dev --workspace frontend`), API stopped.
- **Action and test data:** Refresh the Products page; ask the assistant `Which mouse do you recommend?`
- **Expected result:** Loading ends and a useful message is shown.
- **Observed result and evidence:** Loading ended, but the messages were the raw browser error: "Category options could not be loaded: Failed to fetch" and "Failed to fetch Make sure the backend is running." The assistant showed only "Failed to fetch". `TC23a_api-down-products.png`, `TC23b_api-down-assistant.png`
- **Decision:** Fail – **DEF-04**. Retest after fix: pass (`03_fixes/03_DEF04_retest-products-api-down.png`, `03_fixes/04_DEF04_retest-assistant-api-down.png`)

## Data at the end of testing

The local database was never reseeded. After these tests it held orders #5 and #6. Order #7 was added during the Activity 3 retest and order #8 during the Activity 5 smoke test.
