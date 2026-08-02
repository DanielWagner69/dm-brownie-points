import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-normal text-left leading-snug [overflow-wrap:normal] [word-break:normal]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        soft: "border-transparent bg-accent/20 text-accent-foreground",
        outline: "border-border text-muted-foreground",
        positive: "border-transparent bg-positive/15 text-positive",
        negative: "border-transparent bg-danger/15 text-danger",
        pending: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
