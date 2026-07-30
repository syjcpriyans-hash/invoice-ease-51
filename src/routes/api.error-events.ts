import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import {
  recordErrorEvent,
} from "@/lib/server/error-monitoring";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/server/security";

const eventSchema = z.object({
  source: z.enum(["client", "manual"]).default("client"),
  severity: z
    .enum(["error", "warning", "info"])
    .default("error"),
  errorType: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1200),
  stack: z.string().max(8000).optional().default(""),
  route: z.string().max(500).optional().default(""),
  operation: z.string().max(160).optional().default(""),
  statusCode: z.number().int().min(100).max(599).optional(),
  userAgent: z.string().max(500).optional().default(""),
  metadata: z.record(z.unknown()).optional().default({}),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  resolved: z.boolean(),
});

async function authenticatedUser(
  request: Request,
): Promise<{ id: string } | null> {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!accessToken) return null;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(accessToken);

  if (error || !data.user) return null;
  return { id: data.user.id };
}

export const Route = createFileRoute("/api/error-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const clientIp = getClientIp(request);
          const rateLimit = await consumeRateLimit({
            scope: "error-event-ip",
            identifier: clientIp,
            limit: 40,
            windowSeconds: 60 * 60,
          });

          if (!rateLimit.allowed) {
            return rateLimitResponse(
              rateLimit.retry_after_seconds,
            );
          }

          const payload = eventSchema.parse(
            await request.json(),
          );
          const user = await authenticatedUser(request);

          const id = await recordErrorEvent({
            ownerId: user?.id,
            source: payload.source,
            severity: payload.severity,
            error: Object.assign(
              new Error(payload.message),
              {
                name: payload.errorType,
                stack: payload.stack || undefined,
              },
            ),
            route: payload.route,
            operation: payload.operation,
            statusCode: payload.statusCode,
            userAgent: payload.userAgent,
            metadata: payload.metadata,
          });

          return Response.json(
            { accepted: true, id },
            {
              status: 202,
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Response.json(
              { error: "Invalid monitoring event." },
              { status: 400 },
            );
          }

          console.error("Error-event intake failed", error);
          return Response.json(
            { accepted: false },
            { status: 202 },
          );
        }
      },

      GET: async ({ request }) => {
        const user = await authenticatedUser(request);

        if (!user) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }

        const admin = getSupabaseAdmin();
        const { data, error } = await admin
          .from("app_error_events")
          .select(
            "id, source, severity, error_type, message, route, operation, status_code, occurrences, first_seen_at, last_seen_at, resolved_at, environment, release",
          )
          .eq("owner_id", user.id)
          .order("last_seen_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("Could not load error events", error);
          return Response.json(
            { error: "Could not load monitoring data." },
            { status: 500 },
          );
        }

        return Response.json(
          { events: data ?? [] },
          {
            headers: { "Cache-Control": "no-store" },
          },
        );
      },

      PATCH: async ({ request }) => {
        const user = await authenticatedUser(request);

        if (!user) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }

        try {
          const payload = updateSchema.parse(
            await request.json(),
          );
          const admin = getSupabaseAdmin();
          const { data, error } = await admin
            .from("app_error_events")
            .update({
              resolved_at: payload.resolved
                ? new Date().toISOString()
                : null,
            })
            .eq("id", payload.id)
            .eq("owner_id", user.id)
            .select("id")
            .maybeSingle();

          if (error) throw error;

          if (!data) {
            return Response.json(
              { error: "Event not found." },
              { status: 404 },
            );
          }

          return Response.json({ success: true });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Response.json(
              { error: "Invalid request." },
              { status: 400 },
            );
          }

          console.error("Could not update error event", error);
          return Response.json(
            { error: "Could not update this event." },
            { status: 500 },
          );
        }
      },
    },
  },
});
