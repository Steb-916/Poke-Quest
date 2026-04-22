'use client';

import { motion } from 'framer-motion';

interface SectionDividerProps {
  title: string;
}

export function SectionDivider({ title }: SectionDividerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex items-center gap-4 my-12"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-default)] to-transparent" />
      <span className="font-[var(--font-display)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
        {title}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-default)] to-transparent" />
    </motion.div>
  );
}
