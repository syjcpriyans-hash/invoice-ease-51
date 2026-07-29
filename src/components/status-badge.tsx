import { cn } from "@/lib/utils";
import { EMAIL_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/format";
import type { EmailStatus, OrderStatus } from "@/types";

const base =
  "inline-flex min-w-[82px] items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap";

const neutral =
  "border-[#071226]/12 bg-[#071226]/4 text-[#071226]/64";
const active =
  "border-[#D5A125]/52 bg-[#D5A125]/12 text-[#071226]";
const complete =
  "border-[#D5A125] bg-[#D5A125] text-[#071226]";
const failed =
  "border-[#071226] bg-[#071226] text-white";

const orderStyles: Record<OrderStatus, string> = {
  draft: neutral,
  link_created: active,
  link_sent: active,
  link_email_failed: failed,
  form_opened: active,
  submitted: active,
  invoice_generating: active,
  invoice_generated: complete,
  email_queued: active,
  email_sent: complete,
  delivered: complete,
  failed,
};

const emailStyles: Record<EmailStatus, string> = {
  not_generated: neutral,
  queued: active,
  sent: active,
  delivered: complete,
  bounced: failed,
  failed,
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, orderStyles[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </span>
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
    <span className={cn(base, emailStyles[status], className)}>
      {EMAIL_STATUS_LABELS[status]}
    </span>
  );
}
