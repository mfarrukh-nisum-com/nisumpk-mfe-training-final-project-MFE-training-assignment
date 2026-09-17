import React from "react";
import { NavLink } from "react-router-dom";
import { useAppStore } from "@final-mfe/state";

export function Nav() {
  const totalItems = useAppStore((s) => s.cart.totalItems);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <nav className="flex gap-1 border-b border-slate-200 px-4 py-3">
      <NavLink to="/products" className={linkClass}>Products</NavLink>
      <NavLink to="/cart" className={linkClass}>Cart {totalItems > 0 && `(${totalItems})`}</NavLink>
      <NavLink to="/orders" className={linkClass}>Orders</NavLink>
    </nav>
  );
}
