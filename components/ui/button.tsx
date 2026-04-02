import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_18px_40px_-24px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 hover:brightness-[1.03]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-95",
        outline:
          "border border-[rgba(228,98,170,0.34)] bg-white/95 text-[rgb(141,74,11)] shadow-[0_14px_34px_-28px_rgba(141,74,11,0.28)] hover:bg-[rgba(255,241,247,0.92)] hover:text-[rgb(120,62,9)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_18px_36px_-24px_rgba(228,98,170,0.5)] hover:-translate-y-0.5 hover:brightness-[1.03]",
        ghost: "text-[rgb(141,74,11)] hover:bg-[rgba(255,247,237,0.92)] hover:text-[rgb(120,62,9)]",
        link: "text-[rgb(141,74,11)] underline-offset-4 hover:text-[rgb(228,98,170)] hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
