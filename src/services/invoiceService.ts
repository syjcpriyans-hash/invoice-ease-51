import type { Invoice } from "@/types";
import { supabase } from "@/lib/supabase";
import { mapInvoice } from "./mappers";

async function getAccessToken(message: string): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error(message);
  return data.session.access_token;
}

export const invoiceService = {
  async list(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, orders(order_number, customer_email, customer_information(email, legal_business_name))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  },

  async downloadPdf(invoice: Invoice): Promise<void> {
    const accessToken = await getAccessToken("Please sign in to download invoices.");

    const response = await fetch(`/api/invoices/${invoice.id}/download`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error((await response.text()) || "Could not download the invoice PDF.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  async updateCustomerEmail(orderId: string, email: string): Promise<void> {
    const accessToken = await getAccessToken("Please sign in to update customer information.");

    const response = await fetch(`/api/orders/${orderId}/customer-email`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error || "Could not update customer email.");
    }
  },

  async processOrder(orderId: string): Promise<{
    invoiceNumber: string;
    emailStatus: "sent" | "failed";
    error?: string;
  }> {
    const accessToken = await getAccessToken("Please sign in to process invoices.");

    const response = await fetch(`/api/orders/${orderId}/process-invoice`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = (await response.json().catch(() => ({}))) as {
      invoiceNumber?: string;
      emailStatus?: "sent" | "failed";
      error?: string;
    };
    if (!response.ok && response.status !== 202) {
      throw new Error(payload.error || "Could not process the invoice.");
    }
    return {
      invoiceNumber: payload.invoiceNumber ?? "",
      emailStatus: payload.emailStatus ?? "failed",
      error: payload.error,
    };
  },
};
