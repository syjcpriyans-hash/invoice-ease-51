import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, generateId } from "@/lib/format";
import type { OrderItem } from "@/types";

export function createEmptyItem(): OrderItem {
  return {
    id: generateId("itm"),
    description: "",
    sku: "",
    quantity: 1,
    unitPrice: 0,
    taxable: true,
  };
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
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4]">
      <div className="flex items-center justify-between border-b border-[#071226]/10 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-[#071226]">
            Line items
          </h2>
          <p className="mt-0.5 text-[11px] text-[#071226]/48">
            Products and services included in this order
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, createEmptyItem()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      </div>

      <div className="hidden grid-cols-[minmax(240px,1fr)_140px_78px_120px_90px_100px_36px] gap-2 border-b border-[#071226]/10 bg-[#071226]/[0.025] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#071226]/45 lg:grid">
        <span>Description</span>
        <span>SKU</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span>Taxable</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      <div className="divide-y divide-[#071226]/10">
        {items.map((item, index) => {
          const lineTotal =
            (Number(item.quantity) || 0) *
            (Number(item.unitPrice) || 0);

          return (
            <div
              key={item.id}
              className="grid gap-2 px-3 py-3 lg:grid-cols-[minmax(240px,1fr)_140px_78px_120px_90px_100px_36px] lg:items-center"
            >
              <div>
                <Label className="mb-1 block lg:hidden">Description</Label>
                <Input
                  id={`desc-${item.id}`}
                  value={item.description}
                  placeholder="Item description"
                  onChange={(event) =>
                    update(item.id, {
                      description: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block lg:hidden">SKU</Label>
                <Input
                  id={`sku-${item.id}`}
                  value={item.sku ?? ""}
                  placeholder="Optional"
                  onChange={(event) =>
                    update(item.id, { sku: event.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block lg:hidden">Quantity</Label>
                <Input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  onChange={(event) =>
                    update(item.id, {
                      quantity: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block lg:hidden">Unit price</Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) =>
                    update(item.id, {
                      unitPrice: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`tax-${item.id}`}
                  checked={item.taxable}
                  onCheckedChange={(checked) =>
                    update(item.id, { taxable: checked })
                  }
                />
                <Label htmlFor={`tax-${item.id}`} className="text-xs">
                  Yes
                </Label>
              </div>

              <p className="text-right text-xs font-semibold tabular-nums text-[#071226]">
                {formatCurrency(lineTotal, currency)}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove item ${index + 1}`}
                disabled={items.length === 1}
                onClick={() => remove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {error ? (
        <p
          role="alert"
          className="border-t border-[#071226]/10 px-4 py-2 text-xs font-medium text-[#071226]"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
