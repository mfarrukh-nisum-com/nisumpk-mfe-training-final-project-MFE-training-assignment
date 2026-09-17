import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Nav } from "./components/Nav";
import { RemoteLoader } from "./components/RemoteLoader";
import { RemoteProductApp, RemoteCartApp, RemoteOrdersApp } from "./remotes/loaders";

// The Gateway/Shell: provides layout + navigation + remote composition.
// It never imports MFE business logic directly — only the exposed
// components loaded at runtime via Module Federation.
export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <header className="px-4 py-4 border-b border-slate-200 bg-white">
          <h1 className="font-semibold">Final MFE Project</h1>
        </header>
        <Nav />
        <main className="p-4 max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route
              path="/products"
              element={
                <RemoteLoader name="Product MFE">
                  <RemoteProductApp />
                </RemoteLoader>
              }
            />
            <Route
              path="/cart"
              element={
                <RemoteLoader name="Cart MFE">
                  <RemoteCartApp />
                </RemoteLoader>
              }
            />
            <Route
              path="/orders"
              element={
                <RemoteLoader name="Orders MFE">
                  <RemoteOrdersApp />
                </RemoteLoader>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
