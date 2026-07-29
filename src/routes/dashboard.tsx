import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  MailCheck,
  Plus,
  Receipt,
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

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Receipt;
}) {
  return (
    <div className="rounded-xl border border-[#071226]/10 bg-[#FAF7F4] p-5 shadow-[0_1px_2px_rgba(7,18,38,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#071226]/56">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[#071226] tabular-nums">
            {value}
          </p>
        </div>

        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D5A125]/35 bg-[#D5A125]/10 text-[#071226]">
          <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </span>
      </div>

      <p className="mt-4 text-xs text-[#071226]/42">{helper}</p>
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
      <div className="space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
              Operations overview
            </p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#071226]">
              Your invoice workflow
            </h1>
            <p className="mt-1.5 text-sm text-[#071226]/56">
              Monitor customer intake, invoice generation, and email delivery.
            </p>
          </div>

          <Button asChild className="h-10 rounded-lg px-4">
            <Link to="/orders/new">
              <Plus className="h-4 w-4" />
              Create order
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Awaiting customer"
            value={awaiting}
            helper="Orders still requiring action"
            icon={Clock3}
          />
          <MetricCard
            label="Forms submitted"
            value={submitted}
            helper="Customer details received"
            icon={CheckCircle2}
          />
          <MetricCard
            label="Invoices generated"
            value={generated}
            helper="Invoice records created"
            icon={FileText}
          />
          <MetricCard
            label="Emails delivered"
            value={delivered}
            helper="Confirmed by the email provider"
            icon={MailCheck}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-xl border border-[#071226]/10 bg-[#FAF7F4] shadow-[0_1px_2px_rgba(7,18,38,0.04)]">
            <div className="flex items-center justify-between border-b border-[#071226]/10 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#071226]">
                  Recent orders
                </h2>
                <p className="mt-0.5 text-xs text-[#071226]/42">
                  Latest activity across your workspace
                </p>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-[#071226]"
              >
                <Link to="/orders">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {orders === null ? (
              <div className="p-6">
                <LoadingState label="Loading orders…" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No orders yet"
                  description="Create your first order to start the Billantra workflow."
                  action={
                    <Button asChild size="sm">
                      <Link to="/orders/new">Create order</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-[#071226]/10 bg-[#071226]/[0.035] text-left text-[10px] font-semibold uppercase tracking-[0.09em] text-[#071226]/42">
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3 text-right">Value</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3 text-right"> </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#071226]/10">
                    {orders.slice(0, 7).map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-[#D5A125]/[0.055]"
                      >
                        <td className="px-5 py-4 font-medium text-[#071226]">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-4 text-[#071226]/56">
                          {order.customerEmail}
                        </td>
                        <td className="px-5 py-4 text-right font-medium tabular-nums text-[#071226]">
                          {formatCurrency(
                            orderTotals(order).total,
                            order.currency,
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-4 text-[#071226]/42">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
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

          <aside className="space-y-5">
            <div className="rounded-xl bg-[#071226] p-5 text-[#FAF7F4]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
                Recorded order value
              </p>
              <p className="mt-3 text-[28px] font-semibold tracking-[-0.04em] tabular-nums">
                {formatCurrency(totalValue, primaryCurrency)}
              </p>
              <p className="mt-1 text-xs text-[#FAF7F4]/48">
                Across all orders in this workspace
              </p>

              <div className="mt-5 h-px bg-[#FAF7F4]/10" />

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[#FAF7F4]/48">Total orders</span>
                <span className="font-semibold">
                  {orders?.length ?? 0}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#071226]/10 bg-[#FAF7F4] p-5">
              <h2 className="text-sm font-semibold text-[#071226]">
                Quick actions
              </h2>

              <div className="mt-4 space-y-2">
                <Link
                  to="/orders/new"
                  className="flex items-center justify-between rounded-lg border border-[#071226]/12 px-3 py-3 text-sm font-medium text-[#071226] hover:border-[#D5A125] hover:bg-[#D5A125]/10"
                >
                  Create a new order
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/invoices"
                  className="flex items-center justify-between rounded-lg border border-[#071226]/12 px-3 py-3 text-sm font-medium text-[#071226] hover:border-[#D5A125] hover:bg-[#D5A125]/10"
                >
                  Review invoices
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
