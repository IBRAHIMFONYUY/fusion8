'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { aiReveal } from '@/lib/motion';

interface AIRevealProps {
  isVisible: boolean;
  children: ReactNode;
  className?: string;
}

export function AIReveal({ isVisible, children, className }: AIRevealProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={aiReveal}
          initial="hidden"
          animate="show"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
