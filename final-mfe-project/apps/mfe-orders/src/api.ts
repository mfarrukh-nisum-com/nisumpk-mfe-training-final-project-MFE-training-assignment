import type { Order } from "@final-mfe/shared-types";
import { getEnv } from "@final-mfe/utilities";

const API_URL = getEnv("API_URL", "http://localhost:3000/api");

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/orders`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  return body.data as Order[];
}
