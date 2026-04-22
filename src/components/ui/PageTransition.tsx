'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <main>{children}</main>;
  }

  const isCardRoute = pathname.startsWith('/card/');
  const isHuntRoute = pathname === '/hunt';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{
          opacity: 0,
          y: isCardRoute ? 12 : isHuntRoute ? 0 : 8,
        }}
        animate={{ opacity: 1, y: 0 }}
        exit={{
          opacity: 0,
          y: isCardRoute ? -12 : isHuntRoute ? 0 : -8,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
