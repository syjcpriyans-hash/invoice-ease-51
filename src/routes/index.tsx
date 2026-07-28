import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/config/app';
import { SiteLogo } from '@/components/site-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { waitlistService } from '@/services/waitlistService';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: `${APP_CONFIG.name} — Automated order-to-invoice workflow` },
      {
        name: 'description',
        content:
          'Capture customer billing details with one secure link and automate the order-to-invoice workflow.',
      },
      { property: 'og:title', content: `${APP_CONFIG.name} — Coming soon` },
      {
        property: 'og:description',
        content:
          'Join the waitlist for a simpler order-to-invoice workflow built for fast-moving businesses.',
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const stats = useMemo(
    () => [
      { value: '2–3 min', label: 'Saved per invoice workflow' },
      { value: '1 link', label: 'Needed from your internal team' },
      { value: '0 back-and-forth', label: 'When customer details are submitted correctly' },
    ],
    [],
  );

  async function handleWaitlistSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await waitlistService.join({ email, fullName, companyName, role });
      if (result.status === 'already_joined') {
        toast.success("You're already on the waitlist.");
      } else {
        toast.success('You are on the waitlist. We will notify you when we launch.');
      }
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <SiteLogo imageClassName="h-10 md:h-11" />
          <Button asChild size="sm">
            <a href="#waitlist">Join waitlist</a>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(18,124,168,0.10),transparent_55%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-18 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1 text-xs font-medium">
                Coming soon · early access waitlist
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Stop chasing customer details just to send one invoice.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {APP_CONFIG.name} helps businesses turn a confirmed order into an invoice-ready workflow.
                You send one secure link, the customer fills in their billing details, and the system handles the next steps.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <a href="#waitlist">
                    {APP_CONFIG.waitlistCta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <Card key={stat.label} className="border-border/80 bg-card/70 shadow-none">
                    <CardContent className="p-5">
                      <p className="text-xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">What the product will do</p>
                    <p className="text-sm text-muted-foreground">Built for order-confirmation to invoice workflows</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    'Lock the order details and send one customer information link',
                    'Collect business, billing, and shipping information in one place',
                    'Generate invoices faster with less internal follow-up',
                    'Reduce repetitive admin work for teams handling many invoices per day',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-border/70 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <FeatureCard
                icon={Clock3}
                title="Save admin time"
                description="Avoid typing the same billing details repeatedly into your invoice workflow."
              />
              <FeatureCard
                icon={Mail}
                title="One secure customer link"
                description="Capture customer details in a clean workflow instead of messy email back-and-forth."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Structured information"
                description="Keep order details locked and collect customer information in a controlled format."
              />
              <FeatureCard
                icon={LockKeyhole}
                title="Private internal dashboard"
                description="Your operational dashboard remains for your team, while the public sees only the landing page."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">How it works</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              A simpler workflow from confirmed order to invoice.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We are building {APP_CONFIG.name} for teams that already know what was ordered but lose time collecting customer details and turning them into invoices.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {[
              {
                title: '1. Confirm the order',
                description: 'Your team locks the products, quantities, and pricing for the order.',
                icon: FileText,
              },
              {
                title: '2. Send one link',
                description: 'The customer receives a secure link to provide the required billing information.',
                icon: Mail,
              },
              {
                title: '3. Customer submits details',
                description: 'Business, billing, shipping, and contact details are captured in a structured form.',
                icon: Users,
              },
              {
                title: '4. Invoice workflow completes',
                description: 'The system prepares the invoice workflow without repeated manual follow-up.',
                icon: Sparkles,
              },
            ].map((step) => (
              <Card key={step.title} className="border-border/80 shadow-none">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="waitlist" className="border-y border-border/70 bg-card">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-18 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="max-w-xl">
              <Badge variant="secondary" className="mb-4">Join the waitlist</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Want early access when {APP_CONFIG.name} launches?
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Join the waitlist if you regularly create invoices, chase billing details, or run operations for a team that handles repeat B2B orders.
              </p>
              <div className="mt-8 space-y-4 text-sm text-muted-foreground">
                <p>Ideal for wholesalers, distributors, equipment businesses, and teams with repetitive invoice preparation work.</p>
                <p>We’ll use this list to share launch updates, onboarding invites, and early product access.</p>
              </div>
            </div>

            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <form className="space-y-5" onSubmit={handleWaitlistSubmit}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Priyans Kevadia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="Delmen Medical Supply"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Your role</Label>
                      <Input
                        id="role"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        placeholder="Operations, Sales, Admin"
                      />
                    </div>
                  </div>

                  <Button className="w-full sm:w-auto" size="lg" disabled={submitting}>
                    {submitting ? 'Joining waitlist…' : 'Join the waitlist'}
                  </Button>
                  <p className="text-xs leading-6 text-muted-foreground">
                    By joining, you agree to receive early product updates about {APP_CONFIG.name}. No spam.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">Frequently asked</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">A few quick answers.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <FaqCard
              question="Is the product live today?"
              answer="Not yet. The public site is a waitlist page while the core product is being completed."
            />
            <FaqCard
              question="Will the dashboard be public?"
              answer="No. The public website is the landing page. The operational dashboard remains for internal or invited users only."
            />
            <FaqCard
              question="Who is it for?"
              answer="Businesses that repeatedly create invoices after order confirmation and spend time collecting billing details manually."
            />
            <FaqCard
              question="What happens after I join the waitlist?"
              answer="You’ll receive launch updates and may be invited for early access or onboarding when the product is ready."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <SiteLogo imageClassName="h-8" />
            <span>© {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.</span>
          </div>
          <a href="#waitlist" className="hover:text-foreground">Join waitlist</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/80 bg-card shadow-none">
      <CardContent className="p-6">
        <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="p-6">
        <h3 className="font-semibold">{question}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
      </CardContent>
    </Card>
  );
}
