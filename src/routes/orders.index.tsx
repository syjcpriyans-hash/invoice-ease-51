import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CopyLinkButton } from "@/components/copy-link-button";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderService } from "@/services/orderService";
import { customerUrl, formatCurrency, formatDate, orderTotals } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { RequireAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — InvoiceFlow" },
      { name: "description", content: "Search, filter and manage every order and its customer link." },
      { property: "og:title", content: "Orders — InvoiceFlow" },
      {
        property: "og:description",
        content: "Search, filter and manage every order and its customer link.",
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
  { key: "awaiting", label: "Awaiting Customer" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const GROUPS: Record<Exclude<FilterKey, "all">, OrderStatus[]> = {
  awaiting: ["draft", "link_created", "link_sent", "link_email_failed", "form_opened"],
  submitted: ["submitted"],
  completed: ["invoice_generating", "invoice_generated", "email_queued", "email_sent", "delivered"],
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
        toast.error(error instanceof Error ? error.message : "Could not load orders");
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const list = orders ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((order) => {
      const matchesQuery =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || GROUPS[filter].includes(order.status);
      return matchesQuery && matchesFilter;
    });
  }, [orders, query, filter]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Orders"
          description="Every order, its customer information link and current status."
          actions={
            <Button asChild size="sm">
              <Link to="/orders/new">Create Order</Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm space-y-1.5">
            <Label htmlFor="order-search">Search orders</Label>
            <Input
              id="order-search"
              value={query}
              placeholder="Order number or customer email"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {orders === null ? (
          <LoadingState label="Loading orders…" />
        ) : visible.length === 0 ? (
          <EmptyState title="No matching orders" description="Adjust your search or filters." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[860px] text-sm">
              <caption className="sr-only">Orders</caption>
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Order number</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer email</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.customerEmail}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(orderTotals(order).total, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/orders/$id" params={{ id: order.id }}>
                            View
                          </Link>
                        </Button>
                        <CopyLinkButton value={customerUrl(order.token)} label="Copy link" />
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/customer/$token" params={{ token: order.token }} target="_blank">
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            Open form
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
      </div>
    </AppShell>
  );
}