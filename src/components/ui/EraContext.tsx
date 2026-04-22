'use client';

export function EraContext() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-3">
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 font-[var(--font-mono)] text-[var(--color-accent)] uppercase tracking-wider">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          Out of Print
        </span>
        <span className="text-[var(--color-text-tertiary)] font-[var(--font-mono)]">
          Sword &amp; Shield era &middot; No new supply &middot; All prices reflect secondary market only
        </span>
      </div>
    </div>
  );
}
