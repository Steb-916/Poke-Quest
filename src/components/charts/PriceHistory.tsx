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

const MOCK_PRICE_DATA = [
  { date: '2025-04', raw: 980, psa10: 2400, bgs10: 2900, bgsBlack: 28000, cgc10: 1800 },
  { date: '2025-05', raw: 1020, psa10: 2500, bgs10: 3000, bgsBlack: 29500, cgc10: 1850 },
  { date: '2025-06', raw: 1050, psa10: 2650, bgs10: 3100, bgsBlack: 31000, cgc10: 1900 },
  { date: '2025-07', raw: 1010, psa10: 2550, bgs10: 3050, bgsBlack: 30500, cgc10: 1870 },
  { date: '2025-08', raw: 1080, psa10: 2700, bgs10: 3150, bgsBlack: 31500, cgc10: 1950 },
  { date: '2025-09', raw: 1040, psa10: 2600, bgs10: 3080, bgsBlack: 30800, cgc10: 1920 },
  { date: '2025-10', raw: 1060, psa10: 2750, bgs10: 3200, bgsBlack: 32000, cgc10: 2000 },
  { date: '2025-11', raw: 1030, psa10: 2680, bgs10: 3100, bgsBlack: 31200, cgc10: 1980 },
  { date: '2025-12', raw: 1070, psa10: 2720, bgs10: 3180, bgsBlack: 32500, cgc10: 2050 },
  { date: '2026-01', raw: 1045, psa10: 2760, bgs10: 3200, bgsBlack: 33000, cgc10: 2080 },
  { date: '2026-02', raw: 1060, psa10: 2780, bgs10: 3180, bgsBlack: 33200, cgc10: 2090 },
  { date: '2026-03', raw: 1055, psa10: 2800, bgs10: 3200, bgsBlack: 33600, cgc10: 2100 },
];

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
    if (!range || range.months === Infinity) return MOCK_PRICE_DATA;
    return MOCK_PRICE_DATA.slice(-range.months);
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
        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={cn(
                'px-3 py-1 rounded text-xs font-[var(--font-mono)] font-medium transition-all duration-200',
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
