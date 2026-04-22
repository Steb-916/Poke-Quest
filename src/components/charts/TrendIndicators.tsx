'use client';

import { cn } from '@/lib/utils/cn';

export function TrendArrow({ change }: { change: number | null | undefined }) {
  if (change == null) return null;

  const direction = change > 2 ? 'up' : change < -2 ? 'down' : 'flat';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const color = direction === 'up'
    ? 'text-[var(--color-positive)]'
    : direction === 'down'
      ? 'text-[var(--color-negative)]'
      : 'text-[var(--color-text-tertiary)]';

  return (
    <span className={cn('font-[var(--font-mono)] text-xs ml-2', color)}>
      {arrow} {change > 0 ? '+' : ''}{change.toFixed(1)}%
    </span>
  );
}

export function PricePerPop({ price, pop }: { price: number | null; pop: number | null }) {
  if (!price || !pop || pop === 0) {
    return (
      <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
        — per pop point
      </span>
    );
  }

  const ratio = price / pop;
  return (
    <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
      ${Math.round(ratio).toLocaleString()} per pop point
    </span>
  );
}

export function FairValueBar({ low, high, current }: { low: number; high: number; current: number }) {
  const range = high - low;
  if (range <= 0) return null;

  const position = Math.max(0, Math.min(100, ((current - low) / range) * 100));

  return (
    <div className="mt-2">
      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1.5">
        Fair Value Range (based on comparable BL pops)
      </p>
      <div className="relative h-2 bg-[var(--color-bg-hover)] rounded-full">
        <div
          className="absolute top-0 bottom-0 rounded-full bg-[var(--color-accent)]/20"
          style={{ left: '0%', right: '0%' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg-primary)]"
          style={{ left: `${position}%`, transform: `translateX(-50%) translateY(-50%)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
          ${Math.round(low).toLocaleString()}
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]">
          ${Math.round(current).toLocaleString()}
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
          ${Math.round(high).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
