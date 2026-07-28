import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/config/app';
import { SiteLogo } from '@/components/site-logo';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: `Team sign in — ${APP_CONFIG.name}` },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: '/dashboard', replace: true });
  }, [loading, navigate, user]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate({ to: '/dashboard', replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-center">
          <SiteLogo imageClassName="h-12" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team sign in</CardTitle>
            <CardDescription>
              This area is restricted to authorised Invoice Ease team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSignIn}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                    required
                  />
                </div>
              </div>

              <Button className="w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
