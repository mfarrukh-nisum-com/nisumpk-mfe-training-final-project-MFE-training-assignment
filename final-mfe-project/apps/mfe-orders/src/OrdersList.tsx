import React, { useEffect, useState, useCallback } from "react";
import { Card, Loader, ErrorMessage } from "@final-mfe/shared-ui";
import { formatCurrency } from "@final-mfe/utilities";
import { NISUM } from "@final-mfe/events";
import type { Order } from "@final-mfe/shared-types";
import { fetchOrders } from "./api";

// The third MFE. Owns a business responsibility neither Product nor Cart
// does: order history. It never imports Cart's or Product's internals —
// the only thing connecting it to them is the order:created event and
// the backend's /api/orders endpoint, which is exactly the point:
// a new MFE can be added without touching the other two.
export function OrdersList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetchOrders().then(setOrders).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    // Cart MFE emits this on checkout. Orders MFE doesn't need to know
    // anything about how checkout works internally — just this event.
    return NISUM.listener("order:created", () => load());
  }, [load]);

  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!orders) return <Loader label="Loading orders..." />;

  return (
    <div data-testid="orders-list">
      <h3 className="font-semibold mb-3">Order History</h3>
      {orders.length === 0 && (
        <p className="text-sm text-slate-500">No orders yet — add items to your cart and check out.</p>
      )}
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-medium text-sm">{order.id}</span>
              <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <ul className="text-sm text-slate-600 space-y-1">
              {order.items.map((item) => (
                <li key={item.productId}>{item.name} × {item.quantity}</li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-medium text-sm">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
