import { formatCurrency } from "@/lib/format";
import type { OrderTotals } from "@/types";

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground"
          : "flex items-center justify-between text-sm"
      }
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "" : "font-medium text-foreground tabular-nums"}>{value}</span>
    </div>
  );
}

export function OrderSummary({
  totals,
  currency,
  taxRate,
  title = "Order summary",
}: {
  totals: OrderTotals;
  currency: string;
  taxRate: number;
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-xs"
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
      <Row label="Discount" value={`− ${formatCurrency(totals.discount, currency)}`} />
      <Row label="Shipping" value={formatCurrency(totals.shipping, currency)} />
      <Row label={`Tax (${taxRate.toFixed(2)}%)`} value={formatCurrency(totals.tax, currency)} />
      <Row strong label="Total" value={formatCurrency(totals.total, currency)} />
    </section>
  );
}