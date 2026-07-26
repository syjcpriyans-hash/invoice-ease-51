import type { DiscountType, Order, OrderItem, OrderStatus, OrderTotals, EmailStatus } from "@/types";

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatInvoiceNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(5, "0")}`;
}

export function suggestOrderNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(existingCount + 1).padStart(4, "0")}`;
}

export function generateToken(length = 40): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${generateToken(12)}`;
}

export interface TotalsInput {
  items: Pick<OrderItem, "quantity" | "unitPrice" | "taxable">[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  shipping: number;
}

export function calculateTotals(input: TotalsInput): OrderTotals {
  const items = input.items ?? [];
  const subtotal = round2(
    items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
  );
  const taxableBase = round2(
    items.reduce(
      (sum, i) => sum + (i.taxable ? (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) : 0),
      0,
    ),
  );

  const rawDiscount =
    input.discountType === "percentage"
      ? (subtotal * (Number(input.discountValue) || 0)) / 100
      : Number(input.discountValue) || 0;
  const discount = round2(Math.min(Math.max(rawDiscount, 0), subtotal));

  const discountRatio = subtotal > 0 ? discount / subtotal : 0;
  const discountedTaxable = round2(taxableBase * (1 - discountRatio));
  const tax = round2((discountedTaxable * (Number(input.taxRate) || 0)) / 100);
  const shipping = round2(Number(input.shipping) || 0);
  const total = round2(subtotal - discount + shipping + tax);

  return { subtotal, discount, shipping, tax, total };
}

export function orderTotals(order: Order): OrderTotals {
  return calculateTotals({
    items: order.items,
    discountType: order.discountType,
    discountValue: order.discountValue,
    taxRate: order.taxRate,
    shipping: order.shipping,
  });
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  link_sent: "Link Sent",
  form_opened: "Form Opened",
  submitted: "Submitted",
  invoice_generated: "Invoice Generated",
  email_sent: "Email Sent",
  delivered: "Delivered",
  failed: "Failed",
};

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  not_generated: "Not Generated",
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced",
  failed: "Failed",
};

export function customerUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/customer/${token}`;
}