import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { cardHoverScale } from "@/lib/motion"

interface MotionCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
}

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, hoverEffect = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={hoverEffect ? cardHoverScale : undefined}
        whileHover={hoverEffect ? "hover" : undefined}
        whileTap={hoverEffect ? "tap" : undefined}
        className={cn(
          "rounded-2xl border bg-card text-card-foreground shadow-sm transition-shadow",
          hoverEffect && "hover:shadow-lg hover:border-black/[0.08]",
          className
        )}
        {...props}
      />
    )
  }
)
MotionCard.displayName = "MotionCard"
