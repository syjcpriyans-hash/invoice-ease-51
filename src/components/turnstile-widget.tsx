import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cloudflare-turnstile-script";
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile could not load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Turnstile could not load."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function TurnstileWidget({
  action,
  onToken,
  resetKey = 0,
  theme = "light",
  className,
}: {
  action: "login" | "waitlist" | "customer_submit";
  onToken: (token: string) => void;
  resetKey?: number;
  theme?: "light" | "dark" | "auto";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const siteKey = import.meta.env
    .VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    let active = true;
    let widgetId: string | undefined;

    onToken("");

    if (!siteKey || !containerRef.current) {
      return () => {
        active = false;
      };
    }

    loadTurnstileScript()
      .then(() => {
        if (
          !active ||
          !containerRef.current ||
          !window.turnstile
        ) {
          return;
        }

        widgetId = window.turnstile.render(
          containerRef.current,
          {
            sitekey: siteKey,
            action,
            theme,
            size: "flexible",
            callback: (token) => {
              if (active) onToken(token);
            },
            "expired-callback": () => {
              if (active) onToken("");
            },
            "error-callback": () => {
              if (active) onToken("");
            },
          },
        );
      })
      .catch(() => {
        if (active) onToken("");
      });

    return () => {
      active = false;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [action, onToken, resetKey, siteKey, theme]);

  if (!siteKey) {
    return (
      <p
        role="alert"
        className="rounded-md border border-[#071226]/14 bg-[#071226]/4 px-3 py-2 text-xs text-[#071226]"
      >
        Security verification is not configured.
      </p>
    );
  }

  return (
    <div
      className={cn("min-h-[65px] w-full", className)}
      aria-label="Security verification"
    >
      <div ref={containerRef} />
    </div>
  );
}
