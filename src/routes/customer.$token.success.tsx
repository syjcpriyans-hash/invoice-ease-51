import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
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
      { title: "Information submitted | Billantra" },
      {
        name: "description",
        content:
          "Your billing information was submitted and your invoice is being prepared.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerSuccessPage,
});

function CustomerSuccessPage() {
  const { token } = Route.useParams();
  const [order, setOrder] = useState<Order | null | undefined>(
    undefined,
  );
  const [automation, setAutomation] = useState<{
    invoiceNumber?: string;
    emailStatus?: "sent" | "failed";
    automationError?: string | null;
  } | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(
      `invoice-ease-submission-${token}`,
    );

    if (saved) {
      try {
        setAutomation(JSON.parse(saved));
      } catch {
        setAutomation(null);
      }
    }

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
      <div className="min-h-screen bg-[#FAF7F4] p-6">
        <LoadingState />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-[#FAF7F4] p-6">
        <ErrorState
          title="This link is not valid"
          description="Please contact the seller for a new link."
        />
      </div>
    );
  }

  const totals = orderTotals(order);
  const failed = automation?.emailStatus === "failed";

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <CustomerHeader sellerName={order.sellerName ?? "Seller"} />

      <main className="mx-auto w-full max-w-4xl space-y-7 px-4 py-10 sm:px-6">
        <section
          className={
            failed
              ? "rounded-xl bg-[#071226] p-8 text-center text-[#FAF7F4]"
              : "rounded-xl bg-[#D5A125] p-8 text-center text-[#071226]"
          }
        >
          {failed ? (
            <AlertTriangle
              className="mx-auto h-10 w-10 text-[#D5A125]"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mx-auto h-10 w-10 text-[#071226]"
              aria-hidden="true"
            />
          )}

          <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.035em]">
            Your information has been submitted
          </h1>

          <dl className="mt-5 grid justify-center gap-1 text-sm">
            <div className="flex gap-2">
              <dt className={failed ? "text-[#FAF7F4]/58" : "text-[#071226]/58"}>
                Order number:
              </dt>
              <dd className="font-medium">{order.orderNumber}</dd>
            </div>
            <div className="flex gap-2">
              <dt className={failed ? "text-[#FAF7F4]/58" : "text-[#071226]/58"}>
                Customer email:
              </dt>
              <dd className="font-medium">
                {order.customerInformation?.email ??
                  order.customerEmail}
              </dd>
            </div>
          </dl>

          <p
            className={
              failed
                ? "mx-auto mt-5 max-w-lg text-sm leading-6 text-[#FAF7F4]/64"
                : "mx-auto mt-5 max-w-lg text-sm leading-6 text-[#071226]/68"
            }
          >
            {automation?.emailStatus === "sent"
              ? `Invoice ${automation.invoiceNumber ?? ""} has been generated and emailed to you.`
              : automation?.emailStatus === "failed"
                ? "Your billing details were recorded and the invoice was generated, but email delivery requires attention from the seller."
                : "Your billing details have been recorded and the invoice is being processed."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#071226]">
            Order summary
          </h2>
          <LockedOrderItems
            items={order.items}
            currency={order.currency}
          />
          <OrderSummary
            totals={totals}
            currency={order.currency}
            taxRate={order.taxRate}
          />
        </section>
      </main>
    </div>
  );
}
