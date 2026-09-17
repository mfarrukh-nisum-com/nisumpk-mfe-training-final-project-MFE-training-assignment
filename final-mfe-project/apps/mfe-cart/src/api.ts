import type { Order, CartItem } from "@final-mfe/shared-types";
import { getEnv } from "@final-mfe/utilities";

const API_URL = getEnv("API_URL", "http://localhost:3000/api");

/**
 * POST /api/orders — the backend reads whatever's currently in
 * data/cart.json, turns it into an order, persists it to
 * data/orders.json, and clears data/cart.json. This is the
 * frontend-to-backend half of checkout; the cross-MFE half (telling the
 * Orders MFE to refresh) is the order:created event emitted in Cart.tsx.
 */
export async function checkout(): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Checkout failed (${res.status})`);
  }
  const body = await res.json();
  return body.data as Order;
}

/** DELETE /api/cart/:productId — keeps data/cart.json in sync with the
 * shared frontend state when an item is removed. */
export async function removeFromCartApi(productId: string): Promise<void> {
  const res = await fetch(`${API_URL}/cart/${productId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
}

export async function fetchCart(): Promise<CartItem[]> {
  const res = await fetch(`${API_URL}/cart`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  return body.data as CartItem[];
}
