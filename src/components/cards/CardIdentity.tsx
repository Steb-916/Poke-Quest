'use client';

import { motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import { TrendArrow } from '@/components/charts/TrendIndicators';

interface PriceData {
  rawMarket?: number | null;
  psa10?: number | null;
  bgs10Pristine?: number | null;
  bgs10BlackLabel?: number | null;
  cgc10Perfect?: number | null;
}

interface OwnershipData {
  acquired: boolean;
  condition?: string;
  grade?: string | null;
  labelType?: string | null;
}

interface CardIdentityProps {
  card: CardMeta;
  prices?: PriceData | null;
  ownership?: OwnershipData | null;
  trends?: Record<string, number | null> | null;
}

function formatPrice(value: number | null | undefined): string {
  if (value == null) return '$—';
  if (value >= 1000) return `$${Math.round(value).toLocaleString()}`;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CardIdentity({ card, prices, ownership, trends }: CardIdentityProps) {
  const priceRows = [
    { label: 'Raw NM', value: formatPrice(prices?.rawMarket), trend: trends?.rawMarket ?? null },
    { label: 'PSA 10', value: formatPrice(prices?.psa10), trend: trends?.psa10 ?? null },
    { label: 'BGS 10', value: formatPrice(prices?.bgs10Pristine), trend: trends?.bgs10Pristine ?? null },
    { label: 'Black Label', value: formatPrice(prices?.bgs10BlackLabel), highlight: true, trend: trends?.bgs10BlackLabel ?? null },
    { label: 'CGC 10', value: formatPrice(prices?.cgc10Perfect), trend: trends?.cgc10Perfect ?? null },
  ];

  const huntText = ownership?.acquired
    ? ownership.labelType === 'Black'
      ? 'Black Label Acquired'
      : `Owned: ${ownership.condition || ''} ${ownership.grade || ''}`.trim()
    : 'Hunting Black Label';

  const huntSubtext = ownership?.acquired
    ? ownership.labelType === 'Black'
      ? 'Quest complete for this card'
      : 'Upgrade to Black Label'
    : 'Not yet acquired';

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      <h1 className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent)]">
        {card.name}
      </h1>

      <p className="text-[var(--color-text-secondary)]">
        {card.set} &middot;{' '}
        <span className="font-[var(--font-mono)]">{card.cardNumber}</span>
      </p>

      <p className="text-sm text-[var(--color-text-tertiary)]">
        Illustrated by {card.illustrator}
      </p>

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

      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] tracking-wide mb-3">
          Current Market
        </h3>
        <div className="space-y-2">
          {priceRows.map(({ label, value, highlight, trend }) => (
            <div
              key={label}
              className={`flex items-center justify-between py-1 ${
                highlight ? 'bg-[var(--color-accent-dim)] -mx-2 px-2 rounded' : ''
              }`}
            >
              <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
              <span className="flex items-center">
                <span className="font-[var(--font-mono)] text-sm text-[var(--color-text-primary)]">
                  {value}
                </span>
                <TrendArrow change={trend} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
        <div>
          <p className="text-sm text-[var(--color-text-primary)]">{huntText}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{huntSubtext}</p>
        </div>
      </div>
    </motion.div>
  );
}
