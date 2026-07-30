import type {
  CustomerInformation,
  Order,
  OrderStatus,
} from "@/types";
import { supabase } from "@/lib/supabase";
import { calculateTotals } from "@/lib/format";
import { mapOrder } from "./mappers";

const ORDER_SELECT = `
  *,
  order_items(*),
  customer_information(*),
  order_timeline(*)
`;

async function currentUserId(): Promise<string> {
  const { data, error } =
    await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Please sign in to continue.");
  }

  return data.user.id;
}

export interface CreateOrderInput {
  orderNumber: string;
  customerEmail: string;
  currency: string;
  dueInDays: number;
  internalNotes?: string;
  items: Order["items"];
  discountType: Order["discountType"];
  discountValue: number;
  taxRate: number;
  shipping: number;
}

export const orderService = {
  async list(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(mapOrder);
  },

  async getById(
    id: string,
  ): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    return data ? mapOrder(data) : undefined;
  },

  async getByToken(
    token: string,
  ): Promise<Order | undefined> {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        token,
      )
    ) {
      return undefined;
    }

    const response = await fetch(
      `/api/customer-order/${encodeURIComponent(token)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const payload =
      (await response.json().catch(() => ({}))) as {
        order?: unknown;
        error?: string;
      };

    if (response.status === 404) return undefined;

    if (!response.ok) {
      throw new Error(
        payload.error || "Could not load this order.",
      );
    }

    return payload.order
      ? mapOrder(payload.order)
      : undefined;
  },

  async suggestOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();

    const { count, error } = await supabase
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (error) throw error;

    return `ORD-${year}-${String(
      (count ?? 0) + 1,
    ).padStart(4, "0")}`;
  },

  async create(
    input: CreateOrderInput,
  ): Promise<Order> {
    const ownerId = await currentUserId();
    const totals = calculateTotals(input);

    const { data: orderRow, error: orderError } =
      await supabase
        .from("orders")
        .insert({
          owner_id: ownerId,
          order_number: input.orderNumber.trim(),
          customer_email: input.customerEmail
            .trim()
            .toLowerCase(),
          currency: input.currency,
          due_in_days: input.dueInDays,
          internal_notes:
            input.internalNotes?.trim() ?? "",
          discount_type: input.discountType,
          discount_value: input.discountValue,
          tax_rate: input.taxRate,
          shipping: input.shipping,
          subtotal: totals.subtotal,
          discount_amount: totals.discount,
          tax_amount: totals.tax,
          total: totals.total,
          status: "link_created",
        })
        .select("*")
        .single();

    if (orderError) throw orderError;

    const itemRows = input.items.map(
      (item, position) => ({
        order_id: orderRow.id,
        description: item.description.trim(),
        sku: item.sku?.trim() ?? "",
        quantity: item.quantity,
        unit_price: item.unitPrice,
        taxable: item.taxable,
        line_total: Number(
          (item.quantity * item.unitPrice).toFixed(2),
        ),
        position,
      }),
    );

    const { error: itemsError } =
      await supabase
        .from("order_items")
        .insert(itemRows);

    if (itemsError) {
      await supabase
        .from("orders")
        .delete()
        .eq("id", orderRow.id);
      throw itemsError;
    }

    const { error: timelineError } =
      await supabase
        .from("order_timeline")
        .insert([
          {
            order_id: orderRow.id,
            status: "draft",
            note: "Order created.",
          },
          {
            order_id: orderRow.id,
            status: "link_created",
            note:
              "Customer information link generated.",
          },
        ]);

    if (timelineError) throw timelineError;

    const created =
      await orderService.getById(orderRow.id);

    if (!created) {
      throw new Error(
        "The order was created but could not be loaded.",
      );
    }

    return created;
  },

  async sendCustomerLink(id: string): Promise<{
    order: Order | undefined;
    emailStatus: "sent" | "failed";
    error?: string;
  }> {
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (
      sessionError ||
      !sessionData.session?.access_token
    ) {
      throw new Error(
        "Please sign in to send the customer link.",
      );
    }

    const response = await fetch(
      `/api/orders/${id}/send-customer-link`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      },
    );

    const payload =
      (await response.json().catch(() => ({}))) as {
        error?: string;
        emailStatus?: "sent" | "failed";
      };

    if (
      !response.ok &&
      response.status !== 202
    ) {
      throw new Error(
        payload.error ||
          "Could not send the customer link.",
      );
    }

    return {
      order: await orderService.getById(id),
      emailStatus:
        payload.emailStatus ?? "failed",
      error: payload.error,
    };
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<Order | undefined> {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    const { error: timelineError } =
      await supabase
        .from("order_timeline")
        .insert({
          order_id: id,
          status,
          note: note ?? "",
        });

    if (timelineError) throw timelineError;

    return orderService.getById(id);
  },

  async markFormOpened(token: string): Promise<void> {
    const response = await fetch(
      `/api/customer-order/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      },
    );

    const payload =
      (await response.json().catch(() => ({}))) as {
        error?: string;
      };

    if (!response.ok && response.status !== 429) {
      throw new Error(
        payload.error ||
          "Could not update this customer link.",
      );
    }
  },

  async submitCustomerInformation(
    token: string,
    info: CustomerInformation,
    turnstileToken: string,
  ): Promise<{
    invoiceNumber?: string;
    emailStatus?: "sent" | "failed";
    automationError?: string | null;
  }> {
    const response = await fetch(
      "/api/customer-submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          information: info,
          turnstileToken,
        }),
      },
    );

    const payload =
      (await response.json().catch(() => ({}))) as {
        error?: string;
        invoiceNumber?: string;
        emailStatus?: "sent" | "failed";
        automationError?: string | null;
      };

    if (!response.ok) {
      throw new Error(
        payload.error ||
          "Could not submit customer information.",
      );
    }

    return payload;
  },
};
