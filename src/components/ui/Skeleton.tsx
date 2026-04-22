'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-bg-hover)]',
        variant === 'line' && 'h-4 rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-lg',
        className
      )}
    />
  );
}

export function PortfolioValueSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-6">
      <Skeleton className="w-32 h-3 mb-3" />
      <Skeleton className="w-48 h-8 mb-2" />
      <Skeleton className="w-64 h-3 mb-6" />
      <Skeleton variant="rect" className="w-full h-[180px]" />
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="aspect-[5/7]" />
        ))}
      </div>
    </div>
  );
}

export function MarketPulseSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 pt-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <Skeleton variant="rect" className="h-[400px]" />
        <Skeleton variant="rect" className="h-[400px]" />
      </div>
    </div>
  );
}

export function DataPanelsSkeleton() {
  return (
    <div>
      <div className="flex gap-6 mb-6">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton variant="rect" className="w-full h-[300px]" />
    </div>
  );
}
