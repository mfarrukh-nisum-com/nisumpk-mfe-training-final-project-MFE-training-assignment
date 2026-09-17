import type { Product } from "@final-mfe/shared-types";
import { getEnv } from "@final-mfe/utilities";

const API_URL = getEnv("API_URL", "http://localhost:3000/api");

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  return body.data as Product[];
}

/**
 * POST /api/cart — persists the add-to-cart to data/cart.json on the
 * backend. The shared Zustand store (see @final-mfe/state) is what makes
 * the UI feel instant, but this call is what makes the backend's record
 * of the cart real, which is what Checkout (in the Cart MFE) actually
 * reads from.
 */
export async function addToCartApi(productId: string, quantity = 1): Promise<void> {
  const res = await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
}
