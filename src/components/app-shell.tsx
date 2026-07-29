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
    <nav aria-label="Main navigation" className="space-y-1">
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
              "group flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors",
              active
                ? "bg-[#FAF7F4]/10 text-[#FAF7F4]"
                : "text-[#FAF7F4]/58 hover:bg-[#FAF7F4]/[0.06] hover:text-[#FAF7F4]",
            )}
          >
            <item.icon
              className={cn(
                "h-[17px] w-[17px]",
                active
                  ? "text-[#D5A125]"
                  : "text-[#FAF7F4]/38 group-hover:text-[#FAF7F4]",
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

function AccountBlock({
  email,
  onSignOut,
}: {
  email?: string;
  onSignOut: () => void;
}) {
  const initial = email?.charAt(0).toUpperCase() || "B";

  return (
    <div className="border-t border-[#FAF7F4]/10 pt-4">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D5A125] text-xs font-semibold text-[#071226]">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[#FAF7F4]">
            {email || "Billantra account"}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-[#FAF7F4]/36">
            Workspace owner
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md p-1.5 text-[#FAF7F4]/42 hover:bg-[#FAF7F4]/10 hover:text-[#FAF7F4]"
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
    <div className="min-h-screen bg-[#FAF7F4]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col bg-[#071226] px-4 py-5 lg:flex">
        <SiteLogo inverse className="px-2" />

        <p className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FAF7F4]/30">
          Operations
        </p>
        <div className="mt-2 flex-1">
          <NavLinks />
        </div>

        <Link
          to="/settings"
          className="mb-3 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#FAF7F4]/58 hover:bg-[#FAF7F4]/[0.06] hover:text-[#FAF7F4]"
        >
          <Settings
            className="h-[17px] w-[17px] text-[#FAF7F4]/38"
            strokeWidth={1.8}
          />
          Settings
        </Link>

        <AccountBlock email={user?.email} onSignOut={handleSignOut} />
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#071226]/10 bg-[#FAF7F4]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-3 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[284px] border-0 bg-[#071226] px-4 py-5"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SiteLogo inverse className="px-2" />
              <div className="mt-9">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-8">
                <AccountBlock email={user?.email} onSignOut={handleSignOut} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-3">
            <p className="hidden text-sm font-medium text-[#071226]/55 sm:block">
              Billantra operations
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/orders/new">
                <FilePlus2 className="h-4 w-4" />
                Create order
              </Link>
            </Button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#071226] text-xs font-semibold text-[#FAF7F4]">
              {user?.email?.charAt(0).toUpperCase() || "B"}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
