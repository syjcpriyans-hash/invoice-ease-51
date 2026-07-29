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
      { title: "Invoices | Billantra" },
      {
        name: "description",
        content:
          "Invoice history and email-delivery status for every order.",
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
  const [retryingInvoiceId, setRetryingInvoiceId] =
    useState<string | null>(null);
  const [savingEmailInvoiceId, setSavingEmailInvoiceId] =
    useState<string | null>(null);

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
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load invoices",
        );
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not download invoice PDF",
      );
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
      await invoiceService.updateCustomerEmail(
        invoice.orderId,
        email,
      );
      await loadInvoices();
      toast.success(
        "Customer email updated. You can retry the invoice now.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update customer email.",
      );
    } finally {
      setSavingEmailInvoiceId(null);
    }
  }

  async function retryInvoiceEmail(invoice: Invoice) {
    setRetryingInvoiceId(invoice.id);

    try {
      const result = await invoiceService.processOrder(
        invoice.orderId,
      );
      await loadInvoices();

      if (result.emailStatus === "sent") {
        toast.success(
          `Invoice ${result.invoiceNumber} was sent again.`,
        );
      } else {
        toast.error(result.error || "Email retry failed.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Email retry failed.",
      );
    } finally {
      setRetryingInvoiceId(null);
    }
  }

  const delivered =
    invoices?.filter(
      (invoice) => invoice.emailStatus === "delivered",
    ).length ?? 0;
  const attention =
    invoices?.filter((invoice) =>
      ["failed", "bounced"].includes(invoice.emailStatus),
    ).length ?? 0;
  const totalValue =
    invoices?.reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;
  const currency = invoices?.[0]?.currency ?? "USD";

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Invoices"
          description="Invoice history, PDF access, and email-delivery status."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <section className="overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4]">
            {invoices === null ? (
              <div className="p-4">
                <LoadingState label="Loading invoices…" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No invoices yet"
                  description="Invoices appear after customers submit their billing information."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px] text-xs">
                  <thead>
                    <tr className="border-b border-[#071226]/10 bg-[#071226]/[0.025] text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#071226]/8">
                    {invoices.map((invoice) => {
                      const canRecover =
                        invoice.emailStatus === "failed" ||
                        invoice.emailStatus === "bounced";
                      const isRetrying =
                        retryingInvoiceId === invoice.id;
                      const isSavingEmail =
                        savingEmailInvoiceId === invoice.id;
                      const actionInProgress =
                        isRetrying || isSavingEmail;

                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-[#D5A125]/5"
                        >
                          <td className="px-3 py-2.5 font-medium text-[#071226]">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-3 py-2.5 text-[#071226]/55">
                            {invoice.orderNumber}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-[#071226]">
                              {invoice.customerName}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#071226]/45">
                              {invoice.customerEmail}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium tabular-nums text-[#071226]">
                            {formatCurrency(
                              invoice.amount,
                              invoice.currency,
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[#071226]/45">
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <EmailStatusBadge
                              status={invoice.emailStatus}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                              >
                                <Link
                                  to="/orders/$id"
                                  params={{
                                    id: invoice.orderId,
                                  }}
                                >
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!invoice.pdfPath}
                                onClick={() =>
                                  downloadInvoice(invoice)
                                }
                              >
                                PDF
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  !canRecover || actionInProgress
                                }
                                onClick={() =>
                                  editCustomerEmail(invoice)
                                }
                              >
                                {isSavingEmail
                                  ? "Saving…"
                                  : "Edit email"}
                              </Button>
                              <Button
                                variant={
                                  canRecover
                                    ? "secondary"
                                    : "ghost"
                                }
                                size="sm"
                                disabled={
                                  !canRecover || actionInProgress
                                }
                                onClick={() =>
                                  retryInvoiceEmail(invoice)
                                }
                              >
                                {isRetrying
                                  ? "Sending…"
                                  : "Retry"}
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
          </section>

          <aside className="space-y-3">
            <section className="dark-surface rounded-md bg-[#071226] p-3 text-white">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                Invoice value
              </p>
              <p className="mt-2 text-xl font-semibold text-white tabular-nums">
                {formatCurrency(totalValue, currency)}
              </p>
            </section>

            <section className="rounded-md border border-[#071226]/10 bg-[#FAF7F4] p-3">
              <h2 className="text-[12px] font-semibold text-[#071226]">
                Delivery summary
              </h2>
              <dl className="mt-2 divide-y divide-[#071226]/10 text-xs">
                <div className="flex justify-between py-2">
                  <dt className="text-[#071226]/55">Total invoices</dt>
                  <dd className="font-semibold text-[#071226]">
                    {invoices?.length ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#071226]/55">Delivered</dt>
                  <dd className="font-semibold text-[#071226]">
                    {delivered}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[#071226]/55">
                    Needs attention
                  </dt>
                  <dd className="font-semibold text-[#071226]">
                    {attention}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
