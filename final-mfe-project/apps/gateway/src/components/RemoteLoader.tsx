import React, { Suspense } from "react";
import { Loader } from "@final-mfe/shared-ui";
import { RemoteErrorBoundary } from "./ErrorBoundary";

// Every remote is mounted through this one wrapper: Suspense handles the
// "still fetching remoteEntry.js" loading state, the error boundary
// handles "remote is unavailable". No remote is ever rendered directly.
export function RemoteLoader({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <RemoteErrorBoundary name={name}>
      <Suspense fallback={<Loader label={`Loading ${name}...`} />}>{children}</Suspense>
    </RemoteErrorBoundary>
  );
}
