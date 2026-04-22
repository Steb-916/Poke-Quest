'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { SupplySignal } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils/cn';

interface SupplySignalsProps {
  data?: SupplySignal[];
}

const STATUS_CONFIG = {
  tight: { dot: '●', color: '#f59e0b', bg: 'bg-[#f59e0b]/15', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30', label: 'TIGHT' },
  stable: { dot: '○', color: 'var(--color-text-tertiary)', bg: 'bg-[var(--color-bg-hover)]', text: 'text-[var(--color-text-tertiary)]', border: 'border-[var(--color-border-default)]', label: 'STABLE' },
  surplus: { dot: '◇', color: '#22c55e', bg: 'bg-[#22c55e]/15', text: 'text-[#22c55e]', border: 'border-[#22c55e]/30', label: 'SURPLUS' },
};

export function SupplySignals({ data }: SupplySignalsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/50 p-6">
        <h3 className="font-[var(--font-display)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Supply Signals
        </h3>
        <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] mt-0.5 mb-4">
          Secondary Market Availability
        </p>
        <div className="py-8 text-center">
          <p className="text-[13px] text-[var(--color-text-tertiary)]">Sales tracking is building.</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Supply signals appear once we have recorded sales data.</p>
        </div>
      </div>
    );
  }

  // Group by status for dividers
  const groups: { status: string; signals: SupplySignal[] }[] = [];
  let currentGroup: { status: string; signals: SupplySignal[] } | null = null;
  for (const signal of data) {
    if (!currentGroup || currentGroup.status !== signal.status) {
      currentGroup = { status: signal.status, signals: [] };
      groups.push(currentGroup);
    }
    currentGroup.signals.push(signal);
  }

  let globalIndex = 0;

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/50 p-6">
      <h3 className="font-[var(--font-display)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
        Supply Signals
      </h3>
      <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] mt-0.5 mb-4">
        Secondary Market Availability
      </p>

      <div className="max-h-[480px] overflow-y-auto space-y-0">
        {groups.map((group, gi) => (
          <div key={group.status}>
            {gi > 0 && (
              <div className="my-2 border-t border-dashed border-[var(--color-border-default)]/40" />
            )}
            {group.signals.map((signal) => {
              const idx = globalIndex++;
              return <SignalRow key={signal.cardId} signal={signal} index={idx} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalRow({ signal, index }: { signal: SupplySignal; index: number }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = STATUS_CONFIG[signal.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      onMouseEnter={() => setTimeout(() => setShowTooltip(true), 400)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link href={`/card/${signal.slug}`}>
        <div className="hover-lift flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-[var(--color-bg-hover)]">
          <span className="text-xs" style={{ color: config.color }}>{config.dot}</span>
          <span className="text-sm text-[var(--color-text-primary)] flex-1">{signal.name}</span>
          <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
            {signal.recentSalesCount} sales / 14d
          </span>
          <span className={cn(
            'font-[var(--font-mono)] text-[10px] uppercase tracking-[0.1em] rounded px-2 py-0.5 border',
            config.bg, config.text, config.border
          )}>
            {config.label}
          </span>
        </div>
      </Link>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-8 top-full mt-1 z-20 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-hover)] rounded-md p-2.5 shadow-lg"
        >
          <div className="font-[var(--font-mono)] text-[11px] space-y-0.5">
            <p className="text-[var(--color-text-secondary)]">Last 14 days: {signal.recentSalesCount} sales</p>
            <p className="text-[var(--color-text-secondary)]">Previous 14 days: {signal.previousSalesCount} sales</p>
            <p className="text-[var(--color-text-secondary)]">Velocity: {signal.velocityChange > 0 ? '+' : ''}{Math.round(signal.velocityChange)}%</p>
            <p className="text-[var(--color-text-secondary)]">Last sale: {signal.daysSinceLastSale < 999 ? `${signal.daysSinceLastSale} days ago` : 'Never'}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
