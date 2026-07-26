import { formatCurrency } from "@/lib/format";
import type { OrderItem } from "@/types";

export function LockedOrderItems({
  items,
  currency,
}: {
  items: OrderItem[];
  currency: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Locked order line items</caption>
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Description
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              SKU
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Unit price
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-foreground">{item.description}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.sku || "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{item.quantity}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">
                {formatCurrency(item.unitPrice, currency)}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                {formatCurrency(item.quantity * item.unitPrice, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}