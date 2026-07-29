import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const Route = createFileRoute("/api/orders/$id/customer-email")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const authorization = request.headers.get("authorization");
          const accessToken = authorization?.startsWith("Bearer ")
            ? authorization.slice("Bearer ".length)
            : "";

          if (!accessToken) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const admin = getSupabaseAdmin();
          const { data: authData, error: authError } = await admin.auth.getUser(accessToken);

          if (authError || !authData.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const payload = requestSchema.parse(await request.json());
          const email = payload.email.toLowerCase();

          const { data: order, error: orderError } = await admin
            .from("orders")
            .select("id, owner_id, customer_email")
            .eq("id", params.id)
            .single();

          if (orderError || !order) {
            return Response.json({ error: "Order not found" }, { status: 404 });
          }

          if (order.owner_id !== authData.user.id) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }

          const { data: invoice, error: invoiceError } = await admin
            .from("invoices")
            .select("id, email_status")
            .eq("order_id", order.id)
            .maybeSingle();

          if (invoiceError) throw invoiceError;
          if (!invoice) {
            return Response.json({ error: "Invoice not found" }, { status: 404 });
          }

          if (!["failed", "bounced"].includes(invoice.email_status)) {
            return Response.json(
              { error: "Customer email can only be changed for failed or bounced invoices." },
              { status: 409 },
            );
          }

          const { data: customer, error: customerLoadError } = await admin
            .from("customer_information")
            .select("id, email")
            .eq("order_id", order.id)
            .maybeSingle();

          if (customerLoadError) throw customerLoadError;
          if (!customer) {
            return Response.json(
              { error: "Customer information has not been submitted." },
              { status: 400 },
            );
          }

          const previousCustomerEmail = customer.email;
          const previousOrderEmail = order.customer_email;

          const { error: customerUpdateError } = await admin
            .from("customer_information")
            .update({ email })
            .eq("id", customer.id);

          if (customerUpdateError) throw customerUpdateError;

          const { error: orderUpdateError } = await admin
            .from("orders")
            .update({ customer_email: email })
            .eq("id", order.id);

          if (orderUpdateError) {
            await admin
              .from("customer_information")
              .update({ email: previousCustomerEmail })
              .eq("id", customer.id);
            throw orderUpdateError;
          }

          const { error: timelineError } = await admin.from("order_timeline").insert({
            order_id: order.id,
            status: "failed",
            note: `Customer email corrected from ${previousOrderEmail} to ${email}.`,
          });

          if (timelineError) {
            console.error("Could not add customer email correction timeline event", timelineError);
          }

          return Response.json({ success: true, email });
        } catch (error) {
          console.error("Customer email update failed", error);

          if (error instanceof z.ZodError) {
            return Response.json(
              { error: "Enter a valid customer email address." },
              { status: 400 },
            );
          }

          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Could not update customer email.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
