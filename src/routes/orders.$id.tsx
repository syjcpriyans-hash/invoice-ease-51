import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CopyLinkButton } from "@/components/copy-link-button";
import { LockedOrderItems } from "@/components/locked-order-items";
import { OrderSummary } from "@/components/order-summary";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/orderService";
import { customerUrl, formatDateTime, orderTotals, ORDER_STATUS_LABELS } from "@/lib/format";
import type { Order } from "@/types";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details — InvoiceFlow" },
      { name: "description", content: "Review a locked order, its status timeline and customer information." },
      { property: "og:title", content: "Order details — InvoiceFlow" },
      {
        property: "og:description",
        content: "Review a locked order, its status timeline and customer information.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrderDetailsPage />
    </RequireAuth>
  ),
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

function OrderDetailsPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    orderService
      .getById(id)
      .then((data) => {
        if (active) setOrder(data ?? null);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load the order");
        if (active) setOrder(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (order === undefined) {
    return (
      <AppShell>
        <LoadingState label="Loading order…" />
      </AppShell>
    );
  }

  if (order === null) {
    return (
      <AppShell>
        <ErrorState
          title="Order not found"
          description="This order could not be found in the database."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">Back to orders</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const totals = orderTotals(order);
  const link = customerUrl(order.token);
  const info = order.customerInformation;

  async function markDraft() {
    if (!order) return;
    try {
      const updated = await orderService.updateStatus(order.id, "draft", "Manually reset to draft.");
      if (updated) {
        setOrder(updated);
        toast.success("Order marked as draft");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={order.orderNumber}
          description={order.customerEmail}
          actions={
            <>
              <CopyLinkButton value={link} />
              <Button asChild variant="outline" size="sm">
                <Link to="/customer/$token" params={{ token: order.token }} target="_blank">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open Customer Form
                </Link>
              </Button>
              <Button variant="secondary" size="sm" onClick={markDraft}>
                Mark as Draft
              </Button>
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-sm text-muted-foreground">
            Updated {formatDateTime(order.updatedAt)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Locked line items</h2>
              <LockedOrderItems items={order.items} currency={order.currency} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Customer information</h2>
              {info ? (
                <dl className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-xs sm:grid-cols-2">
                  <Field label="Contact" value={info.fullName} />
                  <Field label="Email" value={info.email} />
                  <Field label="Phone" value={info.phone} />
                  <Field label="Legal business name" value={info.legalBusinessName} />
                  <Field label="Operating name" value={info.operatingName ?? ""} />
                  <Field label="PO number" value={info.poNumber ?? ""} />
                  <Field
                    label="Billing address"
                    value={[
                      info.billingAddress.line1,
                      info.billingAddress.line2,
                      `${info.billingAddress.city}, ${info.billingAddress.region} ${info.billingAddress.postalCode}`,
                      info.billingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Field
                    label="Shipping address"
                    value={[
                      info.shippingAddress.line1,
                      info.shippingAddress.line2,
                      `${info.shippingAddress.city}, ${info.shippingAddress.region} ${info.shippingAddress.postalCode}`,
                      info.shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Field label="Submitted" value={formatDateTime(info.submittedAt)} />
                </dl>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                  Waiting for the customer to submit their billing information.
                </p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <OrderSummary totals={totals} currency={order.currency} taxRate={order.taxRate} />

            <section className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-foreground">Customer link</h2>
              <p className="break-all rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-foreground">
                {link}
              </p>
              <div className="flex flex-wrap gap-2">
                <CopyLinkButton value={link} label="Copy Customer Link" />
                <Button asChild variant="outline" size="sm">
                  <Link to="/customer/$token" params={{ token: order.token }} target="_blank">
                    Open Customer Form
                  </Link>
                </Button>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-foreground">Status timeline</h2>
              <ol className="space-y-4">
                {order.timeline.map((event, index) => (
                  <li key={`${event.status}-${index}`} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {ORDER_STATUS_LABELS[event.status]}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                      {event.note ? (
                        <p className="text-xs text-muted-foreground">{event.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {order.internalNotes ? (
              <section className="space-y-2 rounded-lg border border-border bg-card p-5 shadow-xs">
                <h2 className="text-sm font-semibold text-foreground">Internal notes</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {order.internalNotes}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}