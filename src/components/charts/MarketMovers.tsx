'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { MarketMover } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils/cn';

type TimeWindow = '7D' | '30D' | '90D';

interface MarketMoversData {
  gainers: MarketMover[];
  losers: MarketMover[];
  flat: MarketMover[];
}

interface MarketMoversProps {
  moversByWindow?: Record<TimeWindow, MarketMoversData>;
}

const WINDOWS: TimeWindow[] = ['7D', '30D', '90D'];

function formatPrice(value: number): string {
  if (value >= 1000) return `$${Math.round(value).toLocaleString()}`;
  return `$${value.toFixed(2)}`;
}

export function MarketMovers({ moversByWindow }: MarketMoversProps) {
  const [activeWindow, setActiveWindow] = useState<TimeWindow>('30D');

  const data = moversByWindow?.[activeWindow];
  const hasData = data && (data.gainers.length > 0 || data.losers.length > 0);

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-[var(--font-display)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            Market Movers
          </h3>
          <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
            Price Movement
          </p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWindow(w)}
              className={cn(
                'press-scale px-2.5 py-1 rounded text-[10px] font-[var(--font-mono)] font-medium border',
                activeWindow === w
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/40'
                  : 'text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]'
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="py-8 text-center">
          <p className="text-[13px] text-[var(--color-text-tertiary)]">Market data is building.</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">Price movement appears once we have 7+ days of price tracking.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Gainers */}
          {data.gainers.map((mover, i) => (
            <MoverRow key={mover.cardId} mover={mover} index={i} />
          ))}

          {/* Divider */}
          {data.gainers.length > 0 && data.losers.length > 0 && (
            <div className="my-3 border-t border-dashed border-[var(--color-border-default)]/40" />
          )}

          {/* Losers */}
          {data.losers.map((mover, i) => (
            <MoverRow key={mover.cardId} mover={mover} index={data.gainers.length + i} />
          ))}

          {/* Footnote */}
          <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] italic mt-4">
            Compared using {data.gainers[0]?.priceField === 'psa10' ? 'PSA 10 market prices' : 'raw NM prices'} where available.
          </p>
        </div>
      )}
    </div>
  );
}

function MoverRow({ mover, index }: { mover: MarketMover; index: number }) {
  const isUp = mover.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/card/${mover.slug}`}>
        <div className="hover-lift flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-[var(--color-bg-hover)]">
          <span className={cn('text-sm', isUp ? 'text-[var(--color-accent)]' : 'text-[#ef4444]')}>
            {isUp ? '▲' : '▼'}
          </span>
          <span className="text-sm text-[var(--color-text-primary)] flex-1">{mover.name}</span>
          <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">
            {formatPrice(mover.currentPrice)}
          </span>
          <span className={cn('font-[var(--font-mono)] text-[13px] w-16 text-right', isUp ? 'text-[var(--color-accent)]' : 'text-[#ef4444]')}>
            {isUp ? '+' : ''}{mover.changePercent.toFixed(1)}%
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
