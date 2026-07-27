import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { LockedOrderItems } from "@/components/locked-order-items";
import { OrderSummary } from "@/components/order-summary";
import { ErrorState, LoadingState } from "@/components/states";
import { CustomerHeader } from "./customer.$token.index";
import { orderService } from "@/services/orderService";
import { orderTotals } from "@/lib/format";
import type { Order } from "@/types";

export const Route = createFileRoute("/customer/$token/success")({
  head: () => ({
    meta: [
      { title: "Information submitted — InvoiceFlow" },
      { name: "description", content: "Your billing information was submitted and your invoice is being prepared." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerSuccessPage,
});

function CustomerSuccessPage() {
  const { token } = Route.useParams();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    orderService
      .getByToken(token)
      .then((data) => {
        if (active) setOrder(data ?? null);
      })
      .catch(() => {
        if (active) setOrder(null);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-background p-6">
        <LoadingState />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ErrorState title="This link is not valid" description="Please contact the seller for a new link." />
      </div>
    );
  }

  const totals = orderTotals(order);

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader sellerName={order.sellerName ?? "Seller"} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-8 text-center shadow-xs">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Your information has been submitted
          </h1>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Order number:</dt>
              <dd className="font-medium text-foreground">{order.orderNumber}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Customer email:</dt>
              <dd className="font-medium text-foreground">
                {order.customerInformation?.email ?? order.customerEmail}
              </dd>
            </div>
          </dl>
          <p className="max-w-md text-sm text-muted-foreground">
            Your billing details have been recorded. Automatic PDF generation and email delivery will be enabled in the next build step.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Order summary</h2>
          <LockedOrderItems items={order.items} currency={order.currency} />
          <OrderSummary totals={totals} currency={order.currency} taxRate={order.taxRate} />
        </section>
      </main>
    </div>
  );
}
