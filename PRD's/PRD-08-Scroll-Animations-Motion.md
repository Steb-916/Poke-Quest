# PRD-08: Scroll Animations, Page Transitions & Motion Polish

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 08 (Motion Layer)  
**Depends on:** PRD-07a and PRD-07b complete, all pages rendering with real data

---

## 1. Overview

This PRD makes the site feel alive. Right now, content either appears instantly or uses basic Framer Motion fades. Navigation between routes cuts hard. Cards below the fold sometimes stay invisible on fast scroll. Buttons feel flat. Data-dependent sections show nothing while queries resolve. This PRD fixes all of it.

The work divides into five categories:

| Category | Impact | Complexity |
|----------|--------|------------|
| Scroll-triggered reveals | High — first impression of polish | Medium |
| Page transitions | High — currently jarring route cuts | Medium |
| Card grid scroll bug fix | High — content literally invisible | Low |
| Button micro-interactions | Medium — tactile feedback | Low |
| Loading skeletons | Medium — perceived performance | Medium |

### 1.1 What Already Exists

These components are already built from partial PRD-06b work and can be used directly:

- `AnimatedCounter` — number count-up animation ✅
- `PageTransition` — Framer Motion wrapper (exists but not wired into layout) ✅
- `SectionDivider` — visual section separator ✅
- Navigation hover underline ✅
- Custom scrollbar CSS ✅

### 1.2 Motion Philosophy

Motion on this site serves one purpose: **communicate the premium nature of the collection.** Every animation should feel like opening a display case, not like a tech demo. That means:

- **Slow, confident entrances.** Nothing snaps in at 100ms. Sections glide into place over 500–800ms with deliberate easing.
- **Staggered reveals, not simultaneous.** When multiple elements enter, they arrive in sequence — like items being presented one by one.
- **No bouncing, no spring overshoot.** This is a vault, not a toy store. Use `easeOut` and custom cubic-bezier curves, not `spring` with bounce.
- **Respect reduced motion.** Every animation in this PRD checks `prefers-reduced-motion` and either skips entirely or reduces to a simple opacity fade.

---

## 2. Reduced Motion Foundation

### 2.1 Hook: `src/hooks/useReducedMotion.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true if the user prefers reduced motion.
 * All animation components in this PRD check this before running.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
```

### 2.2 Usage Pattern

Every animated component in this PRD follows this pattern:

```typescript
const reduced = useReducedMotion();

// If reduced: skip animation entirely, render with final state
// If not: run the full animation
const variants = reduced
  ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
  : { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
```

---

## 3. Scroll-Triggered Section Reveals

### 3.1 Strategy

Use **Framer Motion `whileInView`** for all scroll-triggered reveals. GSAP ScrollTrigger was in the original roadmap, but Framer Motion already handles `IntersectionObserver`-based scroll triggers cleanly and is already installed. Adding GSAP ScrollTrigger would bring in another heavy module for minimal gain. Keep GSAP for the one case where it genuinely adds value: the parallax depth effect on the home page (Section 3.6).

### 3.2 Component: `src/components/ui/ScrollReveal.tsx`

A reusable wrapper that reveals its children when scrolled into view.

```typescript
'use client';

import { motion, type Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ReactNode } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;        // seconds
  duration?: number;     // seconds, default 0.6
  distance?: number;     // pixels of travel, default 30
  once?: boolean;        // default true — only animate first time
  className?: string;
}

const DIRECTIONS: Record<RevealDirection, { x?: number; y?: number }> = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
  fade: {},
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  once = true,
  className,
}: ScrollRevealProps) {
  const reduced = useReducedMotion();
  const offset = DIRECTIONS[direction];

  // Scale the distance
  const initial = {
    opacity: 0,
    ...(offset.x !== undefined ? { x: offset.x > 0 ? distance : -distance } : {}),
    ...(offset.y !== undefined ? { y: offset.y > 0 ? distance : -distance } : {}),
  };

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Custom easeOutQuint
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### 3.3 Home Page Section Reveals

Wrap each major section on the home page with `ScrollReveal`:

```
Section                     Direction    Delay
────────────────────────────────────────────────
EraContext badge             fade         0
Portfolio Value chart        up           0.1
Card Grid row 1 (cards 1-3) up           0
Card Grid row 2 (cards 4-6) up           0.08
Card Grid row 3 (cards 7-9) up           0.16
Card Grid row 4 (10-12)     up           0.24
Card Grid row 5 (13-15)     up           0.32
Market Pulse divider         fade         0
Market Movers panel          left         0
Supply Signals panel         right        0.1
Scarcity Spectrum            up           0.15
```

**Implementation in `page.tsx`:** Don't wrap each individual card in `ScrollReveal` — that's 15 wrappers with 15 intersection observers. Instead, wrap each **row** of 3 cards, and use CSS `animation-delay` on the individual cards within each row for the stagger effect.

```typescript
// Per row:
<ScrollReveal direction="up" delay={rowIndex * 0.08}>
  <div className="grid grid-cols-3 gap-6">
    {rowCards.map((card, i) => (
      <div
        key={card.slug}
        style={{ animationDelay: `${i * 0.06}s` }}
        className="animate-card-entrance"
      >
        <CardTilt card={card} trend={trends.get(card.slug)} />
      </div>
    ))}
  </div>
</ScrollReveal>
```

### 3.4 Card Detail Page Reveals

The card detail page already has mount animations (PRD-03a: slab from left, identity from right, panels from below). These use `initial`/`animate` which is correct for page-mount animations. Add `ScrollReveal` only to the data panels section, which may be below the fold:

```
Section                     Direction    Delay
────────────────────────────────────────────────
Hero (slab + identity)       (existing mount animations — keep as-is)
Data Panels tab bar          up           0
Active data panel content    up           0.1
Rarity Aurora                fade         0.2
Card Radar                   fade         0.3
```

### 3.5 Hunt Page Reveals

```
Section                     Direction    Delay
────────────────────────────────────────────────
"THE HUNT" title             fade         0
Progress Ring                fade         0.1
Stats Summary                right        0.2
Hunt Card row 1              up           0
Hunt Card row 2              up           0.08
Hunt Card row 3              up           0.16
Hunt Card row 4              up           0.24
Hunt Card row 5              up           0.32
```

### 3.6 Home Page Parallax (GSAP ScrollTrigger)

One specific use of GSAP: a subtle parallax depth effect on the home page where the Portfolio Value chart area and the card grid move at slightly different scroll speeds, creating a layered depth illusion.

**Implementation in `src/app/page.tsx` (or a dedicated wrapper component):**

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function HomeParallax({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Portfolio chart section moves slightly slower than scroll
      gsap.to('[data-parallax="slow"]', {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Market Pulse section moves slightly faster
      gsap.to('[data-parallax="fast"]', {
        y: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-parallax="fast"]',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [reduced]);

  return <div ref={containerRef}>{children}</div>;
}
```

Usage: Add `data-parallax="slow"` to the Portfolio Value section and `data-parallax="fast"` to the Market Pulse section in `page.tsx`.

**Note:** The parallax values are intentionally subtle (30px and 20px). This is a depth hint, not a scrolljacking effect. If it feels like too much at implementation, reduce to 15px and 10px.

---

## 4. Page Transitions

### 4.1 Strategy

Use Framer Motion's `AnimatePresence` in the root layout to animate between routes. Next.js App Router doesn't natively support exit animations between server components, so the approach is:

1. Wrap `{children}` in the root layout with an `AnimatePresence` + `motion.div`
2. Use the pathname as the `key` so Framer detects route changes
3. Keep transitions fast (300ms) and subtle (opacity + slight Y shift)

### 4.2 Update: `src/app/layout.tsx`

The `<PageTransition>` wrapper already exists but isn't wired in. Wire it:

```typescript
// In the root layout's return:
<Providers>
  <Navigation />
  <PageTransition>
    {children}
  </PageTransition>
</Providers>
```

### 4.3 Component: `src/components/ui/PageTransition.tsx`

Update the existing stub to a working implementation:

```typescript
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <main>{children}</main>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

### 4.4 Vault Door → Content Transition

The vault door overlay (PRD-02a) currently fades out over 800ms, revealing the home page beneath. Ensure the home page content **does not** also run its own mount animations during the vault door fade — that would cause a double-animation. 

**Fix:** Add a flag in the vault overlay's `onComplete` callback that the home page checks:

```typescript
// In VaultOverlay: after animation completes
sessionStorage.setItem('vault-intro-played', 'true');
sessionStorage.setItem('vault-just-completed', 'true');

// In home page's scroll reveal wrappers:
const justCompletedVault = typeof window !== 'undefined'
  && sessionStorage.getItem('vault-just-completed') === 'true';

// If vault just completed, skip the scroll reveals — content is already visible
// Clear the flag after first render
useEffect(() => {
  if (justCompletedVault) {
    sessionStorage.removeItem('vault-just-completed');
  }
}, []);
```

This prevents the awkward double-fade: vault fades out → content immediately re-fades in from scroll reveals.

### 4.5 Transition Variants by Route

Different routes can have different transition feels:

| From → To | Enter | Exit |
|-----------|-------|------|
| Home → Card Detail | Fade + slide up (entering detail) | Fade + slide down |
| Card Detail → Home | Fade + slide down (returning) | Fade + slide up |
| Any → Hunt | Fade only | Fade only |
| Hunt → Any | Fade only | Fade only |

To implement route-aware transitions, detect the previous and next routes:

```typescript
const pathname = usePathname();
const isCardRoute = pathname.startsWith('/card/');
const isHuntRoute = pathname === '/hunt';

const variants = {
  initial: {
    opacity: 0,
    y: isCardRoute ? 12 : isHuntRoute ? 0 : 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: isCardRoute ? -12 : isHuntRoute ? 0 : -8,
  },
};
```

---

## 5. Card Grid Scroll Bug Fix

### 5.1 Problem

Cards in rows 4 and 5 of the home page grid (and similarly on the Hunt page) sometimes stay invisible when the user scrolls quickly. This happens because `whileInView` with `viewport={{ once: true }}` fires based on `IntersectionObserver`, which can miss elements that scroll through the viewport too fast.

### 5.2 Fix

Two-pronged approach:

**A) Increase the viewport margin.** Change from the default `0px` to `-100px` (negative means the trigger fires when the element is 100px *before* entering the viewport):

```typescript
viewport={{ once: true, margin: '-100px' }}
```

This gives fast-scrolling users a 100px buffer before the element would be visible, making it far more likely the observer fires in time.

**B) Add a CSS fallback.** Define a CSS animation that runs automatically after a delay. If the Framer Motion animation fires, it overrides the CSS. If it doesn't (observer missed), the CSS kicks in as a safety net.

In `globals.css`:

```css
@keyframes card-entrance-fallback {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-entrance-fallback {
  animation: card-entrance-fallback 0.5s ease-out forwards;
  animation-delay: var(--entrance-delay, 0s);
}
```

Apply this class to each card tile. The Framer Motion `whileInView` overrides the CSS animation when it fires. The CSS `animation-delay` is set per-card via a CSS variable inline style:

```typescript
<div
  className="card-entrance-fallback"
  style={{ '--entrance-delay': `${(rowIndex * 3 + colIndex) * 0.06}s` } as React.CSSProperties}
>
```

### 5.3 Initial Opacity

Cards must start at `opacity: 0` in CSS so they don't flash before animation. Add to the card grid container:

```css
.card-entrance-fallback {
  opacity: 0; /* Starts hidden, animation fills to 1 */
}
```

The `forwards` fill mode keeps them visible after the CSS animation completes.

---

## 6. Button Micro-Interactions

### 6.1 Strategy

Every clickable element on the site should have a consistent tactile response. Define a small set of interaction classes that get applied globally.

### 6.2 CSS Classes in `globals.css`

```css
/* ── Press Scale ── */
/* For buttons, pills, tabs — anything that gets clicked */
.press-scale {
  transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.press-scale:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.press-scale:active {
  transform: translateY(0) scale(0.97);
  box-shadow: none;
  transition-duration: 50ms;
}

/* ── Hover Lift ── */
/* For cards, panels — larger interactive surfaces */
.hover-lift {
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ── Glow Pulse ── */
/* For the Hunt page acquired cards, special callouts */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 8px var(--color-accent-glow);
  }
  50% {
    box-shadow: 0 0 16px var(--color-accent-glow), 0 0 32px var(--color-accent-dim);
  }
}

.glow-pulse {
  animation: glow-pulse 3s ease-in-out infinite;
}

/* ── Respect reduced motion for all ── */
@media (prefers-reduced-motion: reduce) {
  .press-scale,
  .hover-lift {
    transition: none !important;
    transform: none !important;
  }

  .glow-pulse {
    animation: none !important;
  }
}
```

### 6.3 Application Map

| Element | Class | Location |
|---------|-------|----------|
| Time range pills (7D/30D/90D/1M/3M etc.) | `press-scale` | PriceHistory, MarketMovers, PortfolioValue |
| Grader tabs (RAW/PSA/BGS/CGC/SGC) | `press-scale` | SlabViewer |
| BGS sub-tabs (Silver/Gold/Black Label) | `press-scale` | SlabViewer |
| Data panel tabs (Price History/Pop/Sales) | `press-scale` | DataPanels |
| Filter pills (grader/grade filters) | `press-scale` | RecentSales |
| "Back to Vault" link | `press-scale` | Card detail page |
| Navigation links | (keep existing hover underline — no press-scale, nav items shouldn't "push") | Navigation |
| Market Mover rows | `hover-lift` | MarketMovers |
| Supply Signal rows | `hover-lift` | SupplySignals |
| Hunt cards (acquired state) | `glow-pulse` | HuntCard |
| Scarcity Spectrum markers | `press-scale` | ScarcitySpectrum |

### 6.4 Implementation

This is a CSS-only change for most elements. Go through each component listed above and add the appropriate class to the interactive element's `className`. No props changes, no logic changes — just class additions.

**Example for a time range pill:**

```typescript
// Before:
<button className="px-3 py-1 rounded-full text-xs ...">30D</button>

// After:
<button className="press-scale px-3 py-1 rounded-full text-xs ...">30D</button>
```

---

## 7. Loading Skeletons

### 7.1 Strategy

Every data-dependent section needs a skeleton state that renders while the server component fetches data. Since this is a Next.js App Router project with server components, the loading states come from `loading.tsx` files and `<Suspense>` boundaries.

### 7.2 Component: `src/components/ui/Skeleton.tsx`

A flexible skeleton primitive:

```typescript
import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-bg-hover)]',
        variant === 'line' && 'h-4 rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-lg',
        className
      )}
    />
  );
}
```

### 7.3 Skeleton: Portfolio Value

```typescript
export function PortfolioValueSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-6">
      <Skeleton className="w-32 h-3 mb-3" />          {/* "Portfolio Value" label */}
      <Skeleton className="w-48 h-8 mb-2" />          {/* $XX,XXX number */}
      <Skeleton className="w-64 h-3 mb-6" />          {/* Change line */}
      <Skeleton variant="rect" className="w-full h-[180px]" /> {/* Chart area */}
    </div>
  );
}
```

### 7.4 Skeleton: Card Grid

```typescript
export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rect"
          className="aspect-[5/7]"
        />
      ))}
    </div>
  );
}
```

### 7.5 Skeleton: Market Pulse

```typescript
export function MarketPulseSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton variant="rect" className="h-[400px]" />
      <Skeleton variant="rect" className="h-[400px]" />
    </div>
  );
}
```

### 7.6 Skeleton: Card Detail Data Panels

```typescript
export function DataPanelsSkeleton() {
  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-6 mb-6">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
      {/* Chart area */}
      <Skeleton variant="rect" className="w-full h-[300px]" />
    </div>
  );
}
```

### 7.7 Wiring Skeletons with Suspense

In page components, wrap data-dependent sections in `<Suspense>`:

```typescript
// src/app/page.tsx
import { Suspense } from 'react';

export default async function HomePage() {
  return (
    <>
      <PortfolioHeader />
      <EraContext />

      <Suspense fallback={<PortfolioValueSkeleton />}>
        <PortfolioValueSection />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton />}>
        <CardGridSection />
      </Suspense>

      <Suspense fallback={<MarketPulseSkeleton />}>
        <MarketPulseSection />
      </Suspense>
    </>
  );
}
```

Extract each data-fetching section into its own async server component so `Suspense` can stream them independently. This means the card grid can appear while the Market Pulse section is still loading.

**Example extraction:**

```typescript
// src/components/sections/CardGridSection.tsx
import { getAllCards } from '@/lib/db/queries';
// ... other imports

export async function CardGridSection() {
  const cards = await getAllCards();
  const trends = await getMarketTrends(); // from 07a
  // ... render card grid with real data
}
```

### 7.8 Skeleton Animation

The `animate-pulse` Tailwind utility handles the shimmer. Customize the pulse speed and color in `globals.css`:

```css
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.15;
  }
}

/* Override Tailwind's default pulse for skeletons */
.animate-pulse {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

The slower 2s cycle (vs Tailwind's default 2s but with different easing) feels more refined and less "loading spinner."

---

## 8. Smooth Scroll Behavior

### 8.1 Global Smooth Scroll

Add to `globals.css`:

```css
html {
  scroll-behavior: smooth;
}

/* Disable smooth scroll for reduced motion */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

### 8.2 Navigation Scroll Offset

The fixed nav (64px) and sticky Portfolio Header (48px) eat into the viewport. When smooth-scrolling to anchors or when the page loads, content can get hidden behind these elements. Add a scroll-padding offset:

```css
html {
  scroll-padding-top: 120px; /* 64px nav + 48px portfolio header + 8px buffer */
}
```

---

## 9. Data Panel Tab Polish

### 9.1 Current State

The data panel tab switch (Price History / Pop Reports / Recent Sales) already uses Framer Motion `AnimatePresence` with a basic fade + Y shift. This is fine. Two small improvements:

### 9.2 Tab Indicator Slide

The active tab underline already uses `layoutId` for the sliding effect. Verify it's using a spring with no bounce:

```typescript
<motion.div
  layoutId="active-tab-indicator"
  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]"
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 35,
    // No bounce — overdamped spring
  }}
/>
```

If `stiffness` and `damping` aren't set, Framer defaults to a bouncy spring which doesn't match the vault aesthetic.

### 9.3 Content Crossfade Direction

Make the content slide direction match the tab direction — if you click a tab to the right of the current tab, content slides in from the right. If left, from the left.

```typescript
const [activeTab, setActiveTab] = useState(0);
const [direction, setDirection] = useState(0); // -1 left, 0 none, 1 right

function handleTabChange(newIndex: number) {
  setDirection(newIndex > activeTab ? 1 : -1);
  setActiveTab(newIndex);
}

// In AnimatePresence:
<motion.div
  key={activeTab}
  initial={{ opacity: 0, x: direction * 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: direction * -20 }}
  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
>
```

---

## 10. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useReducedMotion.ts` | **CREATE** | Reduced motion preference hook |
| `src/components/ui/ScrollReveal.tsx` | **CREATE** | Scroll-triggered reveal wrapper |
| `src/components/ui/Skeleton.tsx` | **CREATE** | Skeleton loading primitive |
| `src/components/ui/PageTransition.tsx` | **REWRITE** | Working page transition with route-aware variants |
| `src/app/globals.css` | **MODIFY** | Add press-scale, hover-lift, glow-pulse, smooth scroll, skeleton pulse, card-entrance-fallback |
| `src/app/layout.tsx` | **MODIFY** | Wire PageTransition around children |
| `src/app/page.tsx` | **MODIFY** | Add ScrollReveal wrappers, Suspense boundaries, parallax data attributes, extract async sections |
| `src/app/card/[slug]/page.tsx` | **MODIFY** | Add ScrollReveal to data panels, Suspense boundaries |
| `src/app/hunt/page.tsx` | **MODIFY** | Add ScrollReveal wrappers to title, ring, cards |
| `src/components/cards/CardTilt.tsx` | **MODIFY** | Add card-entrance-fallback class |
| `src/components/cards/DataPanels.tsx` | **MODIFY** | Directional tab crossfade, overdamped spring on indicator |
| `src/components/charts/MarketMovers.tsx` | **MODIFY** | Add press-scale to pills, hover-lift to rows |
| `src/components/charts/SupplySignals.tsx` | **MODIFY** | Add hover-lift to rows |
| `src/components/charts/PriceHistory.tsx` | **MODIFY** | Add press-scale to time range pills and toggle chips |
| `src/components/charts/ScarcitySpectrum.tsx` | **MODIFY** | Add press-scale to markers |
| `src/components/cards/SlabViewer.tsx` | **MODIFY** | Add press-scale to grader tabs and BGS sub-tabs |
| `src/components/charts/RecentSales.tsx` | **MODIFY** | Add press-scale to filter pills |
| `src/components/hunt/HuntCard.tsx` | **MODIFY** | Add glow-pulse to acquired state |
| `src/components/three/VaultOverlay.tsx` | **MODIFY** | Add vault-just-completed flag |

---

## 11. Verification

```
□ Scroll reveals: Home page sections fade/slide in as you scroll down
□ Scroll reveals: Card grid rows stagger (row 1 first, row 5 last)
□ Scroll reveals: Market Movers slides from left, Supply Signals from right
□ Scroll reveals: Hunt page title, ring, and cards reveal on scroll
□ Scroll reveals: All reveals only fire once (don't replay on scroll up)
□ Fast scroll fix: Cards in rows 4-5 are visible after fast scrolling to bottom
□ Fast scroll fix: CSS fallback animation fires within 1-2 seconds even if observer misses
□ Page transitions: Navigating Home → Card fades content with Y shift
□ Page transitions: Navigating Card → Home fades back
□ Page transitions: No double-animation after vault door completes
□ Page transitions: Hunt page transitions are fade-only (no Y shift)
□ Parallax: Portfolio chart section has subtle parallax vs card grid on scroll
□ Parallax: Effect is very subtle (15-30px max displacement)
□ Parallax: Disabled for prefers-reduced-motion users
□ Micro-interactions: Time range pills have press scale on click
□ Micro-interactions: Grader tabs push down on click
□ Micro-interactions: Market Mover/Supply Signal rows lift on hover
□ Micro-interactions: Hunt cards (acquired) have gentle glow pulse
□ Micro-interactions: All interactions disabled for prefers-reduced-motion
□ Skeletons: Portfolio chart shows skeleton while loading
□ Skeletons: Card grid shows 15 skeleton rectangles while loading
□ Skeletons: Market Pulse shows panel skeletons while loading
□ Skeletons: Card detail data panels show skeleton while loading
□ Skeletons: Pulse animation is slow (2s cycle) and subtle
□ Smooth scroll: Page scrolls smoothly on anchor navigation
□ Smooth scroll: scroll-padding prevents content from hiding behind fixed nav
□ Tab polish: Data panel tab indicator slides without bounce
□ Tab polish: Content slides in the direction of the selected tab
□ prefers-reduced-motion: All animations disabled, content renders immediately
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 12. What Comes Next

| PRD | Focus |
|-----|-------|
| **09** | Performance & Mobile — Lazy load Three.js, bundle split heavy deps (recharts, d3, three), touch interactions for card tilt, mobile nav, Lighthouse audit |
| **10** | Deployment — Vercel production config, cron activation, custom domain, OG images, error monitoring, README |
