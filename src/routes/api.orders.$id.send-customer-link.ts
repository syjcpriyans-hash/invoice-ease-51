import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { sendCustomerLinkEmail } from "@/lib/server/customer-link-email";
import { captureServerError } from "@/lib/server/error-monitoring";

export const Route = createFileRoute(
  "/api/orders/$id/send-customer-link",
)({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let monitoringOwnerId: string | undefined;

        try {
          const authorization =
            request.headers.get("authorization");
          const accessToken =
            authorization?.startsWith("Bearer ")
              ? authorization.slice("Bearer ".length)
              : "";

          if (!accessToken) {
            return Response.json(
              { error: "Unauthorized" },
              { status: 401 },
            );
          }

          const admin = getSupabaseAdmin();
          const { data: authData, error: authError } =
            await admin.auth.getUser(accessToken);

          if (authError || !authData.user) {
            return Response.json(
              { error: "Unauthorized" },
              { status: 401 },
            );
          }

          monitoringOwnerId = authData.user.id;

          const { data: order, error: orderError } =
            await admin
              .from("orders")
              .select("id, owner_id")
              .eq("id", params.id)
              .single();

          if (orderError || !order) {
            return Response.json(
              { error: "Order not found" },
              { status: 404 },
            );
          }

          if (order.owner_id !== authData.user.id) {
            return Response.json(
              { error: "Forbidden" },
              { status: 403 },
            );
          }

          const result =
            await sendCustomerLinkEmail(order.id);

          if (result.emailStatus === "failed") {
            await captureServerError({
              ownerId: order.owner_id,
              error:
                result.error ||
                "Customer-link email returned a failed status.",
              route:
                "/api/orders/:id/send-customer-link",
              operation: "send_customer_link",
              statusCode: 502,
            });
          }

          return Response.json(result, {
            status:
              result.emailStatus === "sent"
                ? 200
                : 202,
          });
        } catch (error) {
          console.error(
            "Customer-link email request failed",
            error,
          );

          await captureServerError({
            ownerId: monitoringOwnerId,
            error,
            route:
              "/api/orders/:id/send-customer-link",
            operation: "send_customer_link",
            statusCode: 500,
          });

          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Could not send customer link.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
