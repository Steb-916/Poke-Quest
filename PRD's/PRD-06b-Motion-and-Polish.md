# PRD-06b: Scroll Animations, Micro-Interactions & Polish

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 06b of 2 (Motion & Polish)  
**Depends on:** PRD-06a complete

---

## 1. Overview

This PRD adds the motion layer that makes the site feel alive. Scroll-driven animations, page transitions, number counters, hover micro-interactions, and small details that elevate the experience from "functional" to "premium." This is where GSAP enters the stack.

---

## 2. Page Transitions

### 2.1 Concept

Navigating between pages should feel seamless — content doesn't "jump" between routes, it flows. Use Framer Motion's `AnimatePresence` at the layout level to animate page exits and entrances.

### 2.2 Transition Pattern

**Exit:** Current page fades out + slides slightly upward (opacity 1→0, y 0→-15) over 250ms.

**Enter:** New page fades in + slides slightly upward from below (opacity 0→1, y 15→0) over 350ms with 100ms delay after exit completes.

### 2.3 Implementation: `src/components/ui/PageTransition.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

Wrap the `{children}` in the root layout with this component:

```typescript
// In layout.tsx
<Providers>
  <Navigation />
  <PageTransition>
    <main>{children}</main>
  </PageTransition>
</Providers>
```

Note: This requires the layout to be a client component wrapper or the PageTransition to handle SSR gracefully. Test that the initial page load doesn't flash.

---

## 3. Animated Number Counter

### 3.1 Component: `src/components/ui/AnimatedCounter.tsx`

Used everywhere a number should count up: portfolio value, pop counts, price displays, hunt progress.

### 3.2 Behavior

- On mount or when value changes: animates from previous value to new value
- Duration: proportional to the magnitude of change (min 400ms, max 1200ms)
- Easing: ease-out (fast start, gentle settle)
- Format: respects currency formatting ($XX,XXX.XX) or plain number formatting
- Decimal places: configurable (0 for pop counts, 2 for prices)

### 3.3 Implementation

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;           // "$" for currency
  suffix?: string;            // "%" or " cards"
  decimals?: number;          // Default 0
  duration?: number;          // Override auto-duration
  className?: string;
  separateDecimals?: boolean; // Render cents in a different style
  decimalClassName?: string;  // Class for the decimal portion
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration,
  className,
  separateDecimals = false,
  decimalClassName,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const startValue = displayValue;
    const endValue = value;
    const diff = Math.abs(endValue - startValue);

    // Auto duration: bigger changes take longer
    const autoDuration = Math.min(1200, Math.max(400, diff * 0.5));
    const totalDuration = duration ?? autoDuration;

    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(startValue + (endValue - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value, isInView]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (separateDecimals && decimals > 0) {
    const [whole, decimal] = formatted.split('.');
    return (
      <span ref={ref} className={className}>
        {prefix}{whole}
        <span className={decimalClassName}>.{decimal}</span>
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
```

### 3.4 Usage Examples

```tsx
// Portfolio value in header
<AnimatedCounter
  value={47850.99}
  prefix="$"
  decimals={2}
  separateDecimals
  className="font-[var(--font-mono)] text-lg text-[var(--color-text-primary)]"
  decimalClassName="text-[var(--color-text-tertiary)]"
/>

// Pop count
<AnimatedCounter value={138} className="font-[var(--font-display)] text-4xl" />

// Hunt progress
<AnimatedCounter value={4} suffix=" / 15" />
```

---

## 4. Scroll-Triggered Section Reveals

### 4.1 Home Page Sections

The Portfolio Performance and Scarcity Spectrum sections (added in PRD-06a) should animate on scroll entry. Use Framer Motion's `whileInView`:

**Section title:** Fades in + draws a line underneath (the line width animates from 0% to 100%).

**Chart:** Fades in + scales from 0.97 to 1.0, 200ms after the title.

**Market movers list:** Each row staggers in from the left, 80ms apart.

### 4.2 Card Detail Page Sections

The data panels (Price History, Pop Reports, Recent Sales, Analysis) should animate when their tab is switched. Already handled by `AnimatePresence` in PRD-03b, but enhance with:

- Charts animate their data points on mount (Recharts supports `isAnimationActive`)
- The Rarity Aurora rings animate on tab switch (not just on first load)

### 4.3 Hunt Page Cards

Already stagger-animated from PRD-04a. No changes needed.

---

## 5. Hover Micro-Interactions

### 5.1 Navigation Links

On hover, nav links get a subtle underline that draws from left to right:

```css
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-accent);
  transition: width 0.3s var(--ease-spring);
}

.nav-link:hover::after {
  width: 100%;
}
```

### 5.2 Buttons

All interactive buttons (grader tabs, time range selectors, filter pills) should have:
- A subtle scale on press: `active:scale-[0.97]` (Tailwind)
- Transition on background color: 150ms
- No abrupt state changes — everything eases

### 5.3 Data Table Rows

On the Recent Sales table, row hover should:
- Background shifts to `var(--color-bg-hover)`
- The grader color dot brightens slightly
- The price text shifts to primary color (from secondary)
- Transition: 150ms

### 5.4 Cards on Home Grid

Already handled by CardTilt (PRD-02b). Verify the shimmer and tilt are working post-integration with real data.

### 5.5 Tooltip Animations

All tooltips (chart tooltips, aurora ring tooltips) should:
- Fade in from opacity 0 + translate Y 4px (float up into position)
- Duration: 150ms
- Delay: 200ms (don't trigger instantly — user needs to pause on the element)
- Fade out: 100ms, no delay

---

## 6. Section Dividers

### 6.1 Horizontal Lines

Between major sections on the home page and card detail page, use a styled divider:

```tsx
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 my-12">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-default)] to-transparent" />
      <span className="font-[var(--font-display)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
        {title}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border-default)] to-transparent" />
    </div>
  );
}
```

The line fades in from both edges toward the center, with the section title sitting in the middle. This creates a premium editorial feel.

---

## 7. Loading States

### 7.1 Skeleton Screens

When data is loading (server component data fetch), show skeleton screens instead of spinners:

```tsx
function PriceSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-24 bg-[var(--color-bg-hover)] rounded" />
      <div className="h-8 w-32 bg-[var(--color-bg-hover)] rounded" />
      <div className="h-4 w-20 bg-[var(--color-bg-hover)] rounded" />
    </div>
  );
}
```

Skeletons should match the approximate shape and position of the real content. Use `animate-pulse` (Tailwind's built-in opacity pulse).

### 7.2 Chart Loading

Charts show a faint grid with pulsing placeholder lines until data loads. Not just a blank space — the skeleton should hint at what's coming.

---

## 8. Dark Mode Refinements

The entire site is already dark, but some elements may need tuning after all the components are in place:

- Ensure no white flashes between page transitions
- Chart tooltip backgrounds should be `var(--color-bg-tertiary)` with `backdrop-blur-sm`, not opaque white
- All form elements (admin panel, ownership drawer) should have dark backgrounds with subtle borders
- Scrollbar styling: dark track, accent-colored thumb on hover

```css
/* In globals.css */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-dim);
}
```

---

## 9. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/PageTransition.tsx` | **CREATE** | Route transition wrapper |
| `src/components/ui/AnimatedCounter.tsx` | **CREATE** | Counting number animation |
| `src/components/ui/SectionDivider.tsx` | **CREATE** | Styled section title with fading lines |
| `src/components/ui/Skeleton.tsx` | **CREATE** | Skeleton loading components |
| `src/app/layout.tsx` | **MODIFY** | Wrap children in PageTransition |
| `src/app/globals.css` | **MODIFY** | Add scrollbar styling, tooltip transitions |
| `src/components/ui/Navigation.tsx` | **MODIFY** | Add underline hover animation |
| `src/components/ui/PortfolioHeader.tsx` | **MODIFY** | Use AnimatedCounter for values |
| `src/components/hunt/ProgressRing.tsx` | **MODIFY** | Use AnimatedCounter for center number |

---

## 10. Verification

```
□ Page transitions animate smoothly between all routes (home → card → hunt → home)
□ No white flash during transitions
□ AnimatedCounter counts up on portfolio value, pop numbers, hunt progress
□ Counter only starts when element scrolls into view (useInView)
□ Home page sections fade in on scroll
□ Section dividers render with centered title and gradient lines
□ Nav links have underline draw animation on hover
□ Grader tabs and filter pills have active:scale press effect
□ Chart tooltips fade in with slight upward float
□ Sales table rows highlight on hover
□ Skeleton screens show during data loading
□ Custom scrollbar appears dark with accent thumb
□ All animations respect prefers-reduced-motion (disable if set)
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 11. What Comes Next

| PRD | Focus |
|-----|-------|
| **07** | Performance & Mobile — lazy loading, bundle splitting, lighthouse audit, touch interactions for tilt on mobile |
| **08** | Deployment — Vercel production, Neon setup, cron scheduling, initial data population, domain |
