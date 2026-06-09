import { type Variants } from 'framer-motion';

// ==========================================
// FUSION8 MOTION SYSTEM
// Precision. Intelligence. Smoothness.
// ==========================================

/**
 * Structural Transitions
 * Spring physics used for page loads, modal opens, and layout changes.
 * No bouncy overshoots, just a fast, damped snap into place.
 */
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

/**
 * Micro-interactions
 * Extremely fast ease-outs for hovers, button presses, and focus states.
 */
export const microTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.15,
};

// ==========================================
// REUSABLE VARIANTS
// ==========================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const cardHoverScale: Variants = {
  hover: { scale: 1.01, y: -2, transition: { type: "tween", ease: "easeOut", duration: 0.15 } },
  tap: { scale: 0.98, transition: { type: "tween", ease: "easeOut", duration: 0.15 } },
};

export const aiReveal: Variants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' },
  show: { 
    opacity: 1, 
    height: 'auto',
    transition: { 
      height: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.4, delay: 0.1 }
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: { 
      height: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  }
};
