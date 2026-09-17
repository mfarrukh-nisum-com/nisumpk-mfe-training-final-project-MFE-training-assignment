import { lazy } from "react";

// Centralizing the React.lazy() remote imports means every consumer
// (Nav, RemoteLoader, tests) points at one place if a remote's exposed
// path ever changes.
export const RemoteProductApp = lazy(() => import("mfe_product/ProductListApp"));
export const RemoteCartApp = lazy(() => import("mfe_cart/CartApp"));
export const RemoteOrdersApp = lazy(() => import("mfe_orders/OrdersApp"));
