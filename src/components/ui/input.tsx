import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-[#071226]/18 bg-[#FAF7F4] px-3 text-sm text-[#071226] shadow-none transition-[border-color,box-shadow] placeholder:text-[#071226]/35 focus-visible:border-[#D5A125] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A125]/18 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
