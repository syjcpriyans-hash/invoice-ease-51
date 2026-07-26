const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore in MVP */
  }
}

export const STORAGE_KEYS = {
  orders: "invoiceflow.orders.v1",
  invoices: "invoiceflow.invoices.v1",
  settings: "invoiceflow.settings.v1",
  seeded: "invoiceflow.seeded.v1",
} as const;