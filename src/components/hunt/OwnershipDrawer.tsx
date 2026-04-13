'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

const GRADE_OPTIONS: Record<string, string[]> = {
  PSA: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'Authentic'],
  BGS: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6'],
  CGC: ['10 (Perfect)', '10 (Pristine)', '9.5', '9', '8.5', '8', '7.5', '7'],
  SGC: ['10', '9.5', '9', '8.5', '8', '7', '6'],
};

const SOURCE_OPTIONS = ['eBay', 'Fanatics', 'Whatnot', 'PWCC', 'Local Shop', 'Private Sale', 'Other'];

interface OwnershipDrawerProps {
  card: CardMeta;
  onClose: () => void;
}

export function OwnershipDrawer({ card, onClose }: OwnershipDrawerProps) {
  const [owned, setOwned] = useState(false);
  const [condition, setCondition] = useState('RAW');
  const [grade, setGrade] = useState('');
  const [labelType, setLabelType] = useState('Gold');
  const [certNumber, setCertNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseSource, setPurchaseSource] = useState('');
  const [notes, setNotes] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const isGraded = condition !== 'RAW';
  const isBgs = condition === 'BGS';
  const isBlackLabel = isBgs && grade === '10' && labelType === 'Black Label';

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = useCallback(async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardSlug: card.slug,
          condition,
          grade: isGraded ? grade : undefined,
          labelType: isBgs ? labelType : undefined,
          certNumber: isGraded ? certNumber : undefined,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
          purchaseDate: purchaseDate || undefined,
          purchaseSource: purchaseSource || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch {
      setSaveState('error');
    }
  }, [card.slug, condition, grade, labelType, certNumber, purchasePrice, purchaseDate, purchaseSource, notes, isGraded, isBgs]);

  const handleRemove = useCallback(async () => {
    try {
      await fetch('/api/ownership', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardSlug: card.slug }),
      });
      onClose();
    } catch {
      setSaveState('error');
    }
  }, [card.slug, onClose]);

  const imageUrl = `https://images.pokemontcg.io/${card.setCode}/${card.cardNumber.split('/')[0]}_hires.png`;

  const inputClass = 'w-full h-10 px-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm focus:border-[var(--color-accent)] focus:outline-none transition-colors';
  const labelClass = 'block text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-tertiary)] mb-1.5';

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-[var(--color-bg-primary)]/60"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[70] w-full sm:w-[420px]',
          'bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-default)]',
          'overflow-y-auto',
          isBlackLabel && 'border-l-[var(--color-bgs-gold)]'
        )}
      >
        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            &#10005;
          </button>

          {/* Card Header */}
          <div className="flex items-center gap-4 mb-6 pr-8">
            <div className="w-16 h-[90px] relative rounded overflow-hidden flex-shrink-0">
              <Image src={imageUrl} alt={card.name} width={64} height={90} className="object-cover" />
            </div>
            <div>
              <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
                {card.name}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">{card.set}</p>
            </div>
          </div>

          <div className="h-px bg-[var(--color-border-default)] mb-6" />

          {/* Ownership Status */}
          <h3 className={labelClass}>Ownership Status</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">Do you own this card?</p>

          <div className="flex gap-4 mb-6">
            {[false, true].map((val) => (
              <button
                key={String(val)}
                onClick={() => setOwned(val)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                  owned === val
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-hover)]'
                )}
              >
                <span className={cn('w-3 h-3 rounded-full border-2', owned === val ? 'border-[var(--color-accent)] bg-[var(--color-accent)]' : 'border-[var(--color-text-tertiary)]')} />
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>

          {/* Conditional Fields */}
          {owned && (
            <div className="space-y-4">
              {/* Grading Company */}
              <div>
                <label className={labelClass}>Grading Company</label>
                <select value={condition} onChange={(e) => { setCondition(e.target.value); setGrade(''); }} className={inputClass}>
                  {['RAW', 'PSA', 'BGS', 'CGC', 'SGC'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Grade */}
              {isGraded && (
                <div>
                  <label className={labelClass}>Grade</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass}>
                    <option value="">Select grade...</option>
                    {GRADE_OPTIONS[condition]?.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}

              {/* BGS Label Type */}
              {isBgs && (
                <div>
                  <label className={labelClass}>Label Type</label>
                  <select value={labelType} onChange={(e) => setLabelType(e.target.value)} className={inputClass}>
                    {['Silver', 'Gold', 'Black Label'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              {/* Cert Number */}
              {isGraded && (
                <div>
                  <label className={labelClass}>Cert Number</label>
                  <input type="text" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="e.g. 12345678" className={inputClass} />
                </div>
              )}

              {/* Purchase Price */}
              <div>
                <label className={labelClass}>Purchase Price</label>
                <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" step="0.01" className={inputClass} />
              </div>

              {/* Purchase Date */}
              <div>
                <label className={labelClass}>Purchase Date</label>
                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={inputClass} />
              </div>

              {/* Source */}
              <div>
                <label className={labelClass}>Source</label>
                <select value={purchaseSource} onChange={(e) => setPurchaseSource(e.target.value)} className={inputClass}>
                  <option value="">Select source...</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Any additional notes..."
                  className={cn(inputClass, 'h-auto py-2 resize-none')}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={cn(
                'w-full h-11 rounded-lg font-semibold text-sm transition-all',
                saveState === 'saved'
                  ? 'bg-[var(--color-positive)] text-black'
                  : 'bg-[var(--color-accent)] text-black hover:brightness-110'
              )}
            >
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? '✓ Saved' : 'Save Changes'}
            </button>

            {saveState === 'error' && (
              <p className="text-xs text-[var(--color-negative)] text-center">Failed to save. Please try again.</p>
            )}

            {owned && (
              <>
                {!showRemoveConfirm ? (
                  <button
                    onClick={() => setShowRemoveConfirm(true)}
                    className="w-full h-11 rounded-lg border border-[var(--color-negative)] text-[var(--color-negative)] text-sm font-medium hover:bg-[var(--color-negative)]/10 transition-colors"
                  >
                    Remove Ownership
                  </button>
                ) : (
                  <div className="rounded-lg border border-[var(--color-negative)] p-3">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                      Remove ownership record? This can&apos;t be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRemove}
                        className="flex-1 h-9 rounded bg-[var(--color-negative)] text-white text-xs font-medium"
                      >
                        Confirm Remove
                      </button>
                      <button
                        onClick={() => setShowRemoveConfirm(false)}
                        className="flex-1 h-9 rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
