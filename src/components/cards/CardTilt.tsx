'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCardTilt } from '@/hooks/useCardTilt';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

interface CardTiltProps {
  card: CardMeta;
  index: number;
  trend?: { changePercent: number; direction: string } | null;
}

export function CardTilt({ card, index, trend }: CardTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { tiltStyle, shimmerStyle, isHovering, handlers } = useCardTilt(cardRef);

  const row = Math.floor(index / 3);
  const col = index % 3;
  const staggerDelay = row * 0.15 + col * 0.1;

  // pokemontcg.io image URL
  const imageUrl = `https://images.pokemontcg.io/${card.setCode}/${card.cardNumber.split('/')[0]}_hires.png`;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.5,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl cursor-pointer',
          'transition-shadow duration-300',
          'border border-[var(--color-border-default)]',
          isHovering
            ? 'shadow-[0_12px_40px_rgba(0,0,0,0.5)] border-[var(--color-border-hover)]'
            : 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        )}
        style={{
          ...tiltStyle,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        {...handlers}
      >
        {/* Card Image */}
        <div className="aspect-[5/7] relative">
          <Image
            src={imageUrl}
            alt={card.name}
            fill
            className="object-cover rounded-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 6}
          />

          {/* Holographic Shimmer Overlay */}
          <div
            className={cn(
              'absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
            style={shimmerStyle}
          />

          {/* Trend Indicator (top-right) */}
          {trend && trend.direction !== 'flat' && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5 z-10">
              <span className={cn(
                'font-[var(--font-mono)] text-[10px]',
                trend.direction === 'up' ? 'text-[var(--color-accent)]' : 'text-[var(--color-negative)]'
              )}>
                {trend.direction === 'up' ? '▲' : '▼'} {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Card Info Overlay (bottom) */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-4 rounded-b-xl',
              'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
              'transition-opacity duration-300',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          >
            <h3 className="font-[var(--font-display)] text-base font-semibold text-white tracking-tight">
              {card.name}
            </h3>
            <p className="font-[var(--font-mono)] text-xs text-white/60 mt-0.5">
              {card.set} &middot; {card.cardNumber}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
