<<<<<<< HEAD
# PUGAZH NILA — Premium Luxury Boutique V1

A full-stack starter for an Indian boutique storefront built with React + Vite, Express, MongoDB/Mongoose, and a responsive luxury UI.

## Included
- Luxury storefront with animated connected particles and orbital monogram
- Product listing, search, category filters, product details, wishlist
- Local cart persistence, quantity controls, checkout form and order creation
- Customer registration/login with hashed passwords and JWT
- Admin dashboard API protection and product/order management starter
- Tamil/English UI toggle for core storefront interface
- Custom stitching request form
- Razorpay integration scaffold with server-side order creation and signature verification
- Environment examples, seed data, API tests, Windows setup instructions

## Requirements
- Node.js 20+ recommended
- MongoDB Community Server or MongoDB Atlas
- Optional Razorpay test credentials for payment testing

## Run on Windows (PowerShell)
Open two terminals.

### 1. Backend
```powershell
cd server
Copy-Item .env.example .env
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```
Edit `server/.env` first if your MongoDB connection differs from the default.

### 2. Frontend
```powershell
cd client
npm.cmd install
npm.cmd run dev
```
Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Seeded admin
The seed script creates an admin account only when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are configured in `server/.env`. Change the sample values before use. Do not deploy with demo credentials.

## API overview
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/orders` (requires login)
- `GET /api/orders/mine` (requires login)
- `POST /api/stitching` (requires login)
- `GET /api/admin/summary` (admin only)
- `POST /api/payments/razorpay/order` (requires login + Razorpay configuration)
- `POST /api/payments/razorpay/verify` (requires login)

## Environment variables
See `server/.env.example`. Never put secrets in `client/`.

## Payment status
Razorpay routes use server-side order creation and signature verification. Add and verify the production webhook in your Razorpay dashboard before launch. UPI availability depends on gateway account approval and enabled payment methods. No real payment is simulated.

## Important production checklist
This is a runnable V1 starter, not a claim of legal certification or a fully audited production deployment. Before taking real orders:
- Configure HTTPS, production database credentials, CORS origins, rate limiting and monitoring.
- Configure Razorpay, webhooks, email and OTP delivery providers.
- Add full address validation, shipping integration, refunds, tax/invoice rules and operational workflows.
- Complete security review, accessibility testing, backup/restore testing, and automated end-to-end tests.
- Replace demo catalogue photography with owned or properly licensed assets.


## Official logo
The supplied PUGAZH NILA Boutique logo has been added to the header and footer, with an emblem favicon. Logo assets are in `client/public/images/`.
=======
# PUGAZH_NILA_V1
Pugazh Nila Boutique Website
>>>>>>> a25e365d791a3c564c6a6f3d9e6559cf84a64032
