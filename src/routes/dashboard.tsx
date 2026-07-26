import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, MailCheck, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/orderService";
import { invoiceService } from "@/services/invoiceService";
import { formatCurrency, formatDate, orderTotals } from "@/lib/format";
import { APP_CONFIG } from "@/config/app";
import type { Invoice, Order } from "@/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InvoiceFlow" },
      {
        name: "description",
        content: "Track orders awaiting customer information, submitted forms and generated invoices.",
      },
      { property: "og:title", content: "Dashboard — InvoiceFlow" },
      {
        property: "og:description",
        content: "Track orders awaiting customer information, submitted forms and generated invoices.",
      },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Send;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function DashboardPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setOrders(orderService.list());
    setInvoices(invoiceService.list());
  }, []);

  const awaiting = orders?.filter((o) => ["draft", "link_sent", "form_opened"].includes(o.status)).length ?? 0;
  const submitted = orders?.filter((o) => !!o.customerInformation).length ?? 0;
  const generated = invoices.length;
  const delivered = invoices.filter((i) => i.emailStatus === "delivered").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description={APP_CONFIG.description}
          actions={
            <Button asChild size="sm">
              <Link to="/orders/new">Create Order</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Orders awaiting customer information" value={awaiting} icon={Send} />
          <StatCard label="Forms submitted" value={submitted} icon={CheckCircle2} />
          <StatCard label="Invoices generated" value={generated} icon={FileText} />
          <StatCard label="Emails delivered" value={delivered} icon={MailCheck} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recent orders</h2>
          {orders === null ? (
            <LoadingState label="Loading orders…" />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Create your first order to generate a customer information link."
              action={
                <Button asChild size="sm">
                  <Link to="/orders/new">Create Order</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">Recent orders</caption>
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Order number</th>
                    <th scope="col" className="px-4 py-3 font-medium">Customer email</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Created</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 6).map((order) => (
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
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/orders/$id" params={{ id: order.id }}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}