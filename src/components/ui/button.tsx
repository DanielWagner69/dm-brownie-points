import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 whitespace-normal text-center leading-snug [overflow-wrap:normal] [word-break:normal]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:brightness-110",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-border hover:border-primary/40 hover:bg-muted",
        outline:
          "border-2 border-primary/45 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary",
        ghost: "hover:bg-muted text-foreground",
        soft: "bg-accent text-accent-foreground shadow-sm hover:brightness-105",
        danger: "bg-danger text-danger-foreground shadow-md shadow-danger/20 hover:brightness-110",
      },
      size: {
        default: "min-h-[44px] h-auto px-4 py-2.5",
        sm: "min-h-[36px] h-auto rounded-lg px-3 py-1.5 text-xs",
        lg: "min-h-[48px] h-auto rounded-2xl px-6 py-3 text-base",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] shrink-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
