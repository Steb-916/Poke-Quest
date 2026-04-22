'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import type { MockOwnership } from '@/lib/utils/mockHuntData';
import { cn } from '@/lib/utils/cn';

interface HuntCardProps {
  card: CardMeta;
  status: MockOwnership;
  index: number;
  onEdit?: (slug: string) => void;
}

export function HuntCard({ card, status, index, onEdit }: HuntCardProps) {
  const state = status.isBlackLabel ? 'acquired' : status.acquired ? 'owned' : 'hunting';

  const row = Math.floor(index / 3);
  const col = index % 3;
  const staggerDelay = row * 0.12 + col * 0.08;

  const imageUrl = `https://images.pokemontcg.io/${card.setCode}/${card.cardNumber.split('/')[0]}_hires.png`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/card/${card.slug}`}>
        <div
          className={cn(
            'relative rounded-xl overflow-hidden transition-all duration-300 group',
            state === 'acquired' && 'ring-2 ring-[var(--color-bgs-gold)] glow-pulse',
            state === 'owned' && 'border border-[var(--color-border-hover)]',
            state === 'hunting' && 'border border-dashed border-[var(--color-border-default)]',
          )}
        >
          {/* Card Image */}
          <div className="aspect-[5/7] relative">
            <Image
              src={imageUrl}
              alt={card.name}
              width={340}
              height={476}
              className={cn(
                'object-cover w-full h-full transition-all duration-300',
                state === 'acquired' && 'brightness-100 saturate-100',
                state === 'owned' && 'brightness-[0.8]',
                state === 'hunting' && 'brightness-[0.4] saturate-[0.3]',
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {/* Edit Button — top-left, visible on hover */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(card.slug);
                }}
                className="absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]/80 backdrop-blur-sm text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-text-primary)] hover:border hover:border-[var(--color-accent)] transition-all duration-200 sm:opacity-0 max-sm:opacity-100"
                aria-label={`Edit ${card.name}`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 1.5l2 2L4 10H2v-2z" />
                </svg>
              </button>
            )}

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Top: Status Badge */}
              <div className="flex justify-end">
                {state === 'acquired' && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-bgs-gold)] text-black text-xs font-bold uppercase tracking-wider">
                    &#10003; Black Label
                  </span>
                )}
                {state === 'owned' && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-bg-tertiary)]/80 text-[var(--color-text-secondary)] text-xs font-medium backdrop-blur-sm">
                    {status.bestGrader} {status.bestGrade}
                  </span>
                )}
                {state === 'hunting' && (
                  <span className="px-3 py-1 rounded-full border border-[var(--color-border-default)] text-[var(--color-text-tertiary)] text-xs backdrop-blur-sm">
                    Not Acquired
                  </span>
                )}
              </div>

              {/* Bottom: Card Info */}
              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent -mx-4 -mb-4 px-4 pb-4 pt-8">
                <h3 className={cn(
                  'font-[var(--font-display)] text-sm font-semibold tracking-tight',
                  state === 'acquired' ? 'text-[var(--color-bgs-gold)]' : 'text-white',
                )}>
                  {card.name}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-[var(--font-mono)] text-xs text-white/50">
                    {card.set}
                  </p>
                  <p className={cn(
                    'font-[var(--font-mono)] text-xs',
                    status.blPop === 0 ? 'text-[var(--color-warning)]' : 'text-white/40',
                  )}>
                    BL Pop: {status.blPop === 0 ? 'NONE' : status.blPop}
                  </p>
                </div>
                {state === 'owned' && !status.isBlackLabel && (
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 tracking-wide">
                    Upgrade to Black Label
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
