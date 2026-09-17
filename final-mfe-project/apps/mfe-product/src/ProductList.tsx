import React, { useEffect, useState } from "react";
import { Button, Card, Loader, ErrorMessage } from "@final-mfe/shared-ui";
import { formatCurrency } from "@final-mfe/utilities";
import { useAppStore } from "@final-mfe/state";
import { NISUM } from "@final-mfe/events";
import type { Product } from "@final-mfe/shared-types";
import { fetchProducts, addToCartApi } from "./api";

export function ProductList() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addItem = useAppStore((s) => s.addItem);

  const load = () => {
    setError(null);
    setProducts(null);
    fetchProducts().then(setProducts).catch((e: Error) => setError(e.message));
  };

  useEffect(load, []);

  const handleAddToCart = async (product: Product) => {
    // 1) Update shared state directly — Cart MFE's selector re-renders immediately.
    //    This is the optimistic, instant-feeling part of the UI.
    
    addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
    NISUM.emit("cart:item-added", { productId: product.id, quantity: 1 });
    NISUM.emit("notification:show", { message: `${product.name} added to cart`, level: "success" });

    // 2) ALSO persist it to the backend (data/cart.json) — this is what
    //    makes Checkout later actually have something real to read.
    //    If it fails, we don't roll back the optimistic UI update (that
    //    would be jarring); we surface it as a notification instead.
    try {
      await addToCartApi(product.id, 1);
    } catch (e) {
      NISUM.emit("notification:show", {
        message: `Couldn't save "${product.name}" to your cart on the server — it's shown locally, but checkout may not include it. (${(e as Error).message})`,
        level: "error",
      });
    }
  };

  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!products) return <Loader label="Loading products..." />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="product-list">
      {products.map((p) => (
        <Card key={p.id}>
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-sm text-slate-500 mb-2">{p.description}</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{formatCurrency(p.price)}</span>
            <Button disabled={!p.inStock} onClick={() => handleAddToCart(p)}>
              {p.inStock ? "Add to cart" : "Out of stock"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
