'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy-loaded chart components — only download when rendered
export const LazyPortfolioValueChart = dynamic(
  () => import('./PortfolioValueChart').then((m) => m.PortfolioValueChart),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-[1200px] py-6">
        <Skeleton className="w-32 h-3 mb-3" />
        <Skeleton className="w-48 h-8 mb-2" />
        <Skeleton variant="rect" className="w-full h-[180px]" />
      </div>
    ),
  }
);

export const LazyMarketMovers = dynamic(
  () => import('./MarketMovers').then((m) => m.MarketMovers),
  {
    ssr: false,
    loading: () => <Skeleton variant="rect" className="h-[400px]" />,
  }
);

export const LazySupplySignals = dynamic(
  () => import('./SupplySignals').then((m) => m.SupplySignals),
  {
    ssr: false,
    loading: () => <Skeleton variant="rect" className="h-[400px]" />,
  }
);

export const LazyScarcitySpectrum = dynamic(
  () => import('./ScarcitySpectrum').then((m) => m.ScarcitySpectrum),
  {
    ssr: false,
    loading: () => <Skeleton variant="rect" className="h-[80px]" />,
  }
);
