'use client';

import type { CardMeta } from '@/lib/utils/cardData';

interface GraderPop {
  grader: string;
  color: string;
  total: number;
  segments: { label: string; count: number; opacity: number }[];
}

const MOCK_POP: GraderPop[] = [
  {
    grader: 'PSA',
    color: 'var(--color-psa)',
    total: 28118,
    segments: [
      { label: '10', count: 19858, opacity: 1 },
      { label: '9', count: 5699, opacity: 0.7 },
      { label: '8', count: 1358, opacity: 0.4 },
      { label: '≤7', count: 1203, opacity: 0.15 },
    ],
  },
  {
    grader: 'BGS',
    color: 'var(--color-bgs-gold)',
    total: 2450,
    segments: [
      { label: 'BL', count: 138, opacity: 1 },
      { label: '10', count: 312, opacity: 0.85 },
      { label: '9.5', count: 890, opacity: 0.7 },
      { label: '9', count: 650, opacity: 0.4 },
      { label: '≤8.5', count: 460, opacity: 0.15 },
    ],
  },
  {
    grader: 'CGC',
    color: 'var(--color-cgc)',
    total: 4200,
    segments: [
      { label: '10P', count: 45, opacity: 1 },
      { label: '10', count: 520, opacity: 0.85 },
      { label: '9.5', count: 1800, opacity: 0.7 },
      { label: '9', count: 1100, opacity: 0.4 },
      { label: '≤8.5', count: 735, opacity: 0.15 },
    ],
  },
  {
    grader: 'SGC',
    color: 'var(--color-sgc)',
    total: 380,
    segments: [
      { label: '10', count: 210, opacity: 1 },
      { label: '9.5', count: 95, opacity: 0.7 },
      { label: '9', count: 50, opacity: 0.4 },
      { label: '≤8.5', count: 25, opacity: 0.15 },
    ],
  },
];

const MOCK_BLACK_LABEL = {
  population: 138,
  percentOfBgs: 5.6,
  trendSixMonths: 12,
};

interface PopReportProps {
  card: CardMeta;
}

export function PopReport({ card: _card }: PopReportProps) {
  const maxTotal = Math.max(...MOCK_POP.map((g) => g.total));

  return (
    <div className="space-y-8">
      {/* Grade Distribution */}
      <div className="space-y-6">
        {MOCK_POP.map((grader) => (
          <div key={grader.grader}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-[var(--font-display)] text-sm font-semibold" style={{ color: grader.color }}>
                {grader.grader}
              </span>
              <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                Total: {grader.total.toLocaleString()}
              </span>
            </div>

            {/* Stacked bar */}
            <div
              className="flex h-6 rounded overflow-hidden bg-[var(--color-bg-hover)]"
              style={{ width: `${Math.max((grader.total / maxTotal) * 100, 8)}%` }}
            >
              {grader.segments.map((seg) => (
                <div
                  key={seg.label}
                  className="h-full relative group cursor-default"
                  style={{
                    width: `${(seg.count / grader.total) * 100}%`,
                    backgroundColor: grader.color,
                    opacity: seg.opacity,
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                      <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]">
                        {seg.label}: {seg.count.toLocaleString()} ({((seg.count / grader.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-1.5">
              {grader.segments.map((seg) => (
                <span key={seg.label} className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]">
                  {seg.label}: {seg.count.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Black Label Spotlight */}
      <div className="rounded-lg border border-[var(--color-bgs-gold)] bg-[var(--color-bg-tertiary)] p-6 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">■</span>
          <span className="font-[var(--font-display)] text-sm font-bold tracking-wider text-[var(--color-bgs-gold)]">
            BGS BLACK LABEL
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide uppercase mb-1">Population</p>
            <p className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-text-primary)]">
              {MOCK_BLACK_LABEL.population}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide uppercase mb-1">% of BGS</p>
            <p className="font-[var(--font-mono)] text-lg text-[var(--color-text-primary)]">
              {MOCK_BLACK_LABEL.percentOfBgs}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide uppercase mb-1">6-Month Trend</p>
            <p className="font-[var(--font-mono)] text-lg text-[var(--color-positive)]">
              +{MOCK_BLACK_LABEL.trendSixMonths}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
