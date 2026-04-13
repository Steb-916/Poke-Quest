'use client';

import { motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';

interface CardIdentityProps {
  card: CardMeta;
}

const PLACEHOLDER_PRICES: Record<string, { label: string; value: string; highlight?: boolean }[]> = {
  default: [
    { label: 'Raw NM', value: '$—' },
    { label: 'PSA 10', value: '$—' },
    { label: 'BGS 10', value: '$—' },
    { label: 'Black Label', value: '$—', highlight: true },
    { label: 'CGC 10', value: '$—' },
  ],
};

export function CardIdentity({ card }: CardIdentityProps) {
  const prices = PLACEHOLDER_PRICES.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Card Name */}
      <h1 className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent)]">
        {card.name}
      </h1>

      {/* Set & Number */}
      <p className="text-[var(--color-text-secondary)]">
        {card.set} &middot;{' '}
        <span className="font-[var(--font-mono)]">{card.cardNumber}</span>
      </p>

      {/* Illustrator */}
      <p className="text-sm text-[var(--color-text-tertiary)]">
        Illustrated by {card.illustrator}
      </p>

      {/* Attribute Pills */}
      <div className="flex gap-2">
        {[card.typing, card.stage, `${card.hp} HP`].map((attr) => (
          <span
            key={attr}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/20"
          >
            {attr}
          </span>
        ))}
      </div>

      {/* Market Snapshot */}
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] tracking-wide mb-3">
          Current Market
        </h3>
        <div className="space-y-2">
          {prices.map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`flex items-center justify-between py-1 ${
                highlight ? 'bg-[var(--color-accent-dim)] -mx-2 px-2 rounded' : ''
              }`}
            >
              <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
              <span className="font-[var(--font-mono)] text-sm text-[var(--color-text-primary)]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hunt Status */}
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
        <div>
          <p className="text-sm text-[var(--color-text-primary)]">Hunting Black Label</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Not yet acquired</p>
        </div>
      </div>
    </motion.div>
  );
}
