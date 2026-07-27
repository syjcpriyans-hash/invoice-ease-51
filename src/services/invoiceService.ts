import type { Invoice } from "@/types";
import { supabase } from "@/lib/supabase";
import { mapInvoice } from "./mappers";

export const invoiceService = {
  async list(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, orders(order_number, customer_email, customer_information(email, legal_business_name))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapInvoice);
  },
};
