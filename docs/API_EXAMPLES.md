# ShopSmart API examples

Start the application with `npm run dev`, then send these requests through Bruno or another authorized API client.

## Health check

```http
GET http://localhost:3000/api/health
```

## Product list

```http
GET http://localhost:3000/api/products
```

## One product

```http
GET http://localhost:3000/api/products/1
```

## Customer sign-in

Orders now require a signed-in customer. Register or sign in first. The API answers with a
`Set-Cookie: shopsmart_session=...; HttpOnly; SameSite=Lax` header, and the browser (or Bruno's
cookie jar) sends that cookie with the next requests. Use fictional details only.

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{ "name": "Ana Reyes", "email": "ana@example.com", "password": "demo-pass-123" }
```

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{ "email": "ana@example.com", "password": "demo-pass-123" }
```

```http
GET http://localhost:3000/api/auth/me
POST http://localhost:3000/api/auth/logout
```

## Create a simulated order (signed in)

```http
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "customerName": "Ana Reyes",
  "email": "ana@example.com",
  "address": "Angeles City, Pampanga",
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 2, "quantity": 1 }
  ]
}
```

The server ignores prices from the browser and reads authoritative prices from PostgreSQL.
The order owner is taken from the session cookie, never from the request body.

## Read orders (order ownership)

```http
GET http://localhost:3000/api/orders
GET http://localhost:3000/api/orders/1
```

| Who asks | `GET /api/orders/1` result |
|---|---|
| Guest (no cookie) | `401 AUTH_REQUIRED` |
| The customer who placed order 1 | `200` with the order |
| A different signed-in customer | `403 ORDER_FORBIDDEN` |
| Anyone, order does not exist | `404 ORDER_NOT_FOUND` (signed-in customers only) |

Orders placed before sign-in existed have no owner and cannot be read by any customer.

## Ask the starter assistant

```http
POST http://localhost:3000/api/assistant/questions
Content-Type: application/json

{
  "question": "Which keyboard is below ₱2,000?"
}
```
