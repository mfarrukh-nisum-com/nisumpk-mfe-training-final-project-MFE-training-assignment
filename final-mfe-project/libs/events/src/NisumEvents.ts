import type { NisumEventMap } from "@final-mfe/shared-types";

/**
 * window.NISUM — the cross-MFE event bus.
 *
 * Built on native browser CustomEvent + EventTarget so it works
 * regardless of which framework/version each remote MFE uses
 * internally. This is what lets independently-built, independently
 * deployed MFEs talk to each other without importing one another's code.
 *
 * Usage:
 *   NISUM.emit("cart:item-added", { productId: "p1", quantity: 1 });
 *   const unsubscribe = NISUM.listener("cart:item-added", (data) => { ... });
 *   unsubscribe(); // always clean up in useEffect return / componentWillUnmount
 */
export class NisumEventBus {
  private target: EventTarget;
  private prefix = "nisum:";

  constructor(target: EventTarget = window) {
    this.target = target;
  }

  emit<K extends keyof NisumEventMap>(event: K, data: NisumEventMap[K]): void {
    this.target.dispatchEvent(
      new CustomEvent(this.prefix + String(event), { detail: data })
    );
  }

  listener<K extends keyof NisumEventMap>(
    event: K,
    handler: (data: NisumEventMap[K]) => void
  ): () => void {
    const wrapped = (e: Event) => handler((e as CustomEvent<NisumEventMap[K]>).detail);
    this.target.addEventListener(this.prefix + String(event), wrapped);
    // Returning the unsubscribe function makes cleanup a one-liner for callers.
    return () => this.target.removeEventListener(this.prefix + String(event), wrapped);
  }

  /** Convenience for one-shot listeners (e.g. waiting for a single order:created). */
  once<K extends keyof NisumEventMap>(
    event: K,
    handler: (data: NisumEventMap[K]) => void
  ): () => void {
    const unsubscribe = this.listener(event, (data) => {
      unsubscribe();
      handler(data);
    });
    return unsubscribe;
  }
}

declare global {
  interface Window {
    NISUM: NisumEventBus;
  }
}

// Attach a single shared instance to window exactly once, even if this
// module is bundled separately into each remote (Module Federation
// normally dedupes this as a shared singleton — this guard is the
// defensive fallback if it somehow isn't).
export function installNisum(): NisumEventBus {
  if (typeof window !== "undefined") {
    if (!window.NISUM) {
      window.NISUM = new NisumEventBus(window);
    }
    return window.NISUM;
  }
  // SSR / test fallback: return a bus over a throwaway EventTarget.
  return new NisumEventBus(new EventTarget());
}

export const NISUM = installNisum();
