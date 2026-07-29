import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  MailCheck,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/orderService";
import { invoiceService } from "@/services/invoiceService";
import {
  formatCurrency,
  formatDate,
  orderTotals,
} from "@/lib/format";
import type { Invoice, Order } from "@/types";
import { RequireAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview | Billantra" },
      {
        name: "description",
        content:
          "Monitor orders, customer submissions, invoices, and email delivery in Billantra.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
          {label}
        </p>
        <p className="mt-1 text-[24px] font-semibold tracking-[-0.035em] text-[#071226] tabular-nums">
          {value}
        </p>
      </div>
      <Icon className="h-4 w-4 text-[#D5A125]" />
    </div>
  );
}

function DashboardPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([orderService.list(), invoiceService.list()])
      .then(([nextOrders, nextInvoices]) => {
        if (!active) return;
        setOrders(nextOrders);
        setInvoices(nextInvoices);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load dashboard data",
        );
        setOrders([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const awaiting =
    orders?.filter((order) =>
      [
        "draft",
        "link_created",
        "link_sent",
        "link_email_failed",
        "form_opened",
      ].includes(order.status),
    ).length ?? 0;
  const submitted =
    orders?.filter((order) => !!order.customerInformation).length ?? 0;
  const generated = invoices.length;
  const delivered = invoices.filter(
    (invoice) => invoice.emailStatus === "delivered",
  ).length;
  const totalValue =
    orders?.reduce(
      (sum, order) => sum + orderTotals(order).total,
      0,
    ) ?? 0;
  const primaryCurrency = orders?.[0]?.currency ?? "USD";

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
              Operations overview
            </p>
            <h1 className="mt-1.5 text-[25px] font-semibold tracking-[-0.04em] text-[#071226]">
              Invoice workflow
            </h1>
            <p className="mt-1 text-[13px] text-[#071226]/54">
              Customer intake, invoice generation, and delivery status.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/orders/new">
              <Plus className="h-3.5 w-3.5" />
              Create order
            </Link>
          </Button>
        </div>

        <div className="grid overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4] sm:grid-cols-2 xl:grid-cols-4">
          <div className="border-b border-[#071226]/10 sm:border-r xl:border-b-0">
            <Metric label="Awaiting customer" value={awaiting} icon={Clock3} />
          </div>
          <div className="border-b border-[#071226]/10 xl:border-b-0 xl:border-r">
            <Metric
              label="Forms submitted"
              value={submitted}
              icon={CheckCircle2}
            />
          </div>
          <div className="border-b border-[#071226]/10 sm:border-r sm:border-b-0">
            <Metric
              label="Invoices generated"
              value={generated}
              icon={FileText}
            />
          </div>
          <Metric
            label="Emails delivered"
            value={delivered}
            icon={MailCheck}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4]">
            <div className="flex items-center justify-between border-b border-[#071226]/10 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-[#071226]">
                  Recent orders
                </h2>
                <p className="text-[11px] text-[#071226]/45">
                  Latest workspace activity
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/orders">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {orders === null ? (
              <div className="p-4">
                <LoadingState label="Loading orders…" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No orders yet"
                  description="Create your first order to start the Billantra workflow."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-xs">
                  <thead>
                    <tr className="border-b border-[#071226]/10 bg-[#071226]/[0.025] text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#071226]/8">
                    {orders.slice(0, 9).map((order) => (
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
                        <td className="px-3 py-2.5 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              to="/orders/$id"
                              params={{ id: order.id }}
                            >
                              Open
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

          <aside className="space-y-3">
            <section className="dark-surface rounded-md bg-[#071226] p-4 text-white">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                Recorded order value
              </p>
              <p className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-white tabular-nums">
                {formatCurrency(totalValue, primaryCurrency)}
              </p>
              <div className="mt-4 border-t border-white/18 pt-3">
                <div className="flex items-center justify-between text-[11px] text-white">
                  <span className="text-white">Total orders</span>
                  <strong className="text-white">{orders?.length ?? 0}</strong>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-[#071226]/10 bg-[#FAF7F4] p-3">
              <h2 className="text-[12px] font-semibold text-[#071226]">
                Quick actions
              </h2>
              <div className="mt-2 divide-y divide-[#071226]/10">
                <Link
                  to="/orders/new"
                  className="flex items-center justify-between py-2.5 text-xs font-medium text-[#071226]"
                >
                  Create an order
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/invoices"
                  className="flex items-center justify-between py-2.5 text-xs font-medium text-[#071226]"
                >
                  Review invoices
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
