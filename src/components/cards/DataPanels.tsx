'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';
import { PriceHistory } from '@/components/charts/PriceHistory';
import { PopReport } from '@/components/charts/PopReport';
import { RecentSales } from '@/components/charts/RecentSales';

const TABS = [
  { id: 'price', label: 'Price History' },
  { id: 'pop', label: 'Pop Reports' },
  { id: 'sales', label: 'Recent Sales' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface DataPanelsProps {
  card: CardMeta;
}

export function DataPanels({ card }: DataPanelsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('price');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Tab Bar */}
      <div className="relative flex gap-1 border-b border-[var(--color-border-default)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium tracking-wide transition-colors duration-200',
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
          {activeTab === 'price' && <PriceHistory card={card} />}
          {activeTab === 'pop' && <PopReport card={card} />}
          {activeTab === 'sales' && <RecentSales card={card} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
