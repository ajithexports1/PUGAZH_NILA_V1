# Architecture Notes

- `client/` is the React/Vite customer experience.
- `server/src/server.js` defines Express REST routes, Mongoose models, authentication middleware, and payment scaffolding.
- Prices and stock are re-read from MongoDB when creating orders; browser-submitted prices are ignored.
- Administrative APIs use server-side role checks.
- `server/src/seed.js` adds demo catalogue products and an optional environment-configured administrator.
- `server/test/pricing.test.js` contains a small example of the built-in Node test runner.

## Known V1 scope
The core browse, auth, order-request, wishlist, and stitching paths are included. For launch, add provider-backed OTP/email, full webhook reconciliation, refund operations, shipment tracking, richer product CRUD UI, uploaded-image storage, and full automated integration/E2E tests. The storefront may show demo products if the API is unavailable; ordering requires the API and MongoDB to be running.
