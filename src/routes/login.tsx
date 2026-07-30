import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteLogo } from "@/components/site-logo";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | Billantra" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, navigate, user]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    if (!turnstileToken) {
      toast.error("Complete the security verification.");
      return;
    }

    setSubmitting(true);

    try {
      await signIn(email, password, turnstileToken);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sign-in failed",
      );
    } finally {
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-[#FAF7F4] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="dark-surface hidden flex-col justify-between bg-[#071226] p-12 text-white lg:flex">
        <SiteLogo inverse />

        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D5A125]">
            Billantra operations
          </p>
          <h1 className="mt-5 text-[42px] font-semibold leading-tight tracking-[-0.045em]">
            One controlled workspace for every invoice after the sale.
          </h1>

          <div className="mt-9 space-y-4">
            {[
              "Collect complete customer information",
              "Generate professional invoice PDFs",
              "Track sent, delivered, bounced, and failed emails",
            ].map((point) => (
              <div
                key={point}
                className="flex items-center gap-3 text-sm text-[#FAF7F4]/68"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D5A125] text-[#071226]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {point}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#FAF7F4]/36">
          Secure access to the Billantra workspace.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden">
            <SiteLogo />
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#071226]/58 hover:text-[#071226] lg:mt-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Billantra
          </Link>

          <div className="mt-10">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D5A125] text-[#071226]">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.04em] text-[#071226]">
              Sign in to your workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#071226]/56">
              Enter the credentials connected to your Billantra account.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSignIn}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11"
                required
              />
            </div>

            <TurnstileWidget
              action="login"
              onToken={setTurnstileToken}
              resetKey={turnstileResetKey}
            />

            <Button
              className="h-11 w-full"
              disabled={submitting || !turnstileToken}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-center text-[10px] leading-5 text-[#071226]/48">
              By signing in, you agree to the{" "}
              <Link to="/terms" className="font-medium underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link to="/privacy" className="font-medium underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
