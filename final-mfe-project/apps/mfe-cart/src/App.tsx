import React from "react";
import { Cart } from "./Cart";
import "./styles.css";

// Same reasoning as mfe-product/src/App.tsx: the CSS import has to live
// in the exposed module, since bootstrap.tsx never runs when the
// Gateway consumes this remote via Module Federation.
export function App() {
  return <Cart />;
}
export default App;
