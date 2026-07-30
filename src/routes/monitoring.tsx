import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  MonitorCog,
  RefreshCw,
  Server,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/states";
import {
  monitoringService,
  type AppErrorEvent,
} from "@/services/monitoringService";
import { RequireAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "System Health | Billantra" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MonitoringPage />
    </RequireAuth>
  ),
});

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[#071226]/42">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-[#071226]">
          {value}
        </p>
      </div>
      <Icon className="h-4 w-4 text-[#D5A125]" />
    </div>
  );
}

function MonitoringPage() {
  const [events, setEvents] = useState<AppErrorEvent[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      setEvents(await monitoringService.list());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load monitoring data.",
      );
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const list = events ?? [];
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return {
      unresolved: list.filter((event) => !event.resolved_at).length,
      last24Hours: list
        .filter(
          (event) =>
            new Date(event.last_seen_at).getTime() >= dayAgo,
        )
        .reduce((sum, event) => sum + event.occurrences, 0),
      server: list.filter((event) => event.source === "server").length,
      client: list.filter((event) => event.source === "client").length,
    };
  }, [events]);

  async function toggleResolved(event: AppErrorEvent) {
    setBusyId(event.id);

    try {
      await monitoringService.setResolved(
        event.id,
        !event.resolved_at,
      );
      await load();
      toast.success(
        event.resolved_at
          ? "Issue reopened."
          : "Issue marked resolved.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the issue.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function createTest() {
    setTesting(true);

    try {
      const accepted =
        await monitoringService.createTestEvent();

      if (!accepted) {
        throw new Error(
          "The test event was not accepted. Check the monitoring setup.",
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 700));
      await load();
      toast.success("Monitoring test event recorded.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Monitoring test failed.",
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="System health"
          description="Recent application errors are grouped by cause. Customer form contents and invoice data are not stored in this log."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
              <Button
                size="sm"
                disabled={testing}
                onClick={() => void createTest()}
              >
                <MonitorCog className="h-3.5 w-3.5" />
                {testing ? "Testing…" : "Test monitoring"}
              </Button>
            </>
          }
        />

        <div className="grid overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4] sm:grid-cols-2 xl:grid-cols-4">
          <div className="border-b border-[#071226]/10 sm:border-r xl:border-b-0">
            <Metric
              label="Unresolved issues"
              value={metrics.unresolved}
              icon={AlertTriangle}
            />
          </div>
          <div className="border-b border-[#071226]/10 xl:border-b-0 xl:border-r">
            <Metric
              label="Events in 24 hours"
              value={metrics.last24Hours}
              icon={Activity}
            />
          </div>
          <div className="border-b border-[#071226]/10 sm:border-r sm:border-b-0">
            <Metric
              label="Server issues"
              value={metrics.server}
              icon={Server}
            />
          </div>
          <Metric
            label="Browser issues"
            value={metrics.client}
            icon={MonitorCog}
          />
        </div>

        <section className="overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4]">
          {events === null ? (
            <div className="p-5">
              <LoadingState label="Loading system health…" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No application errors recorded"
                description="Use Test monitoring to confirm that error collection is working."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-xs">
                <thead>
                  <tr className="border-b border-[#071226]/10 bg-[#071226]/[0.025] text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
                    <th className="px-3 py-2">Issue</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2 text-center">Source</th>
                    <th className="px-3 py-2 text-right">Count</th>
                    <th className="px-3 py-2">Last seen</th>
                    <th className="px-3 py-2 text-center">State</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#071226]/8">
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="align-top hover:bg-[#D5A125]/5"
                    >
                      <td className="max-w-[390px] px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span
                            className={
                              event.severity === "error"
                                ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-[#071226]"
                                : "mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D5A125]"
                            }
                          />
                          <div>
                            <p className="font-medium text-[#071226]">
                              {event.message}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#071226]/42">
                              {event.error_type}
                              {event.status_code
                                ? ` · HTTP ${event.status_code}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#071226]/55">
                        <p>{event.route || "Unknown route"}</p>
                        {event.operation ? (
                          <p className="mt-0.5 text-[10px]">
                            {event.operation}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex rounded-full border border-[#071226]/12 bg-[#071226]/4 px-2 py-0.5 text-[9px] font-semibold uppercase">
                          {event.source}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {event.occurrences}
                      </td>
                      <td className="px-3 py-2.5 text-[#071226]/55">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(event.last_seen_at))}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {event.resolved_at ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#D5A125] px-2 py-0.5 text-[9px] font-semibold text-[#071226]">
                            <CheckCircle2 className="h-3 w-3" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#071226] px-2 py-0.5 text-[9px] font-semibold text-white">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === event.id}
                          onClick={() => void toggleResolved(event)}
                        >
                          {busyId === event.id
                            ? "Saving…"
                            : event.resolved_at
                              ? "Reopen"
                              : "Resolve"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
