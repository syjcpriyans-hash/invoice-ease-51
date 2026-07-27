import { cn } from '@/lib/utils';

export function SiteLogo({
  className,
  imageClassName,
  showWordmark = true,
}: {
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/invoice-ease-logo.png"
        alt="Invoice Ease"
        className={cn('h-10 w-auto', imageClassName)}
      />
      {showWordmark ? (
        <span className="sr-only">Invoice Ease</span>
      ) : null}
    </div>
  );
}
