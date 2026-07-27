import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APP_CONFIG } from '@/config/app';
import { SiteLogo } from '@/components/site-logo';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_CONFIG.name}` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
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

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('Use a password with at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await signUp(email, password);
      if (result.needsEmailConfirmation) {
        toast.success('Account created. Check your email to confirm it, then sign in.');
      } else {
        toast.success('Account created');
        navigate({ to: '/settings', replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign-up failed');
    } finally {
      setSubmitting(false);
    }
  }

  const fields = (
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
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-center">
          <SiteLogo imageClassName="h-12" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business account</CardTitle>
            <CardDescription>
              Sign in to access the private dashboard and manage invoice workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form className="mt-4 space-y-5" onSubmit={handleSignIn}>
                  {fields}
                  <Button className="w-full" disabled={submitting}>
                    {submitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form className="mt-4 space-y-5" onSubmit={handleSignUp}>
                  {fields}
                  <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
                  <Button className="w-full" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
