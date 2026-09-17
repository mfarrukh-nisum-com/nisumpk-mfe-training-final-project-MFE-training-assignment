import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { productsRouter } from "./routes/products";
import { cartRouter } from "./routes/cart";
import { ordersRouter } from "./routes/orders";

dotenv.config();

const app = express();
const PORT = process.env.API_PORT ?? 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:4200" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);

// Centralized error handler: every route's thrown/next(err) lands here so
// the frontend always gets a consistent { error: { message } } shape.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
