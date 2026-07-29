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
      {
        name: "description",
        content: "Invoice history with delivery status for every submitted order.",
      },
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
  const [retryingInvoiceId, setRetryingInvoiceId] = useState<string | null>(null);
  const [savingEmailInvoiceId, setSavingEmailInvoiceId] = useState<string | null>(null);

  async function loadInvoices() {
    const data = await invoiceService.list();
    setInvoices(data);
  }

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

  async function downloadInvoice(invoice: Invoice) {
    try {
      await invoiceService.downloadPdf(invoice);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download invoice PDF");
    }
  }

  async function editCustomerEmail(invoice: Invoice) {
    const enteredEmail = window.prompt(
      "Enter the corrected customer email address:",
      invoice.customerEmail,
    );

    if (enteredEmail === null) return;

    const email = enteredEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Customer email is required.");
      return;
    }

    setSavingEmailInvoiceId(invoice.id);

    try {
      await invoiceService.updateCustomerEmail(invoice.orderId, email);
      await loadInvoices();
      toast.success("Customer email updated. You can retry the invoice now.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update customer email.");
    } finally {
      setSavingEmailInvoiceId(null);
    }
  }

  async function retryInvoiceEmail(invoice: Invoice) {
    setRetryingInvoiceId(invoice.id);

    try {
      const result = await invoiceService.processOrder(invoice.orderId);
      await loadInvoices();

      if (result.emailStatus === "sent") {
        toast.success(`Invoice ${result.invoiceNumber} was sent again.`);
      } else {
        toast.error(result.error || "Email retry failed.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email retry failed.");
    } finally {
      setRetryingInvoiceId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Invoice history and email-delivery status."
        />

        {invoices === null ? (
          <LoadingState label="Loading invoices…" />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Invoices appear once customers submit their billing information."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[980px] text-sm">
              <caption className="sr-only">Invoice history</caption>
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Invoice number
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Order number
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Invoice date
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Email status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => {
                  const canRecover =
                    invoice.emailStatus === "failed" ||
                    invoice.emailStatus === "bounced";
                  const isRetrying = retryingInvoiceId === invoice.id;
                  const isSavingEmail = savingEmailInvoiceId === invoice.id;
                  const actionInProgress = isRetrying || isSavingEmail;

                  return (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {invoice.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{invoice.customerName}</div>
                        <div className="text-xs">{invoice.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(invoice.invoiceDate)}
                      </td>
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

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!invoice.pdfPath}
                            title={
                              invoice.pdfPath
                                ? "Download invoice PDF"
                                : "PDF is not available yet"
                            }
                            onClick={() => downloadInvoice(invoice)}
                          >
                            Download PDF
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canRecover || actionInProgress}
                            title={
                              canRecover
                                ? "Correct the customer email address"
                                : "Email editing is available for failed or bounced invoices"
                            }
                            onClick={() => editCustomerEmail(invoice)}
                          >
                            {isSavingEmail ? "Saving…" : "Edit Email"}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canRecover || actionInProgress}
                            title={
                              canRecover
                                ? "Retry sending this invoice email"
                                : "Retry is available only for failed or bounced emails"
                            }
                            onClick={() => retryInvoiceEmail(invoice)}
                          >
                            {isRetrying ? "Sending…" : "Retry Email"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
