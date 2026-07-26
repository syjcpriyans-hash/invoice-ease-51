import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, generateId } from "@/lib/format";
import type { OrderItem } from "@/types";

export function createEmptyItem(): OrderItem {
  return { id: generateId("itm"), description: "", sku: "", quantity: 1, unitPrice: 0, taxable: true };
}

export function OrderItemsEditor({
  items,
  currency,
  onChange,
  error,
}: {
  items: OrderItem[];
  currency: string;
  onChange: (items: OrderItem[]) => void;
  error?: string;
}) {
  function update(id: string, patch: Partial<OrderItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Line items</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, createEmptyItem()])}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
          return (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-12 md:items-end"
            >
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor={`desc-${item.id}`}>Description</Label>
                <Input
                  id={`desc-${item.id}`}
                  value={item.description}
                  placeholder="Pharmacy Refrigerator, 24 cu. ft."
                  onChange={(e) => update(item.id, { description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor={`sku-${item.id}`}>SKU (optional)</Label>
                <Input
                  id={`sku-${item.id}`}
                  value={item.sku ?? ""}
                  onChange={(e) => update(item.id, { sku: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor={`qty-${item.id}`}>Qty</Label>
                <Input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  onChange={(e) => update(item.id, { quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor={`price-${item.id}`}>Unit price</Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => update(item.id, { unitPrice: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2 md:pb-2">
                <Switch
                  id={`tax-${item.id}`}
                  checked={item.taxable}
                  onCheckedChange={(checked) => update(item.id, { taxable: checked })}
                />
                <Label htmlFor={`tax-${item.id}`} className="text-sm">
                  Taxable
                </Label>
              </div>
              <div className="flex items-center justify-between gap-2 md:col-span-1 md:justify-end md:pb-1">
                <span className="text-sm font-medium tabular-nums text-foreground md:hidden">
                  {formatCurrency(lineTotal, currency)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove item ${index + 1}`}
                  disabled={items.length === 1}
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Button>
              </div>
              <p className="hidden text-right text-sm text-muted-foreground md:col-span-12 md:block">
                Line total: {formatCurrency(lineTotal, currency)}
              </p>
            </div>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}