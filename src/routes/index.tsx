import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  FileCheck2,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLogo } from "@/components/site-logo";
import { TurnstileWidget } from "@/components/turnstile-widget";
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
          "Billantra automates the work between a confirmed order and a delivered invoice. Collect customer information, generate invoice PDFs, send emails, and track delivery in one controlled workflow.",
      },
      {
        name: "keywords",
        content:
          "invoice automation, automated invoicing, B2B invoice workflow, invoice PDF generation, customer billing information",
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
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  async function submitEarlyAccess(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Enter your work email.");
      return;
    }

    if (!turnstileToken) {
      toast.error("Complete the security verification.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await waitlistService.join(
        {
          email,
          fullName: "",
          companyName: "",
          role: "",
        },
        turnstileToken,
      );

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
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#071226]">
      <header className="sticky top-0 z-40 border-b border-[#071226]/10 bg-[#FAF7F4]/96 backdrop-blur">
        <div className="marketing-container flex h-16 items-center">
          <SiteLogo />
          <nav className="ml-10 hidden items-center gap-7 text-[13px] font-medium text-[#071226]/60 lg:flex">
            <a href="#platform" className="hover:text-[#071226]">
              Platform
            </a>
            <a href="#workflow" className="hover:text-[#071226]">
              Workflow
            </a>
            <a href="#controls" className="hover:text-[#071226]">
              Controls
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <a href="#early-access">Request access</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#071226]/10">
          <div className="marketing-container grid gap-14 py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-24">
            <div className="max-w-[680px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D5A125]">
                Invoice operations, built for scale
              </p>
              <h1 className="mt-5 text-[46px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[58px]">
                From confirmed order to delivered invoice.
              </h1>
              <p className="mt-6 max-w-[610px] text-[17px] leading-8 text-[#071226]/62">
                Billantra replaces repetitive data entry, downloaded
                documents, and manual email follow-up with one controlled
                B2B invoice workflow.
              </p>
              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg">
                  <a href="#early-access">
                    Request early access
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#workflow">See the workflow</a>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
                {[
                  "Secure customer intake",
                  "Automatic invoice PDFs",
                  "Delivery-state tracking",
                ].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-xs text-[#071226]/55"
                  >
                    <Check className="h-3.5 w-3.5 text-[#D5A125]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-[#071226]/12 bg-[#FAF7F4]">
              <div className="flex items-center justify-between border-b border-[#071226]/10 px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold">
                    Invoice workspace
                  </p>
                  <p className="text-[10px] text-[#071226]/45">
                    Live operational overview
                  </p>
                </div>
                <span className="rounded-full border border-[#D5A125]/50 bg-[#D5A125]/12 px-2 py-0.5 text-[9px] font-semibold">
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
                    className="border-r border-[#071226]/10 px-4 py-4 last:border-r-0"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#071226]/42">
                      {label}
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#071226]/10 bg-[#071226]/[0.025] text-left text-[9px] uppercase tracking-[0.08em] text-[#071226]/42">
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2 text-right">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#071226]/8">
                  {[
                    [
                      "ORD-0128",
                      "Northstar Pharmacy",
                      "$5,311.00",
                      "Delivered",
                    ],
                    [
                      "ORD-0127",
                      "Apex Medical Group",
                      "$2,480.00",
                      "Submitted",
                    ],
                    [
                      "ORD-0126",
                      "Harbour Health",
                      "$8,920.00",
                      "Awaiting",
                    ],
                    [
                      "ORD-0125",
                      "Medline Partners",
                      "$1,760.00",
                      "Delivered",
                    ],
                  ].map(([order, customer, amount, status]) => (
                    <tr key={order}>
                      <td className="px-3 py-2.5 font-medium">
                        {order}
                      </td>
                      <td className="px-3 py-2.5 text-[#071226]/55">
                        {customer}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium">
                        {amount}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="rounded-full bg-[#D5A125]/14 px-2 py-0.5 text-[9px] font-semibold">
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section
          id="platform"
          className="dark-surface bg-[#071226] text-white"
        >
          <div className="marketing-container py-20">
            <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  One controlled platform
                </p>
                <h2 className="mt-4 text-[36px] font-semibold leading-tight tracking-[-0.045em] text-white">
                  Infrastructure for the work that starts after
                  the sale.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white">
                  Every order, customer submission, invoice, PDF,
                  and delivery event remains connected.
                </p>
              </div>
              <div className="grid gap-px overflow-hidden rounded-md border border-white/16 bg-white/16 md:grid-cols-3">
                <DarkFeature
                  icon={FileCheck2}
                  title="Structured orders"
                  text="Lock commercial details before customer handoff."
                />
                <DarkFeature
                  icon={LockKeyhole}
                  title="Secure intake"
                  text="Collect complete billing and shipping information."
                />
                <DarkFeature
                  icon={MailCheck}
                  title="Tracked delivery"
                  text="Monitor sent, delivered, bounced, and failed emails."
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="border-b border-[#071226]/10"
        >
          <div className="marketing-container grid gap-12 py-20 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D5A125]">
                Workflow
              </p>
              <h2 className="mt-4 text-[36px] font-semibold leading-tight tracking-[-0.045em]">
                Fewer handoffs. Fewer mistakes.
              </h2>
            </div>
            <div className="border-t border-[#071226]/14">
              {[
                [
                  "01",
                  "Confirm the commercial terms",
                  "Create or import the order and review the financial details.",
                ],
                [
                  "02",
                  "Collect customer information",
                  "Send one private form for billing and shipping details.",
                ],
                [
                  "03",
                  "Generate and deliver",
                  "Create the PDF, send the invoice, and track delivery.",
                ],
                [
                  "04",
                  "Resolve exceptions",
                  "Correct failed addresses and retry without rebuilding.",
                ],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="grid gap-3 border-b border-[#071226]/14 py-5 sm:grid-cols-[60px_1fr]"
                >
                  <span className="text-xs font-semibold text-[#D5A125]">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold">
                      {title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-6 text-[#071226]/55">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="controls"
          className="border-b border-[#071226]/10 bg-[#D5A125]"
        >
          <div className="marketing-container grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <h2 className="text-[34px] font-semibold leading-tight tracking-[-0.045em]">
              Automation without losing financial control.
            </h2>
            <div className="grid gap-px overflow-hidden rounded-md border border-[#071226]/20 bg-[#071226]/20 sm:grid-cols-2">
              {[
                [ShieldCheck, "Server-side validation"],
                [LockKeyhole, "Locked commercial terms"],
                [FileCheck2, "Connected records"],
                [MailCheck, "Delivery visibility"],
              ].map(([Icon, label]) => {
                const Component = Icon as typeof ShieldCheck;
                return (
                  <div
                    key={label as string}
                    className="bg-[#FAF7F4] p-4"
                  >
                    <Component className="h-4 w-4" />
                    <p className="mt-3 text-xs font-semibold">
                      {label as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="early-access" className="py-20">
          <div className="marketing-container">
            <div className="grid gap-8 rounded-md border border-[#071226]/12 px-5 py-8 lg:grid-cols-[1fr_420px] lg:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D5A125]">
                  Early access
                </p>
                <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.04em]">
                  Build a faster invoice operation.
                </h2>
                <p className="mt-2 text-sm text-[#071226]/55">
                  Join the Billantra early-access list.
                </p>
              </div>
              <form
                onSubmit={submitEarlyAccess}
                className="space-y-2"
              >
                <TurnstileWidget
                  action="waitlist"
                  onToken={setTurnstileToken}
                  resetKey={turnstileResetKey}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Work email address"
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !turnstileToken}
                    className="shrink-0"
                  >
                    {submitting ? "Submitting…" : "Request access"}
                  </Button>
                </div>
                <p className="text-[10px] leading-5 text-[#071226]/48">
                  By requesting access, you acknowledge the{" "}
                  <Link to="/privacy" className="font-medium underline underline-offset-2">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms" className="font-medium underline underline-offset-2">
                    Terms of Service
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#071226]/10">
        <div className="marketing-container flex flex-col gap-4 py-8 sm:flex-row sm:items-center">
          <SiteLogo />
          <p className="text-xs text-[#071226]/48 sm:ml-5">
            Automated invoice operations for modern businesses.
          </p>
          <div className="flex flex-wrap gap-5 text-xs text-[#071226]/60 sm:ml-auto">
            <Link to="/login">Sign in</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="#controls">Controls</a>
            <a href="#early-access">Early access</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DarkFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <article className="bg-[#071226] p-5">
      <Icon className="h-4 w-4 text-white" />
      <h3 className="mt-4 text-sm font-semibold text-white">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-6 text-white">{text}</p>
    </article>
  );
}
