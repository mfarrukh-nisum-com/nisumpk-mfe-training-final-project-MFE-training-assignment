import React from "react";

export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      {label}
    </div>
  );
}
