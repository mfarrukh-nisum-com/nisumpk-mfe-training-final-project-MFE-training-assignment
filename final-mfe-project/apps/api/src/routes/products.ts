import { Router } from "express";
import type { Product } from "@final-mfe/shared-types";
import { readCollection } from "../db/jsonStore";
import { productSeed } from "../data/seed";

export const productsRouter = Router();

// Reads data/products.json on every request (seeded from productSeed on
// first run) — simple and fine for a JSON-file-backed demo store. A real
// DB-backed version would cache/pool connections instead of re-reading
// a file each time, but the route contract here stays identical.
productsRouter.get("/", (_req, res) => {
  const products = readCollection<Product[]>("products", productSeed);
  res.json({ data: products });
});

productsRouter.get("/:id", (req, res) => {
  const products = readCollection<Product[]>("products", productSeed);
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: { message: `Product ${req.params.id} not found` } });
  }
  res.json({ data: product });
});
