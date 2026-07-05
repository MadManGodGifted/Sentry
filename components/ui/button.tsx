import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border text-xs font-bold uppercase tracking-normal transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#53d6e8] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "border-[#c58b29]/70 bg-transparent text-[#e9e4d8] hover:bg-[#c58b29]/16",
        danger: "border-[#e5483b]/70 bg-transparent text-[#e9e4d8] hover:bg-[#e5483b]/16",
        ghost:
          "border-[#232323] bg-transparent text-[#e9e4d8] hover:border-[#53d6e8]/60 hover:bg-[#53d6e8]/10"
      },
      size: {
        sm: "h-8 px-3",
        icon: "h-8 w-8"
      }
    },
    defaultVariants: {
      variant: "ghost",
      size: "sm"
    }
  }
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
