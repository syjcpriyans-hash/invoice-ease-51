import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";

type LegalSection = {
  id: string;
  label: string;
};

export function LegalPageLayout({
  title,
  description,
  effectiveDate,
  sections,
  children,
}: {
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#071226]">
      <header className="border-b border-[#071226]/10 bg-[#FAF7F4]">
        <div className="marketing-container flex h-16 items-center justify-between">
          <Link to="/" aria-label="Return to Billantra">
            <SiteLogo />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#071226]/60 hover:text-[#071226]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Billantra
          </Link>
        </div>
      </header>

      <main className="marketing-container py-10 lg:py-14">
        <div className="border-b border-[#071226]/10 pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D5A125]">
            Legal
          </p>
          <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#071226]/60">
            {description}
          </p>
          <p className="mt-4 text-xs font-medium text-[#071226]/48">
            Effective date: {effectiveDate}
          </p>
        </div>

        <div className="grid gap-10 py-9 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-between">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#071226]/45">
              On this page
            </p>
            <nav className="mt-3 border-l border-[#071226]/12">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block border-l border-transparent px-3 py-1.5 text-xs text-[#071226]/58 hover:border-[#D5A125] hover:text-[#071226]"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="legal-copy min-w-0">{children}</article>
        </div>
      </main>

      <footer className="border-t border-[#071226]/10">
        <div className="marketing-container flex flex-col gap-4 py-7 text-xs text-[#071226]/55 sm:flex-row sm:items-center">
          <SiteLogo />
          <div className="flex gap-5 sm:ml-auto">
            <Link to="/privacy" className="hover:text-[#071226]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#071226]">
              Terms
            </Link>
            <Link to="/" className="hover:text-[#071226]">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 border-b border-[#071226]/10 py-6 first:pt-0 last:border-b-0"
    >
      <h2 className="text-[18px] font-semibold tracking-[-0.025em] text-[#071226]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[13px] leading-7 text-[#071226]/68">
        {children}
      </div>
    </section>
  );
}
