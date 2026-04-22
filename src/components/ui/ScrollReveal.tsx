'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ReactNode } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
}

const DIRECTIONS: Record<RevealDirection, { x?: number; y?: number }> = {
  up: { y: 1 },
  down: { y: -1 },
  left: { x: 1 },
  right: { x: -1 },
  fade: {},
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  once = true,
  className,
}: ScrollRevealProps) {
  const reduced = useReducedMotion();
  const offset = DIRECTIONS[direction];

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const initial = {
    opacity: 0,
    ...(offset.x !== undefined ? { x: offset.x * distance } : {}),
    ...(offset.y !== undefined ? { y: offset.y * distance } : {}),
  };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
