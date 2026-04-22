'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils/cn';

const TIME_RANGES = [
  { id: '1M', months: 1 },
  { id: '3M', months: 3 },
  { id: '6M', months: 6 },
  { id: '1Y', months: 12 },
  { id: 'ALL', months: Infinity },
] as const;

function formatValue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

interface PortfolioValueChartProps {
  dbData?: { date: string; value: number }[];
}

export function PortfolioValueChart({ dbData }: PortfolioValueChartProps) {
  const [timeRange, setTimeRange] = useState('ALL');

  const data = dbData && dbData.length > 0 ? dbData : [];

  const filteredData = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.id === timeRange);
    if (!range || range.months === Infinity) return data;
    return data.slice(-range.months);
  }, [timeRange, data]);

  if (data.length < 2) {
    return (
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-8 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Portfolio tracking begins with your next price sync.</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Value history will build over time as daily prices are collected.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 mb-4">
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

      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4">
        <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 768 ? 160 : 280}>
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border-default)" strokeOpacity={0.2} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--color-border-default)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-accent)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Portfolio']}
              labelStyle={{ color: 'var(--color-text-tertiary)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-accent)', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
