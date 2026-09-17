import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

// Generic, business-agnostic primitives live here — no "AddToCartButton",
// that belongs inside the Cart/Product MFE that owns that behavior.
export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  const styles: Record<string, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
