// Single source of truth for cross-MFE data shapes.
// Every app/lib imports these instead of redefining its own copies.

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppState {
  user: User | null;
  cart: CartState;
}

// Payload contracts for every event that crosses an MFE boundary.
// Keeping these here means both the emitting and listening MFE
// compile against the same shape.
export interface NisumEventMap {
  "cart:item-added": { productId: string; quantity: number };
  "cart:item-removed": { productId: string };
  "cart:updated": CartState;
  "user:login": User;
  "user:logout": Record<string, never>;
  "product:selected": { productId: string };
  "order:created": { orderId: string; total: number };
  "notification:show": { message: string; level: "info" | "success" | "error" };
}
