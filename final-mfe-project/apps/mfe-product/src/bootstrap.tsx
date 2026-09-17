import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Only runs when this MFE is launched standalone (npm run start here),
// proving it's independently runnable outside the Gateway.
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
