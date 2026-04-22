'use client';

import type { CardMeta } from '@/lib/utils/cardData';
import { RarityAurora } from './RarityAurora';

interface GraderPop {
  grader: string;
  color: string;
  total: number;
  segments: { label: string; count: number; opacity: number }[];
}

interface PopReportProps {
  card: CardMeta;
  dbData?: Record<string, unknown>[];
}

function buildGraderPops(dbData: Record<string, unknown>[]): GraderPop[] {
  const graderConfigs: { grader: string; color: string }[] = [
    { grader: 'PSA', color: 'var(--color-psa)' },
    { grader: 'BGS', color: 'var(--color-bgs-gold)' },
    { grader: 'CGC', color: 'var(--color-cgc)' },
    { grader: 'SGC', color: 'var(--color-sgc)' },
  ];

  const pops: GraderPop[] = [];

  for (const config of graderConfigs) {
    const snapshot = dbData.find((d) => d.grader === config.grader);
    if (!snapshot) continue;

    const total = (snapshot.total as number) || 0;
    if (total === 0) continue;

    let segments: { label: string; count: number; opacity: number }[];

    if (config.grader === 'BGS') {
      segments = [
        { label: 'BL', count: (snapshot.blackLabel as number) || 0, opacity: 1 },
        { label: '10', count: (snapshot.grade10 as number) || 0, opacity: 0.85 },
        { label: '9.5', count: (snapshot.grade95 as number) || 0, opacity: 0.7 },
        { label: '9', count: (snapshot.grade9 as number) || 0, opacity: 0.4 },
        { label: '≤8.5', count: ((snapshot.grade85 as number) || 0) + ((snapshot.grade8 as number) || 0) + ((snapshot.grade7AndBelow as number) || 0), opacity: 0.15 },
      ];
    } else if (config.grader === 'CGC') {
      segments = [
        { label: 'P10', count: (snapshot.cgcPerfect10 as number) || 0, opacity: 1 },
        { label: 'Pr10', count: (snapshot.cgcPristine10 as number) || 0, opacity: 0.9 },
        { label: 'GM10', count: (snapshot.cgcGemMint10 as number) || 0, opacity: 0.8 },
        { label: '9.5', count: (snapshot.grade95 as number) || 0, opacity: 0.6 },
        { label: '9', count: (snapshot.grade9 as number) || 0, opacity: 0.4 },
        { label: '≤8.5', count: ((snapshot.grade85 as number) || 0) + ((snapshot.grade8 as number) || 0) + ((snapshot.grade7AndBelow as number) || 0), opacity: 0.15 },
      ];
    } else {
      // PSA, SGC
      segments = [
        { label: '10', count: (snapshot.grade10 as number) || 0, opacity: 1 },
        { label: '9', count: (snapshot.grade9 as number) || 0, opacity: 0.7 },
        { label: '8', count: (snapshot.grade8 as number) || 0, opacity: 0.4 },
        { label: '≤7', count: (snapshot.grade7AndBelow as number) || 0, opacity: 0.15 },
      ];
    }

    pops.push({ ...config, total, segments: segments.filter(s => s.count > 0) });
  }

  return pops;
}

export function PopReport({ card, dbData }: PopReportProps) {
  // No data at all
  if (!dbData || dbData.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-8 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">No population data yet.</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Enter data via the admin panel or wait for sync.</p>
        </div>
      </div>
    );
  }

  const graderPops = buildGraderPops(dbData);
  const maxTotal = Math.max(...graderPops.map((g) => g.total), 1);

  // Extract data for aurora and BL spotlight
  const bgsSnapshot = dbData.find((d) => d.grader === 'BGS');
  const psaSnapshot = dbData.find((d) => d.grader === 'PSA');
  const cgcSnapshot = dbData.find((d) => d.grader === 'CGC');

  const blPop = (bgsSnapshot?.blackLabel as number) || 0;
  const bgsTotal = (bgsSnapshot?.total as number) || 0;

  const auroraPopData = {
    blackLabel: blPop,
    bgs10: (bgsSnapshot?.grade10 as number) || 0,
    cgc10: (cgcSnapshot?.grade10 as number) || 0,
    psa10: (psaSnapshot?.grade10 as number) || 0,
    totalGraded: graderPops.reduce((sum, g) => sum + g.total, 0),
  };

  return (
    <div className="space-y-8">
      {/* Rarity Aurora */}
      <RarityAurora card={card} popData={auroraPopData} />

      {/* Grade Distribution */}
      <div className="space-y-6">
        {graderPops.map((grader) => (
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
      {bgsSnapshot && (
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
                {blPop}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide uppercase mb-1">% of BGS</p>
              <p className="font-[var(--font-mono)] text-lg text-[var(--color-text-primary)]">
                {bgsTotal > 0 ? ((blPop / bgsTotal) * 100).toFixed(1) : '0'}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] tracking-wide uppercase mb-1">BGS Total</p>
              <p className="font-[var(--font-mono)] text-lg text-[var(--color-text-primary)]">
                {bgsTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
