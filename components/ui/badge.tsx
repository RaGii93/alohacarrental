import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3 focus-visible:border-[hsl(var(--ring))] focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--ring)/0.24)] aria-invalid:border-[hsl(var(--destructive))] aria-invalid:ring-[hsl(var(--destructive)/0.2)]",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] [a&]:hover:bg-[hsl(var(--primary)/0.9)]",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] [a&]:hover:bg-[hsl(var(--secondary)/0.9)]",
        destructive:
          "bg-[hsl(var(--destructive))] text-white [a&]:hover:bg-[hsl(var(--destructive)/0.9)] focus-visible:ring-[hsl(var(--destructive)/0.2)]",
        outline:
          "border-[hsl(var(--border))] text-[hsl(var(--foreground))] [a&]:hover:bg-[hsl(var(--accent))] [a&]:hover:text-[hsl(var(--accent-foreground))]",
        ghost: "[a&]:hover:bg-[hsl(var(--accent))] [a&]:hover:text-[hsl(var(--accent-foreground))]",
        link: "text-[hsl(var(--primary))] underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
