import { create } from "zustand";
import type { AppState, CartItem, User } from "@final-mfe/shared-types";
import { NISUM } from "@final-mfe/events";

/**
 * Global/shared application state.
 *
 * Loaded as a Module Federation "shared" singleton (see webpack.config.js
 * in every app: "@final-mfe/state" is marked `singleton: true`), so the
 * Gateway, Product MFE and Cart MFE all read/write the *same* store
 * instance at runtime rather than each getting their own copy.
 *
 * Reserved for state that's genuinely cross-cutting (current user, cart
 * contents). Anything local to one MFE (e.g. "is the product filter
 * panel open") stays in that MFE's own component state — see the
 * Data-Sharing Strategy section of the README for the reasoning.
 */
interface AppStore extends AppState {
  login: (user: User) => void;
  logout: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  cart: { items: [], totalItems: 0, totalPrice: 0 },

  login: (user) => set({ user }),
  logout: () => set({ user: null }),

  addItem: (item) => {
    const items = [...get().cart.items];
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }
    const cart = recalculate(items);
    set({ cart });
    // The store update AND the event both fire: state is the source of
    // truth for "what's in the cart right now", the event is the
    // notification that "something just happened" (see README §9).
    NISUM.emit("cart:updated", cart);
  },

  removeItem: (productId) => {
    const items = get().cart.items.filter((i) => i.productId !== productId);
    const cart = recalculate(items);
    set({ cart });
    NISUM.emit("cart:updated", cart);
  },

  clearCart: () => {
    // Called after a successful checkout (see mfe-cart/src/Cart.tsx) —
    // the order is now the backend's record of what was purchased, so
    // the shared cart state resets to empty.
    const cart = recalculate([]);
    set({ cart });
    NISUM.emit("cart:updated", cart);
  },
}));

function recalculate(items: CartItem[]) {
  return {
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: Number(items.reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)),
  };
}
