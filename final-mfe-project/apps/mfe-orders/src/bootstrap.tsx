import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// Only runs when this MFE is launched standalone — proving it's
// independently runnable outside the Gateway, same as Product/Cart.
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
