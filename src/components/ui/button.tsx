import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A125]/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#071226] bg-[#071226] text-white hover:bg-[#071226]/92",
        destructive:
          "border border-[#071226] bg-[#071226] text-white hover:bg-[#071226]/92",
        outline:
          "border border-[#071226]/18 bg-[#FAF7F4] text-[#071226] hover:border-[#D5A125] hover:bg-[#D5A125]/8",
        secondary:
          "border border-[#D5A125] bg-[#D5A125] text-[#071226] hover:bg-[#D5A125]/88",
        ghost:
          "border border-transparent bg-transparent text-[#071226] hover:border-[#071226]/10 hover:bg-[#071226]/5",
        link:
          "h-auto rounded-none p-0 text-[#071226] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-5",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
