'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

const TIME_RANGES = [
  { id: '1M', months: 1 },
  { id: '3M', months: 3 },
  { id: '6M', months: 6 },
  { id: '1Y', months: 12 },
  { id: 'ALL', months: Infinity },
] as const;

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  defaultVisible: boolean;
}

const SERIES: SeriesConfig[] = [
  { key: 'raw', label: 'Raw NM', color: '#8a8a9a', defaultVisible: true },
  { key: 'psa10', label: 'PSA 10', color: '#d32f2f', defaultVisible: true },
  { key: 'bgs10', label: 'BGS 10', color: '#c9a84c', defaultVisible: false },
  { key: 'bgsBlack', label: 'Black Label', color: '#ffffff', defaultVisible: true },
  { key: 'cgc10', label: 'CGC 10', color: '#1565c0', defaultVisible: false },
];

function formatPrice(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--color-accent)] bg-[var(--color-bg-tertiary)] p-3 shadow-lg">
      <p className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)] mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-[var(--color-text-secondary)]">{entry.name}</span>
          <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-primary)] ml-auto">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PriceHistoryProps {
  card: CardMeta;
  dbData?: Record<string, unknown>[];
}

export function PriceHistory({ card: _card, dbData }: PriceHistoryProps) {
  // Show empty state if dbData is explicitly an empty array
  if (dbData && dbData.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-8 min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">No price data yet.</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Data populates automatically via daily sync.</p>
        </div>
      </div>
    );
  }
  const [timeRange, setTimeRange] = useState('1Y');
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(SERIES.filter((s) => s.defaultVisible).map((s) => s.key))
  );

  const filteredData = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.id === timeRange);
    const data = (dbData || []) as Record<string, unknown>[];
    if (!range || range.months === Infinity) return data;
    return data.slice(-range.months);
  }, [timeRange]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Time Range */}
        <div className="flex flex-wrap gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={cn(
                'press-scale px-3 py-1 rounded text-xs font-[var(--font-mono)] font-medium',
                timeRange === range.id
                  ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              {range.id}
            </button>
          ))}
        </div>

        {/* Series Toggles */}
        <div className="flex flex-wrap gap-3">
          {SERIES.map((series) => {
            const isVisible = visibleSeries.has(series.key);
            return (
              <button
                key={series.key}
                onClick={() => toggleSeries(series.key)}
                className="flex items-center gap-1.5 text-xs transition-opacity duration-200"
                style={{ opacity: isVisible ? 1 : 0.4 }}
              >
                <span
                  className={cn('w-2 h-2 rounded-full', isVisible ? '' : 'border')}
                  style={{
                    backgroundColor: isVisible ? series.color : 'transparent',
                    borderColor: series.color,
                  }}
                />
                <span className="text-[var(--color-text-secondary)]">{series.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border-default)" strokeOpacity={0.3} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--color-border-default)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatPrice}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            {SERIES.map(
              (series) =>
                visibleSeries.has(series.key) && (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: series.color, stroke: '#fff', strokeWidth: 2 }}
                  />
                )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
