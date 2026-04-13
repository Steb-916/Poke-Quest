'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import type { MockOwnership } from '@/lib/utils/mockHuntData';
import { useHuntStore } from '@/lib/store';
import { ProgressRing } from './ProgressRing';
import { HuntStats } from './HuntStats';
import { HuntCard } from './HuntCard';
import { OwnershipDrawer } from './OwnershipDrawer';

interface HuntPageClientProps {
  sortedCards: CardMeta[];
  huntStatus: MockOwnership[];
  blAcquired: number;
  nextTarget: string;
}

export function HuntPageClient({ sortedCards, huntStatus, blAcquired, nextTarget }: HuntPageClientProps) {
  const { editingCardSlug, openDrawer, closeDrawer } = useHuntStore();
  const editingCard = editingCardSlug ? sortedCards.find((c) => c.slug === editingCardSlug) : null;

  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-[var(--font-display)] text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
            The Hunt
          </h1>
          <div className="h-px bg-[var(--color-accent)]/20 mt-3 mb-8" />
        </motion.div>

        {/* Hero: Progress Ring + Stats */}
        <div className="hunt-hero mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-start"
          >
            <ProgressRing acquired={blAcquired} total={15} />
          </motion.div>

          <HuntStats
            acquired={blAcquired}
            total={15}
            nextTarget={nextTarget}
            estRemaining={285000}
            portfolioIfComplete={504000}
          />
        </div>

        {/* Hunt Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCards.map((card, index) => {
            const status = huntStatus.find((s) => s.slug === card.slug);
            if (!status) return null;
            return (
              <HuntCard
                key={card.slug}
                card={card}
                status={status}
                index={index}
                onEdit={openDrawer}
              />
            );
          })}
        </div>
      </div>

      {/* Ownership Drawer */}
      <AnimatePresence>
        {editingCard && (
          <OwnershipDrawer card={editingCard} onClose={closeDrawer} />
        )}
      </AnimatePresence>
    </div>
  );
}
