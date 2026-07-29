import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  markClassName,
  showWordmark = true,
  inverse = false,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Billantra"
    >
      <img
        src="/brand/billantra-mark.png"
        alt=""
        className={cn(
          "h-8 w-8 shrink-0 object-contain",
          inverse && "brightness-0 invert",
          markClassName,
        )}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-heading text-[17px] font-semibold tracking-[-0.035em]",
            inverse ? "text-white" : "text-foreground",
          )}
        >
          Billantra
        </span>
      ) : (
        <span className="sr-only">Billantra</span>
      )}
    </div>
  );
}
