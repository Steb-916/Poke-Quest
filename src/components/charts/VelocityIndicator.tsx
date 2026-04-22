'use client';

import type { VelocityResult } from '@/lib/utils/calculations';

interface VelocityIndicatorProps {
  velocity?: VelocityResult | null;
}

export function VelocityIndicator({ velocity }: VelocityIndicatorProps) {
  if (!velocity) {
    return (
      <div className="rounded-md bg-[var(--color-bg-tertiary)]/60 px-4 py-3 mb-4">
        <span className="text-xs text-[var(--color-text-tertiary)]">No recorded sales to calculate velocity.</span>
      </div>
    );
  }

  const { recentCount, previousCount, velocityPercent, avgGapDays, status } = velocity;
  const isUp = velocityPercent > 10;
  const isDown = velocityPercent < -10;
  const arrow = isUp ? '▲' : isDown ? '▼' : '–';
  const arrowColor = isUp ? 'text-[var(--color-accent)]' : isDown ? 'text-[#ef4444]' : 'text-[var(--color-text-tertiary)]';

  return (
    <div className="rounded-md bg-[var(--color-bg-tertiary)]/60 px-4 py-3 mb-4 flex flex-wrap items-center gap-4">
      <span className={`text-sm ${arrowColor}`}>{arrow}</span>
      <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
        {recentCount} sales / 14d vs {previousCount} prior
      </span>
      {(isUp || isDown) && (
        <span className={`font-[var(--font-mono)] text-xs font-bold ${arrowColor}`}>
          {velocityPercent > 0 ? '+' : ''}{Math.round(velocityPercent)}%
        </span>
      )}
      {!isUp && !isDown && (
        <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">Stable</span>
      )}
      <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-tertiary)]">
        Avg gap: {avgGapDays}d
      </span>
    </div>
  );
}
