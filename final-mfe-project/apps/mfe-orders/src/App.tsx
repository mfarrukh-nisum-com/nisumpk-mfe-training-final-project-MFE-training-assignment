import React from "react";
import { OrdersList } from "./OrdersList";
import "./styles.css";

// Exposed remote module (see webpack.config.js "exposes"). CSS import
// lives here too, for the same reason as mfe-product/mfe-cart: this is
// the file the Gateway actually loads, bootstrap.tsx never runs there.
export function App() {
  return <OrdersList />;
}
export default App;
