'use client';

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
  const dollars = Math.floor(value).toLocaleString();
  const cents = (value % 1).toFixed(2).slice(1);

  return (
    <div className="sticky top-16 z-40 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/60 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-8 flex items-center justify-between h-12">
        {/* Portfolio Value */}
        <div className="font-[var(--font-mono)] text-lg">
          <span className="text-[var(--color-text-primary)]">${dollars}</span>
          <span className="text-[var(--color-text-tertiary)]">{cents}</span>
        </div>

        {/* Card Count */}
        <div className="text-sm text-[var(--color-text-secondary)] tracking-wide">
          {cardCount} Cards
        </div>

        {/* Hunt Progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
            {blackLabels}
            <span className="text-[var(--color-text-tertiary)]"> / {totalCards}</span>
          </span>
          <div className="w-24 h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
              style={{ width: `${totalCards > 0 ? (blackLabels / totalCards) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase">
            Black Labels
          </span>
        </div>
      </div>
    </div>
  );
}
