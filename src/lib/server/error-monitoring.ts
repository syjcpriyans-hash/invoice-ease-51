import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export type ErrorSeverity = "error" | "warning" | "info";
export type ErrorSource = "client" | "server" | "manual";

type RecordErrorInput = {
  ownerId?: string | null;
  source: ErrorSource;
  severity?: ErrorSeverity;
  error: unknown;
  route?: string;
  operation?: string;
  statusCode?: number;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

const EMAIL_PATTERN =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TOKEN_PATTERN =
  /([?&](?:token|access_token|refresh_token|code|key|secret)=)[^&#\s]+/gi;

function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(TOKEN_PATTERN, "$1[redacted]")
    .slice(0, maxLength);
}

function errorDetails(error: unknown) {
  if (error instanceof Response) {
    return {
      type: "Response",
      message: `HTTP ${error.status}`,
      stack: "",
    };
  }

  if (error instanceof Error) {
    return {
      type: error.name || "Error",
      message: error.message || "Unknown error",
      stack: error.stack || "",
    };
  }

  return {
    type: "Error",
    message: String(error ?? "Unknown error"),
    stack: "",
  };
}

function safeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> {
  const output: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata ?? {}).slice(0, 12)) {
    if (
      value === null ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      output[key.slice(0, 80)] = value;
    } else if (typeof value === "string") {
      output[key.slice(0, 80)] = sanitizeText(value, 300);
    }
  }

  return output;
}

function validOwnerId(value: string | undefined | null): string | null {
  if (
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return value;
  }

  return null;
}

export async function recordErrorEvent(
  input: RecordErrorInput,
): Promise<string | null> {
  const ownerId =
    validOwnerId(input.ownerId) ||
    validOwnerId(process.env.MONITORING_OWNER_ID);

  if (!ownerId) {
    console.warn(
      "Error event was not stored because MONITORING_OWNER_ID is missing.",
    );
    return null;
  }

  const details = errorDetails(input.error);
  const message = sanitizeText(details.message, 1200);
  const route = sanitizeText(input.route ?? "", 500).split("?")[0];
  const operation = sanitizeText(input.operation ?? "", 160);
  const stack = sanitizeText(details.stack, 8000);

  const fingerprint = createHash("sha256")
    .update(
      [
        input.source,
        details.type,
        message,
        route,
        operation,
        input.statusCode ?? "",
      ].join("|"),
    )
    .digest("hex");

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("record_app_error_event", {
    p_owner_id: ownerId,
    p_fingerprint: fingerprint,
    p_source: input.source,
    p_severity: input.severity ?? "error",
    p_error_type: sanitizeText(details.type, 120),
    p_message: message,
    p_route: route,
    p_operation: operation,
    p_status_code: input.statusCode ?? null,
    p_stack: stack || null,
    p_user_agent: sanitizeText(input.userAgent ?? "", 500) || null,
    p_release:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      null,
    p_environment:
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      "production",
    p_metadata: safeMetadata(input.metadata),
  });

  if (error) {
    console.error("Could not store application error event", error);
    return null;
  }

  return typeof data === "string" ? data : null;
}

export async function captureServerError(
  input: Omit<RecordErrorInput, "source">,
): Promise<void> {
  try {
    await recordErrorEvent({
      ...input,
      source: "server",
    });
  } catch (monitoringError) {
    console.error("Server error monitoring failed", monitoringError);
  }
}
