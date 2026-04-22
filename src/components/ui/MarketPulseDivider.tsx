'use client';

export function MarketPulseDivider() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-x-0 h-px bg-[var(--color-border-default)]/30" />
      <span className="relative z-10 bg-[var(--color-bg-primary)] px-6 font-[var(--font-display)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent)]">
        Market Pulse
      </span>
    </div>
  );
}
