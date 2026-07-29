import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  LockKeyhole,
  MailCheck,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waitlistService } from "@/services/waitlistService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Billantra | Automated invoice operations for modern businesses",
      },
      {
        name: "description",
        content:
          "Billantra automates the work between a confirmed order and a delivered invoice. Collect customer details securely, generate invoice PDFs, send emails, and track delivery from one controlled workflow.",
      },
      {
        name: "keywords",
        content:
          "invoice automation, automated invoicing, B2B invoicing software, invoice workflow automation, billing information collection, invoice PDF generation",
      },
      {
        property: "og:title",
        content:
          "Billantra | From confirmed order to delivered invoice",
      },
      {
        property: "og:description",
        content:
          "Professional invoice operations for wholesalers, distributors, suppliers, and service teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const trustPoints = [
  "Secure customer intake",
  "Automatic invoice PDFs",
  "Delivery and bounce tracking",
];

function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitEarlyAccess(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Enter your work email.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await waitlistService.join({
        email,
        fullName: "",
        companyName: "",
        role: "",
      });

      toast.success(
        result.status === "already_joined"
          ? "You are already registered."
          : "Your early-access request has been received.",
      );
      setEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#071226]">
      <header className="sticky top-0 z-40 border-b border-[#071226]/10 bg-[#FAF7F4]/95 backdrop-blur">
        <div className="marketing-container flex h-[74px] items-center">
          <SiteLogo />

          <nav className="ml-12 hidden items-center gap-8 text-sm font-medium text-[#071226]/62 lg:flex">
            <a href="#platform" className="hover:text-[#071226]">
              Platform
            </a>
            <a href="#workflow" className="hover:text-[#071226]">
              Workflow
            </a>
            <a href="#controls" className="hover:text-[#071226]">
              Controls
            </a>
            <a href="#industries" className="hover:text-[#071226]">
              Industries
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden text-[#071226] sm:inline-flex"
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="h-10 rounded-lg px-4">
              <a href="#early-access">Request early access</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-[#071226]/10">
          <div className="marketing-container grid min-h-[740px] items-center gap-16 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div className="max-w-[690px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D5A125]/45 bg-[#D5A125]/10 px-3 py-1.5 text-xs font-semibold text-[#071226]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D5A125]" />
                Invoice operations, built for scale
              </div>

              <h1 className="mt-8 text-[46px] font-semibold leading-[1.04] tracking-[-0.055em] text-[#071226] sm:text-[58px] lg:text-[68px]">
                From confirmed order to delivered invoice.
              </h1>

              <p className="mt-7 max-w-[620px] text-[18px] leading-8 text-[#071226]/64">
                Billantra removes repetitive administration from B2B
                invoicing. Collect complete customer information, generate the
                invoice, send it, and track delivery without copying the same
                details between systems.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-lg px-6">
                  <a href="#early-access">
                    Request early access
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-lg border-[#071226]/20 bg-[#FAF7F4] px-6 text-[#071226]"
                >
                  <a href="#workflow">See the workflow</a>
                </Button>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
                {trustPoints.map((point) => (
                  <span
                    key={point}
                    className="flex items-center gap-2 text-sm text-[#071226]/58"
                  >
                    <Check className="h-4 w-4 text-[#D5A125]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section
          id="platform"
          className="border-b border-[#071226]/10 bg-[#071226] text-[#FAF7F4]"
        >
          <div className="marketing-container py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
                One controlled platform
              </p>
              <h2 className="mt-5 text-[38px] font-semibold leading-tight tracking-[-0.045em] sm:text-[44px]">
                Serious invoice infrastructure for work that happens after the
                sale.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#FAF7F4]/64">
                Replace scattered messages, copied customer details,
                downloaded files, and manual delivery follow-ups with one
                connected operating workflow.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              <DarkCard
                icon={Receipt}
                title="Structured order intake"
                text="Keep products, quantities, pricing, tax, shipping, discounts, and payment terms connected."
              />
              <DarkCard
                icon={LockKeyhole}
                title="Secure customer collection"
                text="Collect legal, contact, billing, and shipping information through one private form."
              />
              <DarkCard
                icon={MailCheck}
                title="Automated delivery"
                text="Generate the PDF, send the invoice, and track delivered, bounced, and failed states."
              />
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="border-b border-[#071226]/10 bg-[#FAF7F4]"
        >
          <div className="marketing-container grid gap-16 py-24 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
                The Billantra workflow
              </p>
              <h2 className="mt-5 text-[38px] font-semibold leading-tight tracking-[-0.045em]">
                Fewer handoffs. Fewer mistakes. Faster invoicing.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#071226]/62">
                Every step remains connected to one order record, giving your
                team clarity without adding administrative work.
              </p>
            </div>

            <div className="border-t border-[#071226]/16">
              <WorkflowStep
                number="01"
                title="Confirm the commercial terms"
                text="Create or import the order and review every financial field before customer handoff."
              />
              <WorkflowStep
                number="02"
                title="Collect verified customer information"
                text="The customer completes a structured billing and shipping form through a private link."
              />
              <WorkflowStep
                number="03"
                title="Generate and deliver automatically"
                text="Billantra creates the invoice PDF, sends the email, and records its delivery status."
              />
              <WorkflowStep
                number="04"
                title="Resolve exceptions without rebuilding"
                text="Correct failed email addresses and retry the existing invoice safely."
              />
            </div>
          </div>
        </section>

        <section
          id="controls"
          className="border-b border-[#071226]/10 bg-[#D5A125]"
        >
          <div className="marketing-container grid gap-14 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#071226]/62">
                Operational control
              </p>
              <h2 className="mt-4 text-[38px] font-semibold leading-tight tracking-[-0.045em] text-[#071226]">
                Automation without losing financial discipline.
              </h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-xl border border-[#071226]/18 bg-[#071226]/18 sm:grid-cols-2">
              <ControlCell
                icon={ShieldCheck}
                title="Server-side validation"
              />
              <ControlCell
                icon={LockKeyhole}
                title="Locked commercial terms"
              />
              <ControlCell
                icon={FileText}
                title="Connected invoice records"
              />
              <ControlCell
                icon={CheckCircle2}
                title="Delivery-state tracking"
              />
            </div>
          </div>
        </section>

        <section
          id="industries"
          className="border-b border-[#071226]/10 bg-[#FAF7F4]"
        >
          <div className="marketing-container py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
                Built for B2B operations
              </p>
              <h2 className="mt-5 text-[38px] font-semibold leading-tight tracking-[-0.045em]">
                Professional invoicing for businesses that sell outside an
                online checkout.
              </h2>
            </div>

            <div className="mt-12 grid divide-y divide-[#071226]/12 border-y border-[#071226]/12 md:grid-cols-2 md:divide-x md:divide-y-0">
              <Industry
                title="Wholesalers and distributors"
                text="Move confirmed sales into invoicing without rebuilding customer and order information."
              />
              <Industry
                title="Medical and equipment suppliers"
                text="Collect complete billing details and maintain consistent invoice documentation."
              />
              <Industry
                title="Service and installation teams"
                text="Combine products, services, taxes, and shipping in one controlled order record."
              />
              <Industry
                title="Operations and finance teams"
                text="Give staff one workflow for invoice preparation, delivery, and exception handling."
              />
            </div>
          </div>
        </section>

        <section id="early-access" className="bg-[#071226]">
          <div className="marketing-container py-24">
            <div className="rounded-2xl border border-[#FAF7F4]/14 bg-[#FAF7F4]/[0.04] px-6 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
                  Early access
                </p>
                <h2 className="mt-4 text-[36px] font-semibold tracking-[-0.045em] text-[#FAF7F4]">
                  Build a faster invoice operation with Billantra.
                </h2>
                <p className="mt-4 text-base leading-7 text-[#FAF7F4]/62">
                  Join the early-access list for product updates and pilot
                  availability.
                </p>
              </div>

              <form
                onSubmit={submitEarlyAccess}
                className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row lg:mt-0"
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Work email address"
                  className="h-12 rounded-lg border-[#FAF7F4]/24 bg-[#FAF7F4] text-[#071226]"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 shrink-0 rounded-lg bg-[#D5A125] px-5 text-[#071226] hover:bg-[#D5A125]/90"
                >
                  {submitting ? "Submitting…" : "Request access"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#071226]/10 bg-[#FAF7F4]">
        <div className="marketing-container flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <SiteLogo />
          <p className="text-sm text-[#071226]/52 sm:ml-6">
            Automated invoice operations for modern businesses.
          </p>
          <div className="flex gap-6 text-sm text-[#071226]/62 sm:ml-auto">
            <Link to="/login">Sign in</Link>
            <a href="#controls">Controls</a>
            <a href="#early-access">Early access</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview() {
  const rows = [
    ["ORD-2026-0128", "Northstar Pharmacy", "$5,311.00", "Delivered"],
    ["ORD-2026-0127", "Apex Medical Group", "$2,480.00", "Submitted"],
    ["ORD-2026-0126", "Harbour Health", "$8,920.00", "Awaiting"],
    ["ORD-2026-0125", "Medline Partners", "$1,760.00", "Delivered"],
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-20 -z-10 bg-[radial-gradient(circle,rgba(213,161,37,0.22),transparent_62%)]" />

      <div className="overflow-hidden rounded-2xl border border-[#071226]/14 bg-[#FAF7F4] shadow-[0_30px_90px_rgba(7,18,38,0.16)]">
        <div className="flex items-center justify-between border-b border-[#071226]/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/brand/billantra-mark.png"
              alt=""
              className="h-8 w-8 object-contain"
            />
            <div>
              <p className="text-sm font-semibold">Invoice operations</p>
              <p className="text-xs text-[#071226]/45">
                Live workspace overview
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[#D5A125]/50 bg-[#D5A125]/14 px-2.5 py-1 text-[10px] font-semibold text-[#071226]">
            Workflow active
          </span>
        </div>

        <div className="grid grid-cols-3 border-b border-[#071226]/10">
          {[
            ["Orders", "128"],
            ["Delivered", "119"],
            ["Attention", "3"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-r border-[#071226]/10 px-5 py-5 last:border-r-0"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Recent activity</p>
            <span className="text-xs text-[#071226]/42">Today</span>
          </div>

          {rows.map(([order, customer, value, status]) => (
            <div
              key={order}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#071226]/10 py-4 last:border-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{order}</p>
                  <span className="rounded-full bg-[#D5A125]/14 px-2 py-0.5 text-[10px] font-semibold">
                    {status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#071226]/45">{customer}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DarkCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Receipt;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border border-[#FAF7F4]/12 bg-[#FAF7F4]/[0.04] p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D5A125] text-[#071226]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-6 text-lg font-semibold tracking-[-0.02em]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#FAF7F4]/58">{text}</p>
    </article>
  );
}

function WorkflowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-4 border-b border-[#071226]/16 py-7 sm:grid-cols-[74px_1fr]">
      <span className="text-sm font-semibold text-[#D5A125]">{number}</span>
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#071226]/58">{text}</p>
      </div>
    </div>
  );
}

function ControlCell({
  icon: Icon,
  title,
}: {
  icon: typeof ShieldCheck;
  title: string;
}) {
  return (
    <div className="bg-[#FAF7F4] p-5">
      <Icon className="h-5 w-5 text-[#071226]" strokeWidth={1.8} />
      <p className="mt-5 text-sm font-semibold text-[#071226]">{title}</p>
    </div>
  );
}

function Industry({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <article className="p-7 md:p-9">
      <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#071226]/58">
        {text}
      </p>
    </article>
  );
}
