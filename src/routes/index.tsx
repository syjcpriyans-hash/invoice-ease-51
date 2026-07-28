import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  MailCheck,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/config/app';
import { SiteLogo } from '@/components/site-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitlistService } from '@/services/waitlistService';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: `${APP_CONFIG.name} — Automated intake-to-invoice` },
      {
        name: 'description',
        content:
          'Turn a confirmed order into a delivered invoice with one secure customer link and no manual re-entry.',
      },
      { property: 'og:title', content: `${APP_CONFIG.name} — Automated intake-to-invoice` },
      {
        property: 'og:description',
        content:
          'Collect customer billing details, generate the invoice, and send it automatically.',
      },
    ],
  }),
  component: LandingPage,
});

const workflowRows = [
  {
    label: 'Order confirmed',
    detail: 'Locked pricing and line items',
    state: 'Complete',
    icon: FileCheck2,
  },
  {
    label: 'Customer details collected',
    detail: 'Secure form submitted',
    state: 'Complete',
    icon: KeyRound,
  },
  {
    label: 'Invoice delivered',
    detail: 'PDF generated and emailed',
    state: 'Delivered',
    icon: MailCheck,
  },
];

function LandingPage() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleWaitlistSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Enter your work email to join the waitlist.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await waitlistService.join({ email, fullName, companyName, role });
      toast.success(
        result.status === 'already_joined'
          ? "You're already on the waitlist."
          : 'You are on the waitlist. We will contact you when early access opens.',
      );
      setFullName('');
      setCompanyName('');
      setRole('');
      setEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join the waitlist.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="marketing-container flex h-16 items-center justify-between">
          <SiteLogo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Primary navigation">
            <a className="landing-nav-link" href="#workflow">Workflow</a>
            <a className="landing-nav-link" href="#controls">Controls</a>
            <a className="landing-nav-link" href="#waitlist">Early access</a>
          </nav>
          <Button asChild size="sm" className="h-10 rounded-md px-4">
            <a href="#waitlist">Join waitlist</a>
          </Button>
        </div>
      </header>

      <main id="main-content">
        <section className="border-b border-border/80">
          <div className="marketing-container grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
            <div className="landing-reveal max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-slate">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                Early access opening soon
              </div>
              <h1 className="font-heading text-[42px] font-semibold leading-[1.08] tracking-[-0.045em] text-balance sm:text-[52px] lg:text-[60px]">
                From confirmed order to delivered invoice—without the handoffs.
              </h1>
              <p className="mt-6 max-w-2xl text-[18px] leading-8 text-muted-foreground">
                Invoice Ease collects customer billing details through one secure link, creates the invoice, and sends it automatically. Your team enters the order once. The workflow finishes itself.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 rounded-md px-5">
                  <a href="#waitlist">
                    Join the early-access waitlist
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-md px-5">
                  <a href="#workflow">See the workflow</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground" aria-label="Product trust signals">
                <TrustLine>Private customer links</TrustLine>
                <TrustLine>Server-side totals</TrustLine>
                <TrustLine>Auditable invoice records</TrustLine>
              </div>
            </div>

            <div className="landing-reveal landing-reveal-delay relative">
              <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_center,rgba(49,89,216,0.10),transparent_68%)]" aria-hidden="true" />
              <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_18px_55px_rgba(20,32,51,0.08)]">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">Order ORD-2048</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Northstar Pharmacy</p>
                  </div>
                  <span className="status-chip status-chip-success">Completed</span>
                </div>

                <div className="px-5 py-2">
                  {workflowRows.map((row, index) => (
                    <div key={row.label} className="ledger-row group relative grid grid-cols-[36px_1fr_auto] items-center gap-3 py-4">
                      <span className="ledger-marker" aria-hidden="true" />
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                        <row.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{row.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
                      </div>
                      <span className="text-xs font-medium text-positive">{row.state}</span>
                      {index < workflowRows.length - 1 ? (
                        <span className="absolute bottom-[-1px] left-0 right-0 h-px bg-border" aria-hidden="true" />
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border bg-canvas px-5 py-4">
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Invoice</p>
                      <p className="mt-1 font-data font-medium tabular-nums">INV-1042</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Total</p>
                      <p className="mt-1 font-data text-lg font-semibold tabular-nums">$5,311.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-border/80 bg-surface">
          <div className="marketing-container py-20 lg:py-24">
            <SectionIntro
              eyebrow="One controlled workflow"
              title="Remove the re-entry, follow-up, and file handling."
              description="The workflow is designed around the exact moment after an order is confirmed—when teams usually start copying details between email, forms, invoicing software, and customer messages."
            />

            <div className="mt-12 border-y border-border">
              <WorkflowStep
                number="01"
                title="Create the confirmed order"
                description="Lock the products, quantities, prices, tax, and payment terms before anything reaches the customer."
                outcome="One source of truth"
              />
              <WorkflowStep
                number="02"
                title="Collect verified customer details"
                description="The customer receives a private link and submits billing, shipping, and contact information in a structured form."
                outcome="No email chasing"
              />
              <WorkflowStep
                number="03"
                title="Generate and deliver the invoice"
                description="Invoice numbering, PDF generation, storage, and email delivery run automatically after a valid submission."
                outcome="No manual handoff"
              />
            </div>
          </div>
        </section>

        <section id="controls" className="border-b border-border/80">
          <div className="marketing-container grid gap-14 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:py-24">
            <SectionIntro
              eyebrow="Built for billing operations"
              title="Automation with financial controls—not shortcuts."
              description="Fast is useful only when the amounts, recipients, and records remain correct. Invoice Ease keeps customer input separate from locked commercial terms and records every workflow state."
            />

            <div className="border-t border-border">
              <ControlRow
                icon={LockKeyhole}
                title="Locked commercial terms"
                description="Customers can provide their details, but cannot alter products, pricing, discounts, tax, or payment terms."
              />
              <ControlRow
                icon={ShieldCheck}
                title="Server-side validation"
                description="Totals and required fields are recalculated and validated before an invoice can be created."
              />
              <ControlRow
                icon={ReceiptText}
                title="Consistent invoice records"
                description="Invoice numbers, PDFs, order references, and delivery states remain connected in one auditable record."
              />
              <ControlRow
                icon={MailCheck}
                title="Delivery visibility"
                description="Link and invoice email states are visible to the team, with retry paths when an exception occurs."
              />
            </div>
          </div>
        </section>

        <section className="border-b border-border/80 bg-ink text-white">
          <div className="marketing-container grid gap-10 py-16 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Designed for repeat B2B invoicing</p>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Built for teams where two minutes per invoice becomes hours every month.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                Wholesalers, distributors, equipment suppliers, and operations teams can keep the flexibility of confirmed-order sales without carrying the administrative work into every invoice.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="h-11 justify-self-start rounded-md px-5 text-foreground lg:justify-self-end">
              <a href="#waitlist">Request early access</a>
            </Button>
          </div>
        </section>

        <section id="waitlist" className="border-b border-border/80 bg-surface">
          <div className="marketing-container grid gap-14 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:py-24">
            <div className="max-w-xl">
              <p className="section-eyebrow">Early access</p>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Join the teams shaping the first release.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                Tell us where invoice preparation slows your team down. Early users will receive launch updates and may be invited into a guided pilot.
              </p>
              <div className="mt-8 border-t border-border pt-6">
                <p className="text-sm font-medium">Good fit for:</p>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <WaitlistFit>Teams creating many B2B invoices each day</WaitlistFit>
                  <WaitlistFit>Orders confirmed outside an online checkout</WaitlistFit>
                  <WaitlistFit>Businesses collecting billing details by email</WaitlistFit>
                </ul>
              </div>
            </div>

            <form className="rounded-lg border border-border bg-background p-6 sm:p-8" onSubmit={handleWaitlistSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" htmlFor="fullName">
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Priyans Kevadia"
                    className="h-10 rounded-md bg-surface"
                  />
                </Field>
                <Field label="Company name" htmlFor="companyName">
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Company name"
                    className="h-10 rounded-md bg-surface"
                  />
                </Field>
                <Field label="Work email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-10 rounded-md bg-surface"
                  />
                </Field>
                <Field label="Your role" htmlFor="role">
                  <Input
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Operations, sales, finance"
                    className="h-10 rounded-md bg-surface"
                  />
                </Field>
              </div>
              <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-xs leading-5 text-muted-foreground">
                  We will use your information only for Invoice Ease launch and early-access communication.
                </p>
                <Button className="h-11 shrink-0 rounded-md px-5" disabled={submitting}>
                  {submitting ? 'Joining…' : 'Join waitlist'}
                  {!submitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="bg-background">
          <div className="marketing-container py-20 lg:py-24">
            <SectionIntro
              eyebrow="Questions"
              title="What early users should know."
              description="The first release is focused on one job: completing the confirmed-order-to-invoice workflow with less manual intervention."
            />
            <div className="mt-10 grid border-t border-border md:grid-cols-2">
              <FaqItem question="Is the product live today?">
                The working MVP is in controlled testing. The public site is collecting early-access interest while reliability and production controls are completed.
              </FaqItem>
              <FaqItem question="Can customers change an order?">
                No. Commercial terms remain locked. Customers provide only the billing, shipping, contact, and authorization information required for invoicing.
              </FaqItem>
              <FaqItem question="Does the customer need an account?">
                No. The customer receives a secure, order-specific link and can submit the required information without creating a login.
              </FaqItem>
              <FaqItem question="Who can access the dashboard?">
                Only authenticated team users. The public website and customer forms do not expose operational dashboard data.
              </FaqItem>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="marketing-container flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <SiteLogo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Invoice Ease. Automated intake-to-invoice.</p>
        </div>
      </footer>
    </div>
  );
}

function TrustLine({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <CircleCheck className="h-4 w-4 text-positive" aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
  outcome,
}: {
  number: string;
  title: string;
  description: string;
  outcome: string;
}) {
  return (
    <div className="ledger-row group relative grid gap-5 border-b border-border py-7 last:border-b-0 md:grid-cols-[64px_1fr_220px] md:items-center">
      <span className="ledger-marker" aria-hidden="true" />
      <span className="font-data text-xs font-semibold tracking-[0.08em] text-muted-foreground">{number}</span>
      <div>
        <h3 className="font-heading text-lg font-semibold tracking-[-0.015em]">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center justify-between text-sm font-medium md:justify-end md:gap-3">
        <span>{outcome}</span>
        <ChevronRight className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
    </div>
  );
}

function ControlRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="ledger-row group relative grid grid-cols-[40px_1fr] gap-4 border-b border-border py-6 last:border-b-0">
      <span className="ledger-marker" aria-hidden="true" />
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function WaitlistFit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="faq-item border-b border-border py-7 md:min-h-44 md:px-8">
      <h3 className="text-sm font-semibold">{question}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}
