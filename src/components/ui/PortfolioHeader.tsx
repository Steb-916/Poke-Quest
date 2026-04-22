'use client';

import { AnimatedCounter } from './AnimatedCounter';

interface PortfolioHeaderProps {
  value?: number;
  cardCount?: number;
  blackLabels?: number;
  totalCards?: number;
}

export function PortfolioHeader({
  value = 0,
  cardCount = 15,
  blackLabels = 0,
  totalCards = 15,
}: PortfolioHeaderProps) {
  return (
    <div className="sticky top-16 z-40 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/60 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 flex items-center justify-between h-12">
        {/* Portfolio Value */}
        <div className="font-[var(--font-mono)] text-lg">
          <AnimatedCounter
            value={value}
            prefix="$"
            decimals={2}
            separateDecimals
            className="text-[var(--color-text-primary)]"
            decimalClassName="text-[var(--color-text-tertiary)]"
          />
        </div>

        {/* Card Count — hidden on mobile */}
        <div className="hidden md:block text-sm text-[var(--color-text-secondary)] tracking-wide">
          {cardCount} Cards
        </div>

        {/* Hunt Progress */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xs md:text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
            <AnimatedCounter value={blackLabels} className="text-[var(--color-text-secondary)]" />
            <span className="text-[var(--color-text-tertiary)]"> / {totalCards}</span>
          </span>
          <div className="w-16 md:w-24 h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
              style={{ width: `${totalCards > 0 ? (blackLabels / totalCards) * 100 : 0}%` }}
            />
          </div>
          <span className="hidden md:inline text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase">
            Black Labels
          </span>
        </div>
      </div>
    </div>
  );
}
