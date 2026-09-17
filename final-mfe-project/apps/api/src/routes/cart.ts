import { Router } from "express";
import type { CartItem, Product } from "@final-mfe/shared-types";
import { readCollection, writeCollection } from "../db/jsonStore";
import { productSeed } from "../data/seed";

export const cartRouter = Router();

// Persisted to data/cart.json. Demo-only: one shared cart, not tied to a
// session/user id — a real system would key this by an authenticated
// user (see README "Future Improvements").
cartRouter.get("/", (_req, res) => {
  const cart = readCollection<CartItem[]>("cart", []);
  res.json({ data: cart });
});


cartRouter.post("/", (req, res) => {
  const { productId, quantity } = req.body ?? {};
  const products = readCollection<Product[]>("products", productSeed);
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(400).json({ error: { message: "Invalid productId" } });
  }
  if (!product.inStock) {
    return res.status(409).json({ error: { message: `${product.name} is out of stock` } });
  }

  const cart = readCollection<CartItem[]>("cart", []);
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity ?? 1;
  } else {
    cart.push({ productId, name: product.name, price: product.price, quantity: quantity ?? 1 });
  }
  writeCollection("cart", cart);
  res.status(201).json({ data: cart });
});

cartRouter.delete("/:productId", (req, res) => {
  const cart = readCollection<CartItem[]>("cart", []);
  const updated = cart.filter((i) => i.productId !== req.params.productId);
  writeCollection("cart", updated);
  res.json({ data: updated });
});

// Clears the whole cart — used by POST /api/orders after checkout.
export function clearCartFile(): void {
  writeCollection("cart", []);
}
