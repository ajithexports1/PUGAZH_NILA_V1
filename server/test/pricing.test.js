import test from "node:test";
import assert from "node:assert/strict";

function shippingFor(subtotal) { return subtotal >= 2500 ? 0 : 99; }
test("shipping is free at INR 2500 and above", () => {
  assert.equal(shippingFor(2500), 0);
  assert.equal(shippingFor(2501), 0);
});
test("shipping is INR 99 below INR 2500", () => {
  assert.equal(shippingFor(2499), 99);
  assert.equal(shippingFor(0), 99);
});
