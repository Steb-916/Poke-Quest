'use client';

import { motion } from 'framer-motion';

interface HuntStatsProps {
  acquired: number;
  total: number;
  nextTarget: string;
  estRemaining: number;
  portfolioIfComplete: number;
}

export function HuntStats({ acquired, total, nextTarget, estRemaining, portfolioIfComplete }: HuntStatsProps) {
  const stats = [
    { label: 'Acquired', value: `${acquired} / ${total}`, font: 'font-[var(--font-display)] text-2xl font-bold' },
    { label: 'Next Target', value: nextTarget, font: 'text-base text-[var(--color-accent)]' },
    { label: 'Est. Cost Remaining', value: `$${estRemaining.toLocaleString()}`, font: 'font-[var(--font-mono)] text-lg' },
    { label: 'Portfolio if Complete', value: `$${portfolioIfComplete.toLocaleString()}`, font: 'font-[var(--font-mono)] text-lg' },
  ];

  return (
    <div className="space-y-5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] mb-0.5">
            {stat.label}
          </p>
          <p className={`text-[var(--color-text-primary)] ${stat.font}`}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
