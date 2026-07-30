import { supabase } from "@/lib/supabase";

export type ClientErrorSeverity = "error" | "warning" | "info";

type ClientErrorContext = {
  severity?: ClientErrorSeverity;
  operation?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  source?: "client" | "manual";
};

const recentlyReported = new Map<string, number>();
const EMAIL_PATTERN =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TOKEN_PATTERN =
  /([?&](?:token|access_token|refresh_token|code|key|secret)=)[^&#\s]+/gi;

function sanitize(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(TOKEN_PATTERN, "$1[redacted]")
    .slice(0, maxLength);
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      errorType: error.name || "Error",
      message: sanitize(error.message || "Unknown error", 1200),
      stack: sanitize(error.stack || "", 8000),
    };
  }

  if (error instanceof Response) {
    return {
      errorType: "Response",
      message: `HTTP ${error.status}`,
      stack: "",
    };
  }

  return {
    errorType: "Error",
    message: sanitize(error, 1200),
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
      output[key.slice(0, 80)] = sanitize(value, 300);
    }
  }

  return output;
}

export async function reportAppError(
  error: unknown,
  context: ClientErrorContext = {},
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const normalized = normalizeError(error);
  const route = window.location.pathname;
  const operation = sanitize(context.operation ?? "", 160);
  const dedupeKey = [
    normalized.errorType,
    normalized.message,
    route,
    operation,
  ].join("|");
  const now = Date.now();
  const lastReported = recentlyReported.get(dedupeKey) ?? 0;

  if (now - lastReported < 10_000) return false;
  recentlyReported.set(dedupeKey, now);

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    const response = await fetch("/api/error-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },
      body: JSON.stringify({
        source: context.source ?? "client",
        severity: context.severity ?? "error",
        errorType: normalized.errorType,
        message: normalized.message,
        stack: normalized.stack,
        route,
        operation,
        statusCode: context.statusCode,
        userAgent: navigator.userAgent,
        metadata: safeMetadata(context.metadata),
      }),
      keepalive: true,
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function installGlobalErrorMonitoring(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onError = (event: ErrorEvent) => {
    void reportAppError(event.error ?? event.message, {
      operation: "window_error",
      metadata: {
        filename: event.filename || "",
        line: event.lineno || 0,
        column: event.colno || 0,
      },
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    void reportAppError(event.reason, {
      operation: "unhandled_promise_rejection",
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener(
    "unhandledrejection",
    onUnhandledRejection,
  );

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener(
      "unhandledrejection",
      onUnhandledRejection,
    );
  };
}
