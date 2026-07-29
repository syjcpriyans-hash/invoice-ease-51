import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CopyLinkButton } from "@/components/copy-link-button";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderService } from "@/services/orderService";
import {
  customerUrl,
  formatCurrency,
  formatDate,
  orderTotals,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { RequireAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders | Billantra" },
      {
        name: "description",
        content:
          "Search, filter, and manage every order and customer link.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrdersPage />
    </RequireAuth>
  ),
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "awaiting", label: "Awaiting customer" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const GROUPS: Record<Exclude<FilterKey, "all">, OrderStatus[]> = {
  awaiting: [
    "draft",
    "link_created",
    "link_sent",
    "link_email_failed",
    "form_opened",
  ],
  submitted: ["submitted"],
  completed: [
    "invoice_generating",
    "invoice_generated",
    "email_queued",
    "email_sent",
    "delivered",
  ],
  failed: ["link_email_failed", "failed"],
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    let active = true;

    orderService
      .list()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not load orders",
        );
        if (active) setOrders([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const list = orders ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return list.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.orderNumber.toLowerCase().includes(normalizedQuery) ||
        order.customerEmail.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === "all" || GROUPS[filter].includes(order.status);

      return matchesQuery && matchesFilter;
    });
  }, [orders, query, filter]);

  const totalValue = visible.reduce(
    (sum, order) => sum + orderTotals(order).total,
    0,
  );
  const currency = visible[0]?.currency ?? "USD";

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Orders"
          description="Search, review, and manage every customer-link workflow."
          actions={
            <Button asChild size="sm">
              <Link to="/orders/new">
                <Plus className="h-3.5 w-3.5" />
                Create order
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <section className="overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4]">
            <div className="flex flex-col gap-3 border-b border-[#071226]/10 px-3 py-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full max-w-sm">
                <Label
                  htmlFor="order-search"
                  className="mb-1 block text-[10px] uppercase tracking-[0.06em]"
                >
                  Search orders
                </Label>
                <Input
                  id="order-search"
                  value={query}
                  placeholder="Order number or customer email"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <p className="text-[11px] text-[#071226]/45">
                {visible.length} matching order
                {visible.length === 1 ? "" : "s"}
              </p>
            </div>

            {orders === null ? (
              <div className="p-4">
                <LoadingState label="Loading orders…" />
              </div>
            ) : visible.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No matching orders"
                  description="Adjust your search or filter."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-xs">
                  <thead>
                    <tr className="border-b border-[#071226]/10 bg-[#071226]/[0.025] text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#071226]/8">
                    {visible.map((order) => (
                      <tr key={order.id} className="hover:bg-[#D5A125]/5">
                        <td className="px-3 py-2.5 font-medium text-[#071226]">
                          {order.orderNumber}
                        </td>
                        <td className="px-3 py-2.5 text-[#071226]/58">
                          {order.customerEmail}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-[#071226]">
                          {formatCurrency(
                            orderTotals(order).total,
                            order.currency,
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-3 py-2.5 text-[#071226]/45">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="outline" size="sm">
                              <Link
                                to="/orders/$id"
                                params={{ id: order.id }}
                              >
                                View
                              </Link>
                            </Button>
                            <CopyLinkButton
                              value={customerUrl(order.token)}
                              label="Copy link"
                            />
                            <Button asChild variant="ghost" size="icon">
                              <Link
                                to="/customer/$token"
                                params={{ token: order.token }}
                                target="_blank"
                                aria-label="Open customer form"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="space-y-3">
            <section className="rounded-md border border-[#071226]/10 bg-[#FAF7F4] p-3">
              <h2 className="text-[12px] font-semibold text-[#071226]">
                Filter by status
              </h2>
              <div className="mt-2 space-y-0.5">
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={filter === item.key}
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-xs font-medium",
                      filter === item.key
                        ? "border-[#D5A125] bg-[#D5A125]/12 text-[#071226]"
                        : "border-transparent text-[#071226]/60 hover:bg-[#071226]/4 hover:text-[#071226]",
                    )}
                  >
                    {item.label}
                    <span className="text-[10px]">
                      {item.key === "all"
                        ? orders?.length ?? 0
                        : orders?.filter((order) =>
                            GROUPS[item.key].includes(order.status),
                          ).length ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dark-surface rounded-md bg-[#071226] p-3 text-white">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                Visible order value
              </p>
              <p className="mt-2 text-xl font-semibold text-white tabular-nums">
                {formatCurrency(totalValue, currency)}
              </p>
              <p className="mt-1 text-[10px] text-white">
                Based on the current search and filter.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
