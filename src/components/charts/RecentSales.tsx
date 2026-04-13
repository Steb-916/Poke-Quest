'use client';

import { useState, useMemo } from 'react';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

interface Sale {
  date: string;
  platform: string;
  grader: string;
  grade: string;
  price: number;
  link: string;
}

const GRADER_COLORS: Record<string, string> = {
  PSA: 'var(--color-psa)',
  BGS: 'var(--color-bgs-gold)',
  CGC: 'var(--color-cgc)',
  SGC: 'var(--color-sgc)',
  RAW: 'var(--color-text-tertiary)',
};

const MOCK_SALES: Sale[] = [
  { date: 'Mar 15, 2026', platform: 'eBay', grader: 'PSA', grade: '10', price: 2850, link: '#' },
  { date: 'Mar 12, 2026', platform: 'eBay', grader: 'BGS', grade: '9.5', price: 1920, link: '#' },
  { date: 'Mar 8, 2026', platform: 'Fanatics', grader: 'BGS', grade: 'Black Label', price: 33600, link: '#' },
  { date: 'Feb 28, 2026', platform: 'eBay', grader: 'CGC', grade: '10', price: 2100, link: '#' },
  { date: 'Feb 22, 2026', platform: 'eBay', grader: 'RAW', grade: 'NM', price: 1055, link: '#' },
  { date: 'Feb 15, 2026', platform: 'eBay', grader: 'PSA', grade: '9', price: 850, link: '#' },
  { date: 'Feb 10, 2026', platform: 'Whatnot', grader: 'PSA', grade: '10', price: 2780, link: '#' },
  { date: 'Feb 5, 2026', platform: 'eBay', grader: 'BGS', grade: '10', price: 3200, link: '#' },
  { date: 'Jan 28, 2026', platform: 'PWCC', grader: 'PSA', grade: '10', price: 2900, link: '#' },
  { date: 'Jan 20, 2026', platform: 'eBay', grader: 'SGC', grade: '10', price: 1800, link: '#' },
];

const GRADER_FILTERS = ['All', 'PSA', 'BGS', 'CGC', 'SGC'] as const;
const GRADE_FILTERS = ['All', '10+', '9-9.5', '<9'] as const;

interface RecentSalesProps {
  card: CardMeta;
}

export function RecentSales({ card: _card }: RecentSalesProps) {
  const [graderFilter, setGraderFilter] = useState<string>('All');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  const filteredSales = useMemo(() => {
    return MOCK_SALES.filter((sale) => {
      if (graderFilter !== 'All' && sale.grader !== graderFilter) return false;
      if (gradeFilter === '10+') {
        return sale.grade === '10' || sale.grade === 'Black Label' || sale.grade === 'NM';
      }
      if (gradeFilter === '9-9.5') {
        return sale.grade === '9' || sale.grade === '9.5';
      }
      if (gradeFilter === '<9') {
        const num = parseFloat(sale.grade);
        return !isNaN(num) && num < 9;
      }
      return true;
    });
  }, [graderFilter, gradeFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase">Grader:</span>
          <div className="flex gap-1">
            {GRADER_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setGraderFilter(f)}
                className={cn(
                  'px-2.5 py-0.5 rounded text-xs font-medium transition-all duration-200',
                  graderFilter === f
                    ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase">Grade:</span>
          <div className="flex gap-1">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setGradeFilter(f)}
                className={cn(
                  'px-2.5 py-0.5 rounded text-xs font-medium transition-all duration-200',
                  gradeFilter === f
                    ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--color-text-secondary)]">No recorded sales for this card.</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Sales data will appear here as transactions are tracked.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-default)]">
                {['Date', 'Platform', 'Grader', 'Grade', 'Price', ''].map((header) => (
                  <th
                    key={header}
                    className={cn(
                      'py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]',
                      header === 'Price' ? 'text-right' : 'text-left',
                      header === '' ? 'w-8' : ''
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale, i) => {
                const isBlackLabel = sale.grade === 'Black Label';
                return (
                  <tr
                    key={i}
                    className={cn(
                      'border-b border-[var(--color-border-default)] transition-colors duration-150 hover:bg-[var(--color-bg-hover)]',
                      i % 2 === 1 ? 'bg-[var(--color-bg-secondary)]/30' : ''
                    )}
                  >
                    <td className="py-2.5 font-[var(--font-mono)] text-sm text-[var(--color-text-secondary)]">
                      {sale.date}
                    </td>
                    <td className="py-2.5 text-sm text-[var(--color-text-secondary)]">
                      {sale.platform}
                    </td>
                    <td className="py-2.5 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: GRADER_COLORS[sale.grader] || '#888' }}
                        />
                        <span className="text-[var(--color-text-secondary)]">{sale.grader}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-sm">
                      <span
                        className={cn(
                          'font-[var(--font-mono)]',
                          isBlackLabel
                            ? 'font-bold text-[var(--color-bgs-gold)]'
                            : 'text-[var(--color-text-secondary)]'
                        )}
                      >
                        {sale.grade}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="text-[var(--color-text-tertiary)]">$</span>
                      <span className="font-[var(--font-mono)] text-sm text-[var(--color-text-primary)]">
                        {sale.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <a
                        href={sale.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors text-sm"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
