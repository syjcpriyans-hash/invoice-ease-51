import { createHash, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
};

type TurnstileOutcome = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export function getClientIp(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

function hashRateLimitKey(scope: string, identifier: string) {
  const salt =
    process.env.RATE_LIMIT_SALT ||
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "billantra-rate-limit";

  return createHash("sha256")
    .update(`${salt}:${scope}:${identifier}`)
    .digest("hex");
}

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowSeconds,
}: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitRow> {
  const admin = getSupabaseAdmin();
  const keyHash = hashRateLimitKey(scope, identifier);

  const { data, error } = await admin.rpc(
    "consume_api_rate_limit",
    {
      p_key_hash: keyHash,
      p_window_seconds: windowSeconds,
      p_limit: limit,
    },
  );

  if (error) {
    console.error("Rate limiter failed", error);
    throw new Error("The security rate limiter is unavailable.");
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as RateLimitRow | null;

  if (!row) {
    throw new Error("The security rate limiter returned no result.");
  }

  return row;
}

export function rateLimitResponse(
  retryAfterSeconds: number,
): Response {
  return Response.json(
    {
      error:
        "Too many requests. Please wait before trying again.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(Math.ceil(retryAfterSeconds), 1),
        ),
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function verifyTurnstile({
  request,
  token,
  expectedAction,
}: {
  request: Request;
  token: string;
  expectedAction:
    | "login"
    | "waitlist"
    | "customer_submit";
}): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured.");
    throw new Error(
      "Turnstile server configuration is missing.",
    );
  }

  if (!token || token.length > 2048) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: randomUUID(),
  });

  const clientIp = getClientIp(request);
  if (clientIp !== "unknown") {
    body.set("remoteip", clientIp);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body,
        signal: controller.signal,
        cache: "no-store",
      },
    );

    const outcome =
      (await response.json()) as TurnstileOutcome;

    if (!response.ok || !outcome.success) {
      console.warn(
        "Turnstile rejected a request",
        outcome["error-codes"] ?? [],
      );
      return false;
    }

    if (
      outcome.action &&
      outcome.action !== expectedAction
    ) {
      console.warn("Turnstile action mismatch", {
        expectedAction,
        receivedAction: outcome.action,
      });
      return false;
    }

    const allowedHostnames = (
      process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? ""
    )
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);

    if (
      allowedHostnames.length > 0 &&
      (!outcome.hostname ||
        !allowedHostnames.includes(
          outcome.hostname.toLowerCase(),
        ))
    ) {
      console.warn("Turnstile hostname mismatch", {
        hostname: outcome.hostname,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Turnstile validation failed", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
