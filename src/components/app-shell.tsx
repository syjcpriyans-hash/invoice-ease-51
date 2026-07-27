import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FilePlus2, FileText, LayoutDashboard, LogOut, Menu, Receipt, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Create Order", to: "/orders/new", icon: FilePlus2 },
  { label: "Orders", to: "/orders", icon: Receipt },
  { label: "Invoices", to: "/invoices", icon: FileText },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
        IF
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        {APP_CONFIG.name}
      </span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.to === "/orders"
            ? pathname === "/orders" || (pathname.startsWith("/orders/") && pathname !== "/orders/new")
            : pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      navigate({ to: "/login", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <BrandMark />
        <div className="mt-7 flex-1">
          <NavLinks />
        </div>
        <div className="space-y-2 border-t border-sidebar-border pt-4">
          <p className="truncate text-xs text-muted-foreground" title={user?.email}>
            {user?.email}
          </p>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar px-4 py-5">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrandMark />
              <div className="mt-7">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-6 border-t border-sidebar-border pt-4">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <BrandMark />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
