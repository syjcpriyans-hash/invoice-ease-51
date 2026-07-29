import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F4] px-4">
      <div className="max-w-md text-center">
        <img
          src="/brand/billantra-mark.png"
          alt=""
          className="mx-auto h-14 w-14 object-contain"
        />
        <h1 className="mt-7 text-6xl font-semibold text-[#071226]">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-[#071226]">
          Page not found
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#071226]/58">
          The page you requested does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center justify-center rounded-lg bg-[#071226] px-4 py-2.5 text-sm font-medium text-[#FAF7F4]"
        >
          Return to Billantra
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F4] px-4">
      <div className="max-w-md text-center">
        <img
          src="/brand/billantra-mark.png"
          alt=""
          className="mx-auto h-14 w-14 object-contain"
        />
        <h1 className="mt-7 text-2xl font-semibold text-[#071226]">
          This page did not load
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#071226]/58">
          Something went wrong. Refresh the page or return to the Billantra
          homepage.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[#071226] px-4 py-2.5 text-sm font-medium text-[#FAF7F4]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[#071226]/18 bg-[#FAF7F4] px-4 py-2.5 text-sm font-medium text-[#071226]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Billantra" },
      {
        name: "description",
        content:
          "Automated invoice operations for modern businesses.",
      },
      { name: "author", content: "Billantra" },
      { property: "og:title", content: "Billantra" },
      {
        property: "og:description",
        content:
          "From confirmed order to delivered invoice through one controlled workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href:
          "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.png",
        type: "image/png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    document.title = document.title
      .replaceAll("InvoiceFlow", "Billantra")
      .replaceAll("Invoice Ease", "Billantra");
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
