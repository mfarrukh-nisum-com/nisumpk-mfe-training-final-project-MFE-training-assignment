import React from "react";
import { ProductList } from "./ProductList";
import "./styles.css";

// This is the exposed remote module (see webpack.config.js "exposes").
// The Gateway lazy-loads exactly this component, so the CSS import lives
// here (not bootstrap.tsx) — bootstrap.tsx never runs when the Gateway
// consumes this remote, only when this MFE is launched standalone.
export function App() {
  return <ProductList />;
}
export default App;
