import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  markClassName,
  imageClassName,
  showWordmark = true,
  inverse = false,
}: {
  className?: string;
  markClassName?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Billantra"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]",
          inverse ? "bg-[#FAF7F4]" : "bg-transparent",
        )}
      >
        <img
          src="/brand/billantra-mark.png"
          alt=""
          className={cn(
            "h-8 w-8 object-contain",
            markClassName,
            imageClassName,
          )}
        />
      </span>

      {showWordmark ? (
        <span
          className={cn(
            "text-[18px] font-semibold tracking-[-0.035em]",
            inverse ? "text-[#FAF7F4]" : "text-[#071226]",
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
