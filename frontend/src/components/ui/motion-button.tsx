import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"

export interface MotionButtonProps 
  extends HTMLMotionProps<"button">, 
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props as any}
      />
    )
  }
)
MotionButton.displayName = "MotionButton"
