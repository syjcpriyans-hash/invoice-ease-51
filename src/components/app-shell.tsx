import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SiteLogo } from "@/components/site-logo";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Create order", to: "/orders/new", icon: FilePlus2 },
  { label: "Orders", to: "/orders", icon: Receipt },
  { label: "Invoices", to: "/invoices", icon: FileText },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.to === "/orders"
            ? pathname === "/orders" ||
              (pathname.startsWith("/orders/") && pathname !== "/orders/new")
            : pathname === item.to;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors",
              active
                ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            <item.icon
              className={cn(
                "h-[17px] w-[17px]",
                active ? "text-[#d7a927]" : "text-slate-500 group-hover:text-slate-300",
              )}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserPanel({
  email,
  onSignOut,
}: {
  email?: string;
  onSignOut: () => void;
}) {
  const initial = email?.charAt(0).toUpperCase() || "B";

  return (
    <div className="border-t border-white/[0.08] pt-4">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7a927] text-xs font-bold text-[#09162b]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{email || "Billantra account"}</p>
          <p className="text-[11px] text-slate-500">Workspace owner</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
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
    <div className="min-h-screen bg-[#f5f6f8]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-[#09162b] px-4 py-5 lg:flex">
        <SiteLogo inverse className="px-2" />
        <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Workspace
        </p>
        <div className="mt-2 flex-1">
          <NavLinks />
        </div>
        <Link
          to="/settings"
          className="mb-3 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white"
        >
          <Settings className="h-[17px] w-[17px] text-slate-500" strokeWidth={1.8} />
          Settings
        </Link>
        <UserPanel email={user?.email} onSignOut={handleSignOut} />
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#e4e7ec] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex w-full items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-0 bg-[#09162b] px-4 py-5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SiteLogo inverse className="px-2" />
                <div className="mt-8">
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
                <div className="mt-8">
                  <UserPanel email={user?.email} onSignOut={handleSignOut} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-[#e2e6eb] bg-[#fafbfc] px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Search orders and invoices</span>
              <span className="ml-auto rounded border border-[#dfe3e8] bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                ⌘ K
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
              </button>
              <div className="hidden h-8 w-px bg-[#e5e7eb] sm:block" />
              <button className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#09162b] text-[11px] font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() || "B"}
                </span>
                <span className="max-w-[150px] truncate">{user?.email}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
