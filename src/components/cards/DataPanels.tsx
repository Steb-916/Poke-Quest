'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';
import { PriceHistory } from '@/components/charts/PriceHistory';
import { PopReport } from '@/components/charts/PopReport';
import { RecentSales } from '@/components/charts/RecentSales';
import { CardRadar } from '@/components/charts/CardRadar';
import { PricePerPop, FairValueBar } from '@/components/charts/TrendIndicators';
import type { VelocityResult, RadarScore } from '@/lib/utils/calculations';

const TABS = [
  { id: 'price', label: 'Price History' },
  { id: 'pop', label: 'Pop Reports' },
  { id: 'sales', label: 'Recent Sales' },
  { id: 'analysis', label: 'Analysis' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface DataPanelsProps {
  card: CardMeta;
  priceHistory?: Record<string, unknown>[];
  popData?: Record<string, unknown>[];
  recentSales?: Record<string, unknown>[];
  velocity?: VelocityResult | null;
  radarScores?: RadarScore[] | null;
}

export function DataPanels({ card, priceHistory, popData, recentSales, velocity, radarScores }: DataPanelsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('price');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Tab Bar */}
      <div className="relative flex gap-1 border-b border-[var(--color-border-default)] mb-6 overflow-x-auto scrollbar-hide" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex-shrink-0 px-4 py-2.5 text-sm font-medium tracking-wide transition-colors duration-200',
              activeTab === tab.id
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="data-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === 'price' && <PriceHistory card={card} dbData={priceHistory} />}
          {activeTab === 'pop' && <PopReport card={card} dbData={popData} />}
          {activeTab === 'sales' && <RecentSales card={card} dbData={recentSales} velocity={velocity} />}
          {activeTab === 'analysis' && (
            <div className="space-y-8">
              <CardRadar scores={radarScores || undefined} />
              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Black Label Metrics</h4>
                <PricePerPop price={33600} pop={138} />
                <FairValueBar low={28000} high={40000} current={33600} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
