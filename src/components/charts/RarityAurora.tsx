'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';

interface PopData {
  blackLabel: number;
  bgs10: number;
  cgc10: number;
  psa10: number;
  totalGraded: number;
}

interface RarityAuroraProps {
  card: CardMeta;
  popData?: PopData;
}

function ringThickness(pop: number, maxThickness: number = 18): number {
  if (pop === 0) return 1.5;
  return Math.max(2, Math.min(maxThickness, 2 + Math.log10(pop + 1) * 4));
}

export function RarityAurora({ card, popData }: RarityAuroraProps) {
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

  if (!popData || popData.totalGraded === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div style={{ width: 320, height: 320 }} className="relative flex items-center justify-center">
          <svg width={320} height={320} viewBox="0 0 320 320">
            {[62, 80, 98, 118, 140].map((r, i) => (
              <circle key={i} cx={160} cy={160} r={r} fill="none" stroke="var(--color-border-default)" strokeWidth={1} strokeDasharray="4 6" strokeOpacity={0.2} />
            ))}
          </svg>
          <span className="absolute text-xs text-[var(--color-text-tertiary)]">No grading data</span>
        </div>
      </div>
    );
  }

  const pop = popData;
  const hasData = true;

  const imageUrl = `https://images.pokemontcg.io/${card.setCode}/${card.cardNumber.split('/')[0]}.png`;

  const rings = [
    { id: 'bl', label: 'BGS Black Label', pop: pop.blackLabel, color: '#c9a84c', baseRadius: 62 },
    { id: 'bgs10', label: 'BGS 10 Pristine', pop: pop.bgs10, color: 'rgba(201,168,76,0.6)', baseRadius: 80 },
    { id: 'cgc10', label: 'CGC 10 Perfect', pop: pop.cgc10, color: 'rgba(21,101,192,0.8)', baseRadius: 98 },
    { id: 'psa10', label: 'PSA 10', pop: pop.psa10, color: 'rgba(211,47,47,0.8)', baseRadius: 118 },
    { id: 'total', label: 'Total Graded', pop: pop.totalGraded, color: 'rgba(138,138,154,0.4)', baseRadius: 140 },
  ];

  const size = 320;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Rings */}
          {rings.map((ring, i) => {
            const thickness = ringThickness(ring.pop);
            const isHovered = hoveredRing === ring.id;
            const isDimmed = hoveredRing !== null && !isHovered;
            const isDashed = ring.pop === 0;

            return (
              <motion.circle
                key={ring.id}
                cx={center}
                cy={center}
                initial={{ r: 0, opacity: 0 }}
                animate={{
                  r: ring.baseRadius,
                  opacity: isDimmed ? 0.2 : 1,
                }}
                transition={{
                  r: { delay: i * 0.08, duration: 0.6, type: 'spring', stiffness: 120, damping: 15 },
                  opacity: { duration: 0.2 },
                }}
                fill="none"
                stroke={ring.color}
                strokeWidth={thickness}
                strokeDasharray={isDashed ? '4 6' : 'none'}
                strokeLinecap="round"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredRing(ring.id)}
                onMouseLeave={() => setHoveredRing(null)}
              />
            );
          })}

          {/* BL pulse glow ring */}
          {pop.blackLabel > 0 && (
            <motion.circle
              cx={center}
              cy={center}
              r={62}
              fill="none"
              stroke="#c9a84c"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          )}

          {/* Center clip for card image */}
          <defs>
            <clipPath id={`aurora-clip-${card.slug}`}>
              <circle cx={center} cy={center} r={42} />
            </clipPath>
          </defs>
        </svg>

        {/* Card thumbnail in center */}
        <div
          className="absolute rounded-full overflow-hidden border-2 border-[var(--color-border-default)]"
          style={{
            width: 84,
            height: 84,
            top: center - 42,
            left: center - 42,
          }}
        >
          <Image
            src={imageUrl}
            alt={card.name}
            width={84}
            height={118}
            className="object-cover object-top scale-110"
          />
        </div>

        {/* No data label */}
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-[var(--color-text-tertiary)] mt-24">No grading data yet</span>
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredRing && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 shadow-lg z-10">
            {(() => {
              const ring = rings.find((r) => r.id === hoveredRing);
              if (!ring) return null;
              const pct = pop.totalGraded > 0 ? ((ring.pop / pop.totalGraded) * 100).toFixed(1) : '0';
              return (
                <>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{ring.label}</p>
                  <p className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
                    Pop: {ring.pop.toLocaleString()}
                  </p>
                  {ring.id !== 'total' && (
                    <p className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                      {pct}% of total
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
