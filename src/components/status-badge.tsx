import { cn } from "@/lib/utils";
import { EMAIL_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/format";
import type { EmailStatus, OrderStatus } from "@/types";

const base =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const orderStyles: Record<OrderStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  link_sent: "border-primary/20 bg-primary/5 text-primary",
  form_opened: "border-warning/30 bg-warning/10 text-warning",
  submitted: "border-primary/25 bg-primary/10 text-primary",
  invoice_generating: "border-warning/30 bg-warning/10 text-warning",
  invoice_generated: "border-success/25 bg-success/10 text-success",
  email_queued: "border-warning/30 bg-warning/10 text-warning",
  email_sent: "border-success/25 bg-success/10 text-success",
  delivered: "border-success/40 bg-success/15 text-success",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

const emailStyles: Record<EmailStatus, string> = {
  not_generated: "border-border bg-muted text-muted-foreground",
  queued: "border-warning/30 bg-warning/10 text-warning",
  sent: "border-primary/25 bg-primary/10 text-primary",
  delivered: "border-success/40 bg-success/15 text-success",
  bounced: "border-destructive/30 bg-destructive/10 text-destructive",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn(base, orderStyles[status], className)}>{ORDER_STATUS_LABELS[status]}</span>
  );
}

export function EmailStatusBadge({
  status,
  className,
}: {
  status: EmailStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, emailStyles[status], className)}>{EMAIL_STATUS_LABELS[status]}</span>
  );
}