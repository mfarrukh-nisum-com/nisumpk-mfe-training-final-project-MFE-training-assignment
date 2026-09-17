import React, { useEffect, useState } from "react";
import { Card, Button, ErrorMessage } from "@final-mfe/shared-ui";
import { formatCurrency } from "@final-mfe/utilities";
import { useAppStore } from "@final-mfe/state";
import { NISUM } from "@final-mfe/events";
import { checkout, removeFromCartApi, fetchCart } from "./api";

export function Cart() {
  // Reads the SAME store instance the Product MFE writes to (shared state).
  const cart = useAppStore((s) => s.cart);
  const removeItem = useAppStore((s) => s.removeItem);
  const clearCart = useAppStore((s) => s.clearCart);
  const [toast, setToast] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    // ALSO listens on the event bus — this is the event-driven half of
    // the demo: reacting to "something happened" independent of the
    // state selector above (e.g. for a transient toast, not persisted state).
    const unsubscribe = NISUM.listener("cart:item-added", ({ productId, quantity }) => {
      setToast(`+${quantity} item added (${productId})`);
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    });
    return unsubscribe; // cleanup on unmount — required, tested below.
  }, []);

  useEffect(() => {
    // Populate shared store from backend persisted cart on mount so a
    // page refresh shows the server-side cart (data/cart.json).
    (async () => {
      try {
        const items = await fetchCart();
        const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = Number(items.reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2));
        useAppStore.setState({ cart: { items, totalItems, totalPrice } });
      } catch {
        // ignore and keep empty cart if fetch fails
      }
    })();
  }, []);

  const handleRemove = async (productId: string) => {
    removeItem(productId);
    NISUM.emit("cart:item-removed", { productId });
    try {
      await removeFromCartApi(productId);
    } catch {
      // Non-fatal for the demo: the local/shared state is already
      // correct, and the next successful cart mutation re-syncs the
      // backend record. A production version would retry/queue this.
    }
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      const order = await checkout(); // POST /api/orders — reads data/cart.json server-side
      clearCart();
      // Tell any other MFE that cares (the Orders MFE, in this project)
      // that an order now exists — Orders never needs to know anything
      // about how Cart or checkout work internally, just this event.
      NISUM.emit("order:created", { orderId: order.id, total: order.total });
      NISUM.emit("notification:show", { message: `Order ${order.id} placed`, level: "success" });
    } catch (e) {
      setCheckoutError((e as Error).message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <Card data-testid="cart">
      <h3 className="font-semibold mb-2">Cart ({cart.totalItems})</h3>
      {toast && <p className="text-xs text-green-600 mb-2">{toast}</p>}
      {cart.items.length === 0 && <p className="text-sm text-slate-500">Your cart is empty.</p>}
      <ul className="space-y-2">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex items-center justify-between text-sm">
            <span>{item.name} × {item.quantity}</span>
            <div className="flex items-center gap-2">
              <span>{formatCurrency(item.price * item.quantity)}</span>
              <Button variant="danger" onClick={() => handleRemove(item.productId)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {cart.items.length > 0 && (
        <>
          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between font-medium">
            <span>Total</span>
            <span>{formatCurrency(cart.totalPrice)}</span>
          </div>
          {checkoutError && (
            <div className="mt-3">
              <ErrorMessage message={checkoutError} onRetry={handleCheckout} />
            </div>
          )}
          <Button className="mt-3 w-full" onClick={handleCheckout} disabled={checkingOut}>
            {checkingOut ? "Placing order..." : "Checkout"}
          </Button>
        </>
      )}
    </Card>
  );
}
