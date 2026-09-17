import { Router } from "express";
import type { CartItem, Order } from "@final-mfe/shared-types";
import { readCollection, writeCollection } from "../db/jsonStore";
import { clearCartFile } from "./cart";

export const ordersRouter = Router();

// Persisted to data/orders.json — this is what backs the third MFE
// (Orders), and what the Cart MFE's "Checkout" action calls.
ordersRouter.get("/", (_req, res) => {
  const orders = readCollection<Order[]>("orders", []);
  // Most recent first.
  res.json({ data: [...orders].reverse() });
});

ordersRouter.post("/", (_req, res) => {
  const cart = readCollection<CartItem[]>("cart", []);
  if (cart.length === 0) {
    return res.status(400).json({ error: { message: "Cannot checkout an empty cart" } });
  }

  const total = Number(cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));
  const order: Order = {
    id: `ord_${Date.now()}`,
    items: cart,
    total,
    createdAt: new Date().toISOString(),
  };

  const orders = readCollection<Order[]>("orders", []);
  orders.push(order);
  writeCollection("orders", orders);
  clearCartFile();

  res.status(201).json({ data: order });
});
