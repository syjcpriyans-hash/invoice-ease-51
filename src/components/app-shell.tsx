import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Main navigation" className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active =
          item.to === "/orders"
            ? pathname === "/orders" ||
              (pathname.startsWith("/orders/") &&
                pathname !== "/orders/new")
            : pathname === item.to;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] font-medium text-white transition-colors",
              active
                ? "bg-white/10"
                : "hover:bg-white/[0.06]",
            )}
          >
            {active ? (
              <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#D5A125]" />
            ) : null}
            <item.icon
              className="h-4 w-4 text-white"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="text-white">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceAccount({
  email,
  onSignOut,
}: {
  email?: string;
  onSignOut: () => void;
}) {
  return (
    <div className="border-t border-white/14 pt-3">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D5A125] text-[11px] font-semibold text-[#071226]">
          {email?.charAt(0).toUpperCase() || "B"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-white">
            {email || "Billantra account"}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-white">
            Workspace owner
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md p-1.5 text-white hover:bg-white/10"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 text-white" />
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
    <div className="billantra-app min-h-screen bg-[#FAF7F4]">
      <aside className="dark-surface fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col bg-[#071226] px-3 py-4 lg:flex">
        <SiteLogo inverse className="px-2" />
        <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
          Operations
        </p>
        <div className="mt-2 flex-1">
          <NavLinks />
        </div>
        <Link
          to="/settings"
          className="mb-3 flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] font-medium text-white hover:bg-white/[0.06]"
        >
          <Settings className="h-4 w-4 text-white" strokeWidth={1.8} />
          <span className="text-white">Settings</span>
        </Link>
        <WorkspaceAccount email={user?.email} onSignOut={handleSignOut} />
      </aside>

      <div className="lg:pl-[224px]">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[#071226]/10 bg-[#FAF7F4]/96 px-4 backdrop-blur sm:px-5 lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="dark-surface w-[260px] border-0 bg-[#071226] px-3 py-4"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SiteLogo inverse className="px-2" />
              <div className="mt-7">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-7">
                <WorkspaceAccount
                  email={user?.email}
                  onSignOut={handleSignOut}
                />
              </div>
            </SheetContent>
          </Sheet>

          <p className="text-[12px] font-medium text-[#071226]/52">
            Billantra operations
          </p>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/orders/new">
                <FilePlus2 className="h-3.5 w-3.5" />
                Create order
              </Link>
            </Button>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#071226] text-[10px] font-semibold text-white">
              {user?.email?.charAt(0).toUpperCase() || "B"}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-5 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
