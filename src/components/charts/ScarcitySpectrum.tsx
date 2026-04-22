'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ScarcityEntry } from '@/lib/utils/calculations';

const TIER_COLORS: Record<string, string> = {
  mythic: 'var(--color-warning)',
  ultra: 'var(--color-accent)',
  rare: 'var(--color-text-secondary)',
  uncommon: 'var(--color-text-tertiary)',
};

interface ScarcitySpectrumProps {
  entries?: ScarcityEntry[];
}

export function ScarcitySpectrum({ entries }: ScarcitySpectrumProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[var(--color-text-tertiary)]">Black Label population data not yet available.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-1">
        {entries.map((entry) => {
          const color = TIER_COLORS[entry.tier] || 'var(--color-text-tertiary)';
          return (
            <Link key={entry.slug} href={`/card/${entry.slug}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
              <div className="flex items-center gap-2">
                <span style={{ color, fontSize: 10 }}>◆</span>
                <span className="text-sm text-[var(--color-text-primary)]">{entry.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-[var(--font-mono)] text-xs ${entry.blPop === 0 ? 'text-[var(--color-warning)] font-bold' : 'text-[var(--color-text-tertiary)]'}`}>
                  Pop: {entry.blPop === 0 ? 'NONE' : entry.blPop}
                </span>
                <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-wider" style={{ color }}>{entry.tier}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: horizontal spectrum */}
      <div className="hidden md:block">
      {/* Tier labels */}
      <div className="flex justify-between mb-2">
        <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.15em]" style={{ color: TIER_COLORS.mythic }}>Mythic (Pop 0)</span>
        <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Uncommon</span>
      </div>

      {/* Spectrum bar */}
      <div className="relative h-20 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] overflow-visible">
        <div className="absolute inset-0 rounded-lg" style={{ background: 'linear-gradient(to right, rgba(251,191,36,0.08), rgba(201,168,76,0.04), rgba(138,138,154,0.02))' }} />

        {entries.map((entry) => {
          const isHovered = hoveredSlug === entry.slug;
          const color = TIER_COLORS[entry.tier] || 'var(--color-text-tertiary)';

          return (
            <Link
              key={entry.slug}
              href={`/card/${entry.slug}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
              style={{ left: `${Math.max(3, Math.min(97, entry.position))}%` }}
              onMouseEnter={() => setHoveredSlug(entry.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            >
              <div
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: isHovered ? 14 : 10,
                  height: isHovered ? 14 : 10,
                  color,
                  fontSize: isHovered ? 14 : 10,
                  zIndex: isHovered ? 20 : 1,
                }}
              >
                ◆
              </div>

              {/* Label below */}
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <p className="font-[var(--font-mono)] text-[9px]" style={{ color: entry.blPop === 0 ? 'var(--color-warning)' : 'var(--color-text-tertiary)', fontWeight: entry.blPop === 0 ? 700 : 400 }}>
                  {entry.pokemon.substring(0, 3)}
                </p>
              </div>

              {/* Hover tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-30">
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{entry.name}</p>
                  <p className="font-[var(--font-mono)] text-[10px]" style={{ color: entry.blPop === 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                    BL Pop: {entry.blPop === 0 ? 'NONE' : entry.blPop}
                  </p>
                  <p className="font-[var(--font-mono)] text-[9px] uppercase text-[var(--color-text-tertiary)]">{entry.tier}</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
      </div>{/* end hidden md:block */}
    </div>
  );
}
