import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { productsRouter } from "./routes/products";
import { cartRouter } from "./routes/cart";
import { ordersRouter } from "./routes/orders";

const app = express();
app.use(express.json());
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);

const DATA_DIR = path.join(__dirname, "..", "data");

// Each test run works against the real JSON-file store (data/*.json) —
// reset it before/after so tests don't depend on leftover state and
// don't leave the repo's data files dirty for the next run.
beforeEach(() => {
  if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
});
afterAll(() => {
  if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

describe("GET /api/products", () => {
  it("returns the seeded product list on first run", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("returns 404 for an unknown product id", async () => {
    const res = await request(app).get("/api/products/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });
});

describe("Cart + Orders (JSON-file persistence)", () => {
  it("adding to cart persists across requests", async () => {
    await request(app).post("/api/cart").send({ productId: "p1", quantity: 2 });
    const res = await request(app).get("/api/cart");
    expect(res.body.data).toEqual([
      expect.objectContaining({ productId: "p1", quantity: 2 }),
    ]);
  });

  it("rejects adding an out-of-stock product", async () => {
    const res = await request(app).post("/api/cart").send({ productId: "p3", quantity: 1 });
    expect(res.status).toBe(409);
  });

  it("checkout creates an order, clears the cart, and persists it", async () => {
    await request(app).post("/api/cart").send({ productId: "p1", quantity: 1 });

    const checkout = await request(app).post("/api/orders");
    expect(checkout.status).toBe(201);
    expect(checkout.body.data.items).toHaveLength(1);
    expect(checkout.body.data.total).toBeGreaterThan(0);

    const cartAfter = await request(app).get("/api/cart");
    expect(cartAfter.body.data).toEqual([]);

    const orders = await request(app).get("/api/orders");
    expect(orders.body.data).toHaveLength(1);
  });

  it("rejects checkout with an empty cart", async () => {
    const res = await request(app).post("/api/orders");
    expect(res.status).toBe(400);
  });
});
