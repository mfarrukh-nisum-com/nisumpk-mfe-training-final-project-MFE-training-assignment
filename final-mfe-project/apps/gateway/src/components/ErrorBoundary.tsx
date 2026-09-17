import React from "react";
import { ErrorMessage } from "@final-mfe/shared-ui";

interface Props { name: string; children: React.ReactNode; }
interface State { hasError: boolean; }

// Catches both remote-load failures (network down, remote not deployed)
// and runtime errors thrown inside a remote, so one broken MFE never
// takes down the whole Gateway shell.
export class RemoteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[Gateway] Remote "${this.props.name}" failed to load:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage
          message={`Unable to load "${this.props.name}". It may be offline or not yet deployed.`}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
