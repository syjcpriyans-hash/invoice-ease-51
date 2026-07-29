import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full resize-y rounded-md border border-[#071226]/18 bg-[#FAF7F4] px-3 py-2 text-sm leading-6 text-[#071226] shadow-none transition-[border-color,box-shadow] placeholder:text-[#071226]/35 focus-visible:border-[#D5A125] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A125]/18 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
