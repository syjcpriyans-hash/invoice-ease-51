import { cn } from '@/lib/utils';

export function SiteLogo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)} aria-label="Invoice Ease">
      <svg
        viewBox="0 0 32 32"
        role="img"
        aria-hidden="true"
        className={cn('h-8 w-8 shrink-0', markClassName)}
      >
        <rect x="4.5" y="3.5" width="20" height="25" rx="5" fill="var(--surface)" stroke="var(--ink)" />
        <path d="M10 11.5h9M10 16h9M10 20.5h5.5" stroke="var(--primary-accent)" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 22.5h6.5M25 19l3.5 3.5L25 26" stroke="var(--primary-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark ? (
        <span className="font-heading text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base">
          Invoice Ease
        </span>
      ) : (
        <span className="sr-only">Invoice Ease</span>
      )}
    </div>
  );
}
