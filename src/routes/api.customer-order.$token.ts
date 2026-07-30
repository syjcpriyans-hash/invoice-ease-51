import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { captureServerError } from "@/lib/server/error-monitoring";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/server/security";

const tokenSchema = z.string().uuid();

export const Route = createFileRoute(
  "/api/customer-order/$token",
)({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const token = tokenSchema.parse(params.token);
          const clientIp = getClientIp(request);

          const ipLimit = await consumeRateLimit({
            scope: "customer-order-read-ip",
            identifier: clientIp,
            limit: 60,
            windowSeconds: 10 * 60,
          });

          if (!ipLimit.allowed) {
            return rateLimitResponse(
              ipLimit.retry_after_seconds,
            );
          }

          const tokenLimit = await consumeRateLimit({
            scope: "customer-order-read-token",
            identifier: token,
            limit: 120,
            windowSeconds: 60 * 60,
          });

          if (!tokenLimit.allowed) {
            return rateLimitResponse(
              tokenLimit.retry_after_seconds,
            );
          }

          const admin = getSupabaseAdmin();
          const { data, error } = await admin.rpc(
            "get_public_order",
            {
              p_token: token,
            },
          );

          if (error) throw error;

          if (!data) {
            return Response.json(
              { error: "This customer link is invalid." },
              {
                status: 404,
                headers: { "Cache-Control": "no-store" },
              },
            );
          }

          return Response.json(
            { order: data },
            {
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (error) {
          console.error(
            "Public customer order lookup failed",
            error,
          );

          if (error instanceof z.ZodError) {
            return Response.json(
              { error: "This customer link is invalid." },
              { status: 404 },
            );
          }

          await captureServerError({
            error,
            route: "/api/customer-order/:token",
            operation: "load_customer_order",
            statusCode: 500,
          });

          return Response.json(
            { error: "Could not load this order." },
            { status: 500 },
          );
        }
      },

      POST: async ({ request, params }) => {
        try {
          const token = tokenSchema.parse(params.token);
          const clientIp = getClientIp(request);

          const ipLimit = await consumeRateLimit({
            scope: "customer-order-open-ip",
            identifier: clientIp,
            limit: 20,
            windowSeconds: 10 * 60,
          });

          if (!ipLimit.allowed) {
            return rateLimitResponse(
              ipLimit.retry_after_seconds,
            );
          }

          const admin = getSupabaseAdmin();
          const { error } = await admin.rpc(
            "mark_public_order_opened",
            {
              p_token: token,
            },
          );

          if (error) throw error;

          return Response.json(
            { success: true },
            {
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (error) {
          console.error(
            "Public customer order open event failed",
            error,
          );

          if (error instanceof z.ZodError) {
            return Response.json(
              { error: "This customer link is invalid." },
              { status: 404 },
            );
          }

          await captureServerError({
            error,
            route: "/api/customer-order/:token",
            operation: "mark_customer_form_opened",
            statusCode: 500,
          });

          return Response.json(
            { error: "Could not update this order." },
            { status: 500 },
          );
        }
      },
    },
  },
});
