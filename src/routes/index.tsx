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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/config/app";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waitlistService } from "@/services/waitlistService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Billantra | Automated invoice operations for modern businesses" },
      {
        name: "description",
        content:
          "Billantra turns confirmed orders into professional invoices. Collect customer details securely, generate PDFs automatically, track delivery, and eliminate repetitive invoice administration.",
      },
      {
        name: "keywords",
        content:
          "invoice automation, automated invoicing, B2B invoice software, invoice workflow, customer billing form, invoice email automation",
      },
      { property: "og:title", content: "Billantra | From confirmed order to delivered invoice" },
      {
        property: "og:description",
        content:
          "A controlled invoice workflow for wholesalers, distributors, suppliers, and operations teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const proof = [
  "Secure customer intake",
  "Automatic PDF generation",
  "Delivery and bounce visibility",
];

function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function joinWaitlist(event: React.FormEvent) {
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
      toast.error(error instanceof Error ? error.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#0b172a]">
      <header className="sticky top-0 z-40 border-b border-[#e9eaec] bg-white/95 backdrop-blur">
        <div className="marketing-container flex h-[72px] items-center">
          <SiteLogo />
          <nav className="ml-12 hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <a href="#product" className="hover:text-[#0b172a]">Product</a>
            <a href="#workflow" className="hover:text-[#0b172a]">Workflow</a>
            <a href="#security" className="hover:text-[#0b172a]">Security</a>
            <a href="#industries" className="hover:text-[#0b172a]">Industries</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-lg bg-[#0b172a] px-4 hover:bg-[#162843]">
              <a href="#early-access">Request early access</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-[#eceef0]">
          <div className="marketing-container grid min-h-[720px] items-center gap-16 py-20 lg:grid-cols-[1.03fr_0.97fr] lg:py-24">
            <div className="max-w-[680px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfac] bg-[#fffaf0] px-3 py-1.5 text-xs font-semibold text-[#8b6a0b]">
                <Sparkles className="h-3.5 w-3.5" />
                Built for high-volume invoice operations
              </div>
              <h1 className="mt-7 text-[46px] font-semibold leading-[1.04] tracking-[-0.055em] text-[#09162b] sm:text-[58px] lg:text-[68px]">
                The operating system for invoices after the sale.
              </h1>
              <p className="mt-7 max-w-[610px] text-[18px] leading-8 text-slate-600">
                Billantra turns a confirmed order into a delivered invoice without repetitive data entry. Your customer submits their details once. Billantra handles the document, delivery, and status tracking.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-lg bg-[#09162b] px-6 hover:bg-[#162843]">
                  <a href="#early-access">
                    Request early access
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-lg border-[#d8dce1] px-6">
                  <a href="#workflow">See how it works</a>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
                {proof.map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <Check className="h-4 w-4 text-[#b48910]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-20 -z-10 bg-[radial-gradient(circle,rgba(215,169,39,0.16),transparent_62%)]" />
              <div className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-[0_30px_90px_rgba(9,22,43,0.13)]">
                <div className="flex items-center justify-between border-b border-[#edf0f2] bg-[#fafbfc] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src="/brand/billantra-mark.png" alt="" className="h-8 w-8 object-contain" />
                    <div>
                      <p className="text-sm font-semibold text-[#101828]">Invoice workspace</p>
                      <p className="text-xs text-slate-400">Live operations overview</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#cce8dc] bg-[#f0fbf6] px-2.5 py-1 text-[11px] font-semibold text-[#147a55]">
                    All systems active
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-[#edf0f2]">
                  {[
                    ["Orders", "128"],
                    ["Delivered", "119"],
                    ["Attention", "3"],
                  ].map(([label, value]) => (
                    <div key={label} className="border-r border-[#edf0f2] px-5 py-5 last:border-r-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Recent activity</p>
                    <span className="text-xs text-slate-400">Today</span>
                  </div>
                  {[
                    ["ORD-2026-0128", "Northstar Pharmacy", "$5,311.00", "Delivered"],
                    ["ORD-2026-0127", "Apex Medical Group", "$2,480.00", "Submitted"],
                    ["ORD-2026-0126", "Harbour Health", "$8,920.00", "Awaiting"],
                    ["ORD-2026-0125", "Medline Partners", "$1,760.00", "Delivered"],
                  ].map(([order, customer, value, status]) => (
                    <div key={order} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#edf0f2] py-4 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{order}</p>
                          <span className="text-[11px] text-slate-400">{status}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{customer}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="border-b border-[#eceef0] bg-[#f7f8fa]">
          <div className="marketing-container py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a67d0b]">One controlled platform</p>
              <h2 className="mt-4 text-[38px] font-semibold leading-tight tracking-[-0.045em]">
                Built for the work that starts after an order is confirmed.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Replace scattered emails, copied customer details, downloaded files, and manual invoice follow-ups with one auditable workflow.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Feature icon={Receipt} title="Structured order intake" text="Lock products, quantities, prices, taxes, discounts, and payment terms before customer handoff." />
              <Feature icon={LockKeyhole} title="Secure customer collection" text="Send one private form for legal name, contact information, billing address, and shipping details." />
              <Feature icon={MailCheck} title="Automated delivery" text="Generate the invoice PDF, send it automatically, and track sent, delivered, bounced, and failed states." />
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-[#eceef0]">
          <div className="marketing-container py-24">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a67d0b]">The Billantra workflow</p>
                <h2 className="mt-4 text-[38px] font-semibold leading-tight tracking-[-0.045em]">
                  Fewer handoffs. Fewer mistakes. Faster invoicing.
                </h2>
              </div>
              <div className="border-t border-[#dfe3e8]">
                <Step number="01" title="Confirm the commercial terms" text="Enter or import the order and review the locked financial details." />
                <Step number="02" title="Collect verified customer information" text="The customer completes a structured form through a private link." />
                <Step number="03" title="Generate and deliver automatically" text="Billantra creates the PDF, sends the email, and records delivery status." />
                <Step number="04" title="Resolve exceptions without rebuilding" text="Correct failed email addresses and retry the existing invoice safely." />
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="bg-[#09162b] text-white">
          <div className="marketing-container grid gap-12 py-24 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d7a927]">Operational confidence</p>
              <h2 className="mt-4 text-[38px] font-semibold leading-tight tracking-[-0.045em]">
                Automation designed around control, not shortcuts.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                Customer-submitted data stays separate from locked pricing. Totals are calculated server-side. Every invoice remains tied to its order and delivery record.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DarkFeature icon={ShieldCheck} title="Server-side validation" />
              <DarkFeature icon={LockKeyhole} title="Locked commercial terms" />
              <DarkFeature icon={FileText} title="Connected invoice records" />
              <DarkFeature icon={CheckCircle2} title="Delivery-state tracking" />
            </div>
          </div>
        </section>

        <section id="industries" className="border-b border-[#eceef0]">
          <div className="marketing-container py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a67d0b]">Designed for B2B operations</p>
              <h2 className="mt-4 text-[38px] font-semibold tracking-[-0.045em]">
                Serious infrastructure for businesses that invoice repeatedly.
              </h2>
            </div>
            <div className="mt-12 grid divide-y divide-[#e3e6ea] border-y border-[#e3e6ea] md:grid-cols-2 md:divide-x md:divide-y-0">
              <Industry title="Wholesalers and distributors" text="Move confirmed sales into invoicing without rebuilding customer and order information." />
              <Industry title="Medical and equipment suppliers" text="Collect complete billing details and maintain consistent invoice documentation." />
              <Industry title="Service and installation teams" text="Combine products, services, taxes, and shipping in one controlled record." />
              <Industry title="Operations and finance teams" text="Give staff one workflow for invoice preparation, delivery, and exception handling." />
            </div>
          </div>
        </section>

        <section id="early-access" className="bg-[#f7f8fa]">
          <div className="marketing-container py-24">
            <div className="rounded-2xl border border-[#dfe3e8] bg-white px-6 py-12 shadow-[0_16px_50px_rgba(9,22,43,0.06)] sm:px-12 lg:flex lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a67d0b]">Early access</p>
                <h2 className="mt-4 text-[36px] font-semibold tracking-[-0.045em]">
                  Build a faster invoice operation with Billantra.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Join the early-access list for product updates and pilot availability.
                </p>
              </div>
              <form onSubmit={joinWaitlist} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row lg:mt-0">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Work email address"
                  className="h-12 rounded-lg"
                />
                <Button type="submit" disabled={submitting} className="h-12 shrink-0 rounded-lg bg-[#09162b] px-5">
                  {submitting ? "Submitting…" : "Request access"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e8eb] bg-white">
        <div className="marketing-container flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <SiteLogo />
          <p className="text-sm text-slate-400 sm:ml-6">
            Automated invoice operations for modern businesses.
          </p>
          <div className="flex gap-6 text-sm text-slate-500 sm:ml-auto">
            <Link to="/login">Sign in</Link>
            <a href="#security">Security</a>
            <a href="#early-access">Early access</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Receipt; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-[#e1e4e8] bg-white p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff7de] text-[#9b760c]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-6 text-lg font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </article>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="grid gap-4 border-b border-[#dfe3e8] py-7 sm:grid-cols-[72px_1fr]">
      <span className="text-sm font-semibold text-[#b48910]">{number}</span>
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function DarkFeature({ icon: Icon, title }: { icon: typeof ShieldCheck; title: string }) {
  return (
    <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-5">
      <Icon className="h-5 w-5 text-[#d7a927]" strokeWidth={1.8} />
      <p className="mt-5 text-sm font-medium text-white">{title}</p>
    </div>
  );
}

function Industry({ title, text }: { title: string; text: string }) {
  return (
    <article className="p-7 md:p-9">
      <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{text}</p>
    </article>
  );
}
