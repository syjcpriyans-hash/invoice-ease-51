import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
  verifyTurnstile,
} from "@/lib/server/security";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().max(150).optional(),
  companyName: z.string().trim().max(200).optional(),
  role: z.string().trim().max(100).optional(),
  turnstileToken: z.string().min(1).max(2048),
});

export const Route = createFileRoute("/api/waitlist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = requestSchema.parse(
            await request.json(),
          );
          const clientIp = getClientIp(request);

          const ipLimit = await consumeRateLimit({
            scope: "waitlist-ip",
            identifier: clientIp,
            limit: 10,
            windowSeconds: 60 * 60,
          });

          if (!ipLimit.allowed) {
            return rateLimitResponse(
              ipLimit.retry_after_seconds,
            );
          }

          const turnstileValid = await verifyTurnstile({
            request,
            token: payload.turnstileToken,
            expectedAction: "waitlist",
          });

          if (!turnstileValid) {
            return Response.json(
              {
                error:
                  "Security verification failed. Please try again.",
              },
              {
                status: 403,
                headers: { "Cache-Control": "no-store" },
              },
            );
          }

          const normalizedEmail =
            payload.email.toLowerCase();

          const emailLimit = await consumeRateLimit({
            scope: "waitlist-email",
            identifier: normalizedEmail,
            limit: 5,
            windowSeconds: 24 * 60 * 60,
          });

          if (!emailLimit.allowed) {
            return rateLimitResponse(
              emailLimit.retry_after_seconds,
            );
          }

          const admin = getSupabaseAdmin();
          const { error } = await admin
            .from("waitlist_signups")
            .insert({
              email: normalizedEmail,
              full_name: payload.fullName?.trim() || null,
              company_name:
                payload.companyName?.trim() || null,
              role: payload.role?.trim() || null,
            });

          if (!error) {
            return Response.json({
              status: "joined",
            });
          }

          if (
            (error as { code?: string }).code === "23505"
          ) {
            return Response.json({
              status: "already_joined",
            });
          }

          throw error;
        } catch (error) {
          console.error("Waitlist submission failed", error);

          if (error instanceof z.ZodError) {
            return Response.json(
              {
                error:
                  "Enter a valid work email and complete security verification.",
              },
              { status: 400 },
            );
          }

          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Could not submit the request.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
