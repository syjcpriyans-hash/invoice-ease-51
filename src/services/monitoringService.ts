import { supabase } from "@/lib/supabase";
import { reportAppError } from "@/lib/error-monitoring";

export type AppErrorEvent = {
  id: string;
  source: "client" | "server" | "manual";
  severity: "error" | "warning" | "info";
  error_type: string;
  message: string;
  route: string;
  operation: string;
  status_code: number | null;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  environment: string;
  release: string | null;
};

async function accessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    throw new Error("Please sign in to view monitoring.");
  }

  return data.session.access_token;
}

export const monitoringService = {
  async list(): Promise<AppErrorEvent[]> {
    const token = await accessToken();
    const response = await fetch("/api/error-events", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const payload = (await response.json().catch(() => ({}))) as {
      events?: AppErrorEvent[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.error || "Could not load monitoring data.",
      );
    }

    return payload.events ?? [];
  },

  async setResolved(id: string, resolved: boolean): Promise<void> {
    const token = await accessToken();
    const response = await fetch("/api/error-events", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, resolved }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.error || "Could not update this event.",
      );
    }
  },

  async createTestEvent(): Promise<boolean> {
    return reportAppError(
      new Error("Billantra monitoring test event"),
      {
        source: "manual",
        severity: "warning",
        operation: "manual_monitoring_test",
      },
    );
  },
};
