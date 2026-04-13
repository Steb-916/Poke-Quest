'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardOption {
  slug: string;
  name: string;
}

interface UsageData {
  pokemontcg: { used: number; limit: number; period: string };
  pricetracker: { used: number; limit: number; period: string };
  soldcomps: { used: number; limit: number; period: string };
}

const TABS = ['Pop Reports', 'Sales Entry', 'Price Override', 'Triggers'] as const;
const GRADERS = ['PSA', 'BGS', 'CGC', 'SGC'] as const;
const PLATFORMS = ['eBay', 'Fanatics', 'Whatnot', 'PWCC', 'Local Shop', 'Private Sale', 'Other'];

interface AdminClientProps {
  cardOptions: CardOption[];
}

export function AdminClient({ cardOptions }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/usage');
      const data = await res.json();
      setUsage(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const inputClass = 'w-full h-10 px-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm focus:border-[var(--color-accent)] focus:outline-none';
  const labelClass = 'block text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-tertiary)] mb-1.5';

  return (
    <div>
      {/* Usage Dashboard */}
      {usage && (
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4 mb-8">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">API Usage</h3>
          <div className="space-y-3">
            {(['pokemontcg', 'pricetracker', 'soldcomps'] as const).map((service) => {
              const s = usage[service];
              const pct = s.limit > 0 ? (s.used / s.limit) * 100 : 0;
              return (
                <div key={service} className="flex items-center gap-4">
                  <span className="w-28 text-xs text-[var(--color-text-secondary)]">
                    {service === 'pokemontcg' ? 'pokemontcg.io' : service === 'pricetracker' ? 'PriceTracker' : 'SoldComps'}
                  </span>
                  <div className="flex-1 h-2 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: pct > 80 ? 'var(--color-negative)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                  <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)] w-32 text-right">
                    {s.used} / {s.limit} {s.period === 'day' ? 'today' : 'this month'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border-default)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'text-[var(--color-text-primary)] border-[var(--color-accent)]'
                : 'text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Pop Reports' && (
        <PopEntryTab cardOptions={cardOptions} labelClass={labelClass} inputClass={inputClass} showToast={showToast} />
      )}
      {activeTab === 'Sales Entry' && (
        <SalesEntryTab cardOptions={cardOptions} labelClass={labelClass} inputClass={inputClass} showToast={showToast} />
      )}
      {activeTab === 'Price Override' && (
        <PriceOverrideTab cardOptions={cardOptions} labelClass={labelClass} inputClass={inputClass} showToast={showToast} />
      )}
      {activeTab === 'Triggers' && (
        <TriggersTab showToast={showToast} onRefreshUsage={fetchUsage} />
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-medium shadow-lg z-50',
          toast.type === 'success' ? 'bg-[var(--color-positive)] text-black' : 'bg-[var(--color-negative)] text-white'
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ── Pop Entry Tab ──
function PopEntryTab({ cardOptions, labelClass, inputClass, showToast }: {
  cardOptions: CardOption[]; labelClass: string; inputClass: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [cardSlug, setCardSlug] = useState(cardOptions[0]?.slug || '');
  const [grader, setGrader] = useState('PSA');
  const [fields, setFields] = useState<Record<string, string>>({ total: '', grade10: '', blackLabel: '', grade95: '', grade9: '', grade85: '', grade8: '', grade7AndBelow: '', authentic: '' });
  const [bulk, setBulk] = useState(false);
  const [bulkData, setBulkData] = useState<Record<string, Record<string, string>>>({});

  const handleSave = async () => {
    try {
      const payload = bulk
        ? cardOptions.map((c) => ({
            cardSlug: c.slug, grader,
            total: parseInt(bulkData[c.slug]?.total || '0'),
            grade10: parseInt(bulkData[c.slug]?.grade10 || '0'),
            blackLabel: parseInt(bulkData[c.slug]?.blackLabel || '0'),
            grade95: parseInt(bulkData[c.slug]?.grade95 || '0'),
            grade9: parseInt(bulkData[c.slug]?.grade9 || '0'),
            grade85: parseInt(bulkData[c.slug]?.grade85 || '0'),
            grade8: parseInt(bulkData[c.slug]?.grade8 || '0'),
            grade7AndBelow: parseInt(bulkData[c.slug]?.grade7AndBelow || '0'),
            authentic: parseInt(bulkData[c.slug]?.authentic || '0'),
          }))
        : {
            cardSlug, grader,
            total: parseInt(fields.total || '0'),
            grade10: parseInt(fields.grade10 || '0'),
            blackLabel: parseInt(fields.blackLabel || '0'),
            grade95: parseInt(fields.grade95 || '0'),
            grade9: parseInt(fields.grade9 || '0'),
            grade85: parseInt(fields.grade85 || '0'),
            grade8: parseInt(fields.grade8 || '0'),
            grade7AndBelow: parseInt(fields.grade7AndBelow || '0'),
            authentic: parseInt(fields.authentic || '0'),
          };

      const res = await fetch('/api/admin/pop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast('Pop report saved!', 'success');
      else showToast('Failed to save', 'error');
    } catch { showToast('Failed to save', 'error'); }
  };

  const isBgs = grader === 'BGS';
  const gradeFields = ['total', 'grade10', ...(isBgs ? ['blackLabel'] : []), 'grade95', 'grade9', 'grade85', 'grade8', 'grade7AndBelow', 'authentic'] as const;
  const gradeLabels: Record<string, string> = { total: 'Total', grade10: '10', blackLabel: 'BL', grade95: '9.5', grade9: '9', grade85: '8.5', grade8: '8', grade7AndBelow: '≤7', authentic: 'Auth' };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={bulk} onChange={(e) => setBulk(e.target.checked)} className="rounded" />
          Bulk Mode
        </label>
        <div>
          <label className={labelClass}>Grader</label>
          <select value={grader} onChange={(e) => setGrader(e.target.value)} className={cn(inputClass, 'w-32')}>
            {GRADERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {!bulk ? (
        <div className="space-y-3 max-w-md">
          <div>
            <label className={labelClass}>Card</label>
            <select value={cardSlug} onChange={(e) => setCardSlug(e.target.value)} className={inputClass}>
              {cardOptions.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          {gradeFields.map((f) => (
            <div key={f}>
              <label className={labelClass}>{gradeLabels[f]}</label>
              <input type="number" value={(fields as Record<string, string>)[f] || ''} onChange={(e) => setFields({ ...fields, [f]: e.target.value })} className={inputClass} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="text-left py-2 text-xs text-[var(--color-text-tertiary)]">Card</th>
                {gradeFields.map((f) => <th key={f} className="px-1 py-2 text-xs text-[var(--color-text-tertiary)]">{gradeLabels[f]}</th>)}
              </tr>
            </thead>
            <tbody>
              {cardOptions.map((card) => (
                <tr key={card.slug} className="border-b border-[var(--color-border-default)]">
                  <td className="py-1 pr-2 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{card.name}</td>
                  {gradeFields.map((f) => (
                    <td key={f} className="px-1 py-1">
                      <input
                        type="number"
                        value={bulkData[card.slug]?.[f] || ''}
                        onChange={(e) => setBulkData({ ...bulkData, [card.slug]: { ...bulkData[card.slug], [f]: e.target.value } })}
                        className={cn(inputClass, 'w-16 h-8 text-xs px-1')}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={handleSave} className="mt-6 px-6 h-10 rounded-lg bg-[var(--color-accent)] text-black font-semibold text-sm">
        {bulk ? 'Save All' : 'Save Pop Report'}
      </button>
    </div>
  );
}

// ── Sales Entry Tab ──
function SalesEntryTab({ cardOptions, labelClass, inputClass, showToast }: {
  cardOptions: CardOption[]; labelClass: string; inputClass: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({ cardSlug: cardOptions[0]?.slug || '', date: '', platform: 'eBay', grader: 'PSA', grade: '10', price: '', shippingCost: '', listingUrl: '', notes: '' });
  const [recentSales, setRecentSales] = useState<Record<string, unknown>[]>([]);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sale');
      const data = await res.json();
      setRecentSales(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price || '0'), shippingCost: form.shippingCost ? parseFloat(form.shippingCost) : undefined }),
      });
      if (res.ok) { showToast('Sale saved!', 'success'); fetchRecent(); }
      else showToast('Failed to save', 'error');
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sale?')) return;
    try {
      await fetch('/api/admin/sale', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      showToast('Sale deleted', 'success');
      fetchRecent();
    } catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div>
          <label className={labelClass}>Card</label>
          <select value={form.cardSlug} onChange={(e) => setForm({ ...form, cardSlug: e.target.value })} className={inputClass}>
            {cardOptions.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div><label className={labelClass}>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} /></div>
        <div>
          <label className={labelClass}>Platform</label>
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputClass}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Grader</label>
          <select value={form.grader} onChange={(e) => setForm({ ...form, grader: e.target.value })} className={inputClass}>
            {['RAW', ...GRADERS].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div><label className={labelClass}>Grade</label><input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={inputClass} /></div>
        <div><label className={labelClass}>Price ($)</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} /></div>
        <div><label className={labelClass}>Shipping ($)</label><input type="number" step="0.01" value={form.shippingCost} onChange={(e) => setForm({ ...form, shippingCost: e.target.value })} className={inputClass} /></div>
        <div><label className={labelClass}>Listing URL</label><input value={form.listingUrl} onChange={(e) => setForm({ ...form, listingUrl: e.target.value })} className={inputClass} /></div>
        <div className="col-span-2"><label className={labelClass}>Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} /></div>
      </div>
      <button onClick={handleSave} className="mt-4 px-6 h-10 rounded-lg bg-[var(--color-accent)] text-black font-semibold text-sm">Save Sale</button>

      {recentSales.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm text-[var(--color-text-secondary)] mb-3">Recent Entries</h4>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--color-border-default)]">
              {['Date', 'Card', 'Grader', 'Grade', 'Price', ''].map((h) => <th key={h} className="text-left py-2 text-xs text-[var(--color-text-tertiary)]">{h}</th>)}
            </tr></thead>
            <tbody>
              {recentSales.map((sale: Record<string, unknown>) => (
                <tr key={sale.id as string} className="border-b border-[var(--color-border-default)]">
                  <td className="py-2 font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">{String(sale.date).split('T')[0]}</td>
                  <td className="py-2 text-xs text-[var(--color-text-secondary)]">{(sale.card as Record<string, string>)?.name}</td>
                  <td className="py-2 text-xs">{sale.grader as string}</td>
                  <td className="py-2 text-xs font-[var(--font-mono)]">{sale.grade as string}</td>
                  <td className="py-2 text-xs font-[var(--font-mono)]">${(sale.price as number)?.toLocaleString()}</td>
                  <td className="py-2"><button onClick={() => handleDelete(sale.id as string)} className="text-[var(--color-negative)] text-xs hover:underline">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Price Override Tab ──
function PriceOverrideTab({ cardOptions, labelClass, inputClass, showToast }: {
  cardOptions: CardOption[]; labelClass: string; inputClass: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [cardSlug, setCardSlug] = useState(cardOptions[0]?.slug || '');
  const [source, setSource] = useState('Manual');
  const [prices, setPrices] = useState({ rawMarket: '', psa10: '', bgs10Pristine: '', bgs10BlackLabel: '', bgs95: '', cgc10Perfect: '', cgc10Pristine: '' });

  const handleSave = async () => {
    const payload: Record<string, unknown> = { cardSlug, source };
    for (const [k, v] of Object.entries(prices)) {
      if (v) payload[k] = parseFloat(v);
    }
    try {
      const res = await fetch('/api/admin/price', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) showToast('Price snapshot saved!', 'success');
      else showToast('Failed to save', 'error');
    } catch { showToast('Failed to save', 'error'); }
  };

  const priceFields = [
    { key: 'rawMarket', label: 'Raw NM' },
    { key: 'psa10', label: 'PSA 10' },
    { key: 'bgs10Pristine', label: 'BGS 10 Pristine' },
    { key: 'bgs10BlackLabel', label: 'BGS Black Label' },
    { key: 'bgs95', label: 'BGS 9.5' },
    { key: 'cgc10Perfect', label: 'CGC 10 Perfect' },
    { key: 'cgc10Pristine', label: 'CGC 10 Pristine' },
  ];

  return (
    <div className="max-w-md space-y-3">
      <div><label className={labelClass}>Card</label>
        <select value={cardSlug} onChange={(e) => setCardSlug(e.target.value)} className={inputClass}>
          {cardOptions.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <div><label className={labelClass}>Source</label>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
          {['Manual', 'eBay', 'TCGPlayer'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {priceFields.map(({ key, label }) => (
        <div key={key}><label className={labelClass}>{label} ($)</label>
          <input type="number" step="0.01" value={(prices as Record<string, string>)[key] || ''} onChange={(e) => setPrices({ ...prices, [key]: e.target.value })} placeholder="Leave empty to skip" className={inputClass} />
        </div>
      ))}
      <button onClick={handleSave} className="px-6 h-10 rounded-lg bg-[var(--color-accent)] text-black font-semibold text-sm">Save Price Snapshot</button>
    </div>
  );
}

// ── Triggers Tab ──
function TriggersTab({ showToast, onRefreshUsage }: {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefreshUsage: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerCron = async (path: string, name: string) => {
    setLoading(name);
    try {
      const res = await fetch(path, {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${name} completed: ${JSON.stringify(data).substring(0, 80)}`, 'success');
        onRefreshUsage();
      } else {
        showToast(`${name} failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch {
      showToast(`${name} failed`, 'error');
    }
    setLoading(null);
  };

  const triggers = [
    { path: '/api/cron/prices', name: 'Fetch Prices', description: 'Fetches raw prices from pokemontcg.io for all 15 cards' },
    { path: '/api/cron/pop', name: 'Fetch PSA Pop', description: 'Fetches PSA population reports (automated scraping not yet configured)' },
    { path: '/api/cron/sales', name: 'Fetch Sales', description: 'Fetches eBay sold data via SoldComps for all 15 cards' },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      {triggers.map((t) => (
        <div key={t.path} className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-4">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{t.name}</h4>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1 mb-3">{t.description}</p>
          <button
            onClick={() => triggerCron(t.path, t.name)}
            disabled={loading === t.name}
            className={cn(
              'px-4 h-9 rounded-lg text-sm font-medium transition-colors',
              loading === t.name
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]'
                : 'bg-[var(--color-accent)] text-black hover:brightness-110'
            )}
          >
            {loading === t.name ? 'Running...' : `Run ${t.name}`}
          </button>
        </div>
      ))}
    </div>
  );
}
