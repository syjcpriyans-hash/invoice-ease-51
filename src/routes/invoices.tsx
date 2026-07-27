import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmailStatusBadge } from "@/components/status-badge";
import { EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { invoiceService } from "@/services/invoiceService";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice } from "@/types";
import { RequireAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — InvoiceFlow" },
      { name: "description", content: "Invoice history with delivery status for every submitted order." },
      { property: "og:title", content: "Invoices — InvoiceFlow" },
      {
        property: "og:description",
        content: "Invoice history with delivery status for every submitted order.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <InvoicesPage />
    </RequireAuth>
  ),
});

function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    let active = true;
    invoiceService
      .list()
      .then((data) => {
        if (active) setInvoices(data);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load invoices");
        if (active) setInvoices([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Invoices will appear here after the automatic generation step is enabled."
        />

        {invoices === null ? (
          <LoadingState label="Loading invoices…" />
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Invoices appear once customers submit their billing information." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">Invoice history</caption>
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Invoice number</th>
                  <th scope="col" className="px-4 py-3 font-medium">Order number</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-4 py-3 font-medium">Invoice date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email status</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{invoice.orderNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{invoice.customerName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.invoiceDate)}</td>
                    <td className="px-4 py-3">
                      <EmailStatusBadge status={invoice.emailStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/orders/$id" params={{ id: invoice.orderId }}>
                            View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" disabled title="Available once the backend is connected">
                          Download PDF
                        </Button>
                        <Button variant="ghost" size="sm" disabled title="Available once the backend is connected">
                          Resend Email
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