'use client';

import { useState, useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useCardTilt } from '@/hooks/useCardTilt';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

type Grader = 'RAW' | 'PSA' | 'BGS' | 'CGC' | 'SGC';
type BgsLabel = 'Silver' | 'Gold' | 'Black Label';

const GRADERS: Grader[] = ['RAW', 'PSA', 'BGS', 'CGC', 'SGC'];

const GRADER_STYLES: Record<string, { border: string; labelBg: string; labelText: string; accent: string }> = {
  PSA: {
    border: 'var(--color-psa)',
    labelBg: 'rgba(255,255,255,0.95)',
    labelText: '#d32f2f',
    accent: 'var(--color-psa)',
  },
  'BGS-Silver': {
    border: '#8a8a8a',
    labelBg: 'linear-gradient(135deg, #b0b0b0, #8a8a8a)',
    labelText: '#1a1a1a',
    accent: '#8a8a8a',
  },
  'BGS-Gold': {
    border: 'var(--color-bgs-gold)',
    labelBg: 'linear-gradient(135deg, #d4b84a, #c9a84c)',
    labelText: '#1a1a1a',
    accent: 'var(--color-bgs-gold)',
  },
  'BGS-Black Label': {
    border: '#1a1a1a',
    labelBg: '#0a0a0a',
    labelText: '#ffffff',
    accent: 'var(--color-bgs-gold)',
  },
  CGC: {
    border: 'var(--color-cgc)',
    labelBg: 'rgba(255,255,255,0.95)',
    labelText: '#1565c0',
    accent: 'var(--color-cgc)',
  },
  SGC: {
    border: 'var(--color-sgc)',
    labelBg: 'rgba(255,255,255,0.95)',
    labelText: '#2e7d32',
    accent: 'var(--color-sgc)',
  },
};

function getGradeText(grader: Grader, bgsLabel?: BgsLabel): string {
  switch (grader) {
    case 'PSA': return 'GEM MINT 10';
    case 'BGS':
      if (bgsLabel === 'Black Label') return 'PRISTINE 10 BLACK LABEL';
      if (bgsLabel === 'Gold') return 'PRISTINE 10';
      return 'GEM MINT 9.5';
    case 'CGC': return 'PRISTINE 10';
    case 'SGC': return 'GEM MINT 10';
    default: return '';
  }
}

function getSlabStyleKey(grader: Grader, bgsLabel?: BgsLabel): string {
  if (grader === 'BGS') return `BGS-${bgsLabel || 'Gold'}`;
  return grader;
}

interface RawCardDisplayProps {
  card: CardMeta;
  shimmerStyle: CSSProperties;
  isHovering: boolean;
}

function RawCardDisplay({ card, shimmerStyle, isHovering }: RawCardDisplayProps) {
  const imageUrl = `https://images.pokemontcg.io/${card.setCode}/${card.cardNumber.split('/')[0]}_hires.png`;

  return (
    <div className="relative rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
      <div className="border-[6px] border-[#f5f0e8] rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={card.name}
          width={340}
          height={476}
          className="block"
          sizes="340px"
          priority
        />
        <div
          className={cn(
            'absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300',
            isHovering ? 'opacity-100' : 'opacity-0'
          )}
          style={shimmerStyle}
        />
      </div>
    </div>
  );
}

interface SlabDisplayProps {
  card: CardMeta;
  grader: Grader;
  bgsLabel?: BgsLabel;
  shimmerStyle: CSSProperties;
  isHovering: boolean;
}

function SlabDisplay({ card, grader, bgsLabel, shimmerStyle, isHovering }: SlabDisplayProps) {
  const imageUrl = `https://images.pokemontcg.io/${card.setCode}/${card.cardNumber.split('/')[0]}_hires.png`;
  const styleKey = getSlabStyleKey(grader, bgsLabel);
  const styles = GRADER_STYLES[styleKey];
  const gradeText = getGradeText(grader, bgsLabel);
  const isBlackLabel = grader === 'BGS' && bgsLabel === 'Black Label';

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        border: `3px solid ${styles.border}`,
        boxShadow: isBlackLabel
          ? `0 0 20px rgba(201, 168, 76, 0.3), 0 8px 40px rgba(0,0,0,0.5)`
          : `0 8px 40px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="bg-[rgba(255,255,255,0.03)] p-3 pt-0">
        {/* Grader Label */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-b-md mb-3"
          style={{
            background: styles.labelBg,
          }}
        >
          <span
            className="font-[var(--font-display)] text-sm font-bold tracking-wider"
            style={{ color: styles.labelText }}
          >
            {grader}
          </span>
          <span
            className="font-[var(--font-mono)] text-xs font-semibold tracking-wide"
            style={{ color: styles.labelText }}
          >
            {gradeText}
          </span>
        </div>

        {/* Card Window */}
        <div className="mx-auto rounded overflow-hidden">
          <Image
            src={imageUrl}
            alt={card.name}
            width={320}
            height={448}
            className="block"
            sizes="320px"
            priority
          />
        </div>

        {/* Cert number placeholder */}
        <div className="text-center mt-2 pb-1">
          <span
            className="font-[var(--font-mono)] text-[10px] tracking-widest"
            style={{ color: styles.labelText, opacity: 0.5 }}
          >
            CERT# 00000000
          </span>
        </div>
      </div>

      {/* Shimmer overlay on entire slab */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300',
          isHovering ? 'opacity-100' : 'opacity-0'
        )}
        style={shimmerStyle}
      />

      {/* Subtle slab reflection */}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: 'linear-gradient(15deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
        }}
      />
    </div>
  );
}

interface GraderTabsProps {
  active: Grader;
  onChange: (grader: Grader) => void;
}

function GraderTabs({ active, onChange }: GraderTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
      {GRADERS.map((grader) => (
        <button
          key={grader}
          onClick={() => onChange(grader)}
          className={cn(
            'press-scale flex-shrink-0 px-4 py-1.5 rounded-md text-sm font-[var(--font-mono)] font-medium tracking-wide border',
            active === grader
              ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)]'
              : 'bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border-default)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
          )}
        >
          {grader}
        </button>
      ))}
    </div>
  );
}

interface BgsLabelTabsProps {
  active: BgsLabel;
  onChange: (label: BgsLabel) => void;
}

function BgsLabelTabs({ active, onChange }: BgsLabelTabsProps) {
  const labels: { value: BgsLabel; label: string }[] = [
    { value: 'Silver', label: 'Silver' },
    { value: 'Gold', label: 'Gold' },
    { value: 'Black Label', label: '■ Black Label' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase mr-1">
        Label:
      </span>
      {labels.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 border',
            active === value
              ? value === 'Black Label'
                ? 'bg-[#0a0a0a] text-white border-[var(--color-bgs-gold)] shadow-[0_0_8px_rgba(201,168,76,0.3)]'
                : value === 'Gold'
                  ? 'bg-[#c9a84c22] text-[var(--color-bgs-gold)] border-[var(--color-bgs-gold)]'
                  : 'bg-[#8a8a8a22] text-[#8a8a8a] border-[#8a8a8a]'
              : 'bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border-default)] hover:text-[var(--color-text-secondary)]'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface SlabViewerProps {
  card: CardMeta;
}

export function SlabViewer({ card }: SlabViewerProps) {
  const [activeGrader, setActiveGrader] = useState<Grader>('RAW');
  const [bgsLabel, setBgsLabel] = useState<BgsLabel>('Gold');
  const slabRef = useRef<HTMLDivElement>(null);
  const { tiltStyle, shimmerStyle, isHovering, handlers } = useCardTilt(slabRef, {
    maxTilt: 6,
    scaleHover: 1.02,
  });

  const slabKey = activeGrader === 'BGS' ? `${activeGrader}-${bgsLabel}` : activeGrader;

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-6"
    >
      {/* Slab Display */}
      <div
        ref={slabRef}
        style={{ ...tiltStyle, transformStyle: 'preserve-3d', willChange: 'transform' }}
        {...handlers}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slabKey}
            initial={{ opacity: 0.8, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeGrader === 'RAW' ? (
              <RawCardDisplay card={card} shimmerStyle={shimmerStyle} isHovering={isHovering} />
            ) : (
              <SlabDisplay
                card={card}
                grader={activeGrader}
                bgsLabel={activeGrader === 'BGS' ? bgsLabel : undefined}
                shimmerStyle={shimmerStyle}
                isHovering={isHovering}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Grader Tabs */}
      <GraderTabs active={activeGrader} onChange={setActiveGrader} />

      {/* BGS Sub-Tabs */}
      <AnimatePresence>
        {activeGrader === 'BGS' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <BgsLabelTabs active={bgsLabel} onChange={setBgsLabel} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
