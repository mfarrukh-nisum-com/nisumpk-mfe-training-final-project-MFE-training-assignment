export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function getEnv(key: string, fallback = ""): string {
  // Reads from process.env, injected per-environment by webpack DefinePlugin
  // (see each app's webpack.config.js) so nothing is hardcoded at build time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = (typeof process !== "undefined" ? (process.env as any)[key] : undefined) as
    | string
    | undefined;
  return value ?? fallback;
}
