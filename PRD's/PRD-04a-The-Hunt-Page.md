# PRD-04a: The Hunt — Black Label Quest Tracker

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 04a of 2 (Page Layout + Progress Visualization)  
**Depends on:** PRD-03a and PRD-03b complete

---

## 1. Overview

The Hunt is the emotional core of the site. It tracks progress toward one clear goal: **own a BGS Black Label 10 of all 15 cards.** The page functions as a quest log — cards you've acquired are illuminated and celebrated, cards you're still hunting are ghosted with their current best-owned grade shown. Every visit to this page should immediately communicate "here's where I stand" and "here's what's left."

---

## 2. Page Layout

### 2.1 Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Bar                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  THE HUNT                                                     │
│  ──────────                                                   │
│  Progress Ring          Stats Summary                         │
│                                                               │
│  ┌──────────┐          Acquired: 0 / 15                      │
│  │          │          Next Target: Tyranitar V               │
│  │   0/15   │          Est. Remaining: $XXX,XXX               │
│  │          │          Portfolio if Complete: $XXX,XXX         │
│  └──────────┘                                                 │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CARD HUNT STATUS (15 cards, 3 per row)                      │
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │ ◆ OWNED │  │ ◇ HUNT  │  │ ◇ HUNT  │                      │
│  │ Card 1  │  │ Card 2  │  │ Card 3  │                      │
│  │ BL ✓    │  │ PSA 10  │  │ Raw     │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
│                                                               │
│  ... (5 rows of 3)                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Responsive

- **≥1024px:** Progress ring and stats side by side at top, 3-column card grid
- **768–1023px:** Progress ring above stats (stacked), 2-column card grid
- **<768px:** Everything stacked, 1-column card grid

---

## 3. Hero Section: Progress Visualization

### 3.1 Progress Ring

A large SVG ring (donut chart) showing overall completion. This is the first thing your eye hits.

**Specifications:**
- Size: 200px × 200px
- Ring thickness: 12px
- Background track: `var(--color-bg-hover)` (dark)
- Progress fill: animated gradient along the ring from `var(--color-accent)` to a brighter variant
- The fill sweeps clockwise, with a rounded cap on the leading edge
- Center text: large number `0` (or whatever the count is) in `font-[var(--font-display)]` at 48px, bold
- Below the number: `/15` in `font-[var(--font-mono)]`, secondary text, 18px
- Below that: `Black Labels` in tertiary text, 12px, uppercase, tracked

**Animation:** On page load, the ring animates from 0 to the current progress value over 1.2 seconds with an `easeOut` curve. The center number counts up in sync (use `AnimatedCounter`). If progress is 0, the ring still renders the empty track — no hidden state.

**Implementation:** Custom SVG component using `stroke-dasharray` and `stroke-dashoffset` for the progress arc. Animate with Framer Motion's `useMotionValue` and `useTransform` for smooth interpolation.

### 3.2 Stats Summary

Four key metrics displayed beside (or below) the progress ring:

| Stat | Value | Font |
|------|-------|------|
| Acquired | `0 / 15` | Display, large |
| Next Target | `Tyranitar V` (lowest pop BL, best opportunity) | Body, accent color |
| Est. Cost Remaining | `$XXX,XXX` (sum of estimated BL prices for unhunted cards) | Mono |
| Portfolio if Complete | `$XXX,XXX` (total value if all 15 BLs acquired) | Mono |

All values are **placeholder/mock** for now. Real calculations come in PRD-05.

"Next Target" logic (for when real data is connected): suggest the card with the lowest Black Label pop count that you don't already own a BL of — the rarest opportunity to prioritize.

### 3.3 Page Title

Above the hero section:

```
THE HUNT
```

`font-[var(--font-display)]`, 14px, uppercase, letter-spacing 0.3em, `var(--color-accent)` (default gold). A thin horizontal line below it spanning the content width, accent color at 20% opacity.

---

## 4. Hunt Card Grid

### 4.1 Overview

A grid of 15 hunt cards, same 5×3 layout as the home page but each card shows hunt-specific information rather than just the card image.

### 4.2 Card States

Each card exists in one of three visual states:

**State A: Black Label Acquired** (the goal — fully illuminated)
- Card image at full brightness and saturation
- Accent-colored border glow (card's specific accent)
- "BLACK LABEL" badge with gold styling
- Check mark icon
- Purchase date shown
- Gentle ambient pulse animation on the border glow (subtle, not distracting)

**State B: Owned, Not Black Label** (progress — partially illuminated)
- Card image at ~80% brightness
- Subtle border in `var(--color-border-hover)`
- Shows current best grade: e.g., "PSA 10" or "BGS 9.5" or "RAW"
- Grader logo color as small dot
- "Upgrade to Black Label" subtext in tertiary color

**State C: Not Owned** (hunting — ghosted)
- Card image with CSS filter: `brightness(0.4) saturate(0.3)` — desaturated and dark
- Dashed border in `var(--color-border-default)`
- "NOT ACQUIRED" label in tertiary text
- BL pop count shown: "BL Pop: 138" or "BL Pop: 0" (with special "NONE EXIST" highlight for pop 0)
- The card feels like a silhouette waiting to be filled

### 4.3 Hunt Card Component: `src/components/hunt/HuntCard.tsx`

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

// Placeholder types — will come from database in PRD-05
interface OwnershipStatus {
  acquired: boolean;
  isBlackLabel: boolean;
  bestGrade?: string;        // "Black Label" | "PSA 10" | "BGS 9.5" | "RAW" etc.
  bestGrader?: string;       // "BGS" | "PSA" | "CGC" | "SGC"
  purchaseDate?: string;
  blPop?: number;            // Black Label population count
}

interface HuntCardProps {
  card: CardMeta;
  status: OwnershipStatus;
  index: number;
}

export function HuntCard({ card, status, index }: HuntCardProps) {
  const state = status.isBlackLabel ? 'acquired' : status.acquired ? 'owned' : 'hunting';

  const row = Math.floor(index / 3);
  const col = index % 3;
  const staggerDelay = row * 0.12 + col * 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/card/${card.slug}`}>
        <div
          className={cn(
            'relative rounded-xl overflow-hidden transition-all duration-300 group',
            state === 'acquired' && 'ring-2 ring-[var(--color-bgs-gold)] shadow-[0_0_20px_var(--color-bgs-gold)]',
            state === 'owned' && 'border border-[var(--color-border-hover)]',
            state === 'hunting' && 'border border-dashed border-[var(--color-border-default)]',
          )}
          style={state === 'acquired' ? {
            '--color-accent': card.accentColor,
          } as React.CSSProperties : undefined}
        >
          {/* Card Image */}
          <div className="aspect-[5/7] relative">
            <Image
              src={card.imageUrl || `/cards/${card.slug}.png`}
              alt={card.name}
              fill
              className={cn(
                'object-cover transition-all duration-300',
                state === 'acquired' && 'brightness-100 saturate-100',
                state === 'owned' && 'brightness-[0.8]',
                state === 'hunting' && 'brightness-[0.4] saturate-[0.3]',
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              {/* Top: Status Badge */}
              <div className="flex justify-end">
                {state === 'acquired' && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-bgs-gold)] text-black text-xs font-bold uppercase tracking-wider">
                    ✓ Black Label
                  </span>
                )}
                {state === 'owned' && (
                  <span className="px-3 py-1 rounded-full bg-[var(--color-bg-tertiary)]/80 text-[var(--color-text-secondary)] text-xs font-medium backdrop-blur-sm">
                    {status.bestGrader} {status.bestGrade}
                  </span>
                )}
                {state === 'hunting' && (
                  <span className="px-3 py-1 rounded-full border border-[var(--color-border-default)] text-[var(--color-text-tertiary)] text-xs backdrop-blur-sm">
                    Not Acquired
                  </span>
                )}
              </div>

              {/* Bottom: Card Info */}
              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent -mx-4 -mb-4 px-4 pb-4 pt-8">
                <h3 className={cn(
                  'font-[var(--font-display)] text-sm font-semibold tracking-tight',
                  state === 'acquired' ? 'text-[var(--color-bgs-gold)]' : 'text-white',
                )}>
                  {card.name}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-[var(--font-mono)] text-xs text-white/50">
                    {card.set}
                  </p>
                  {status.blPop !== undefined && (
                    <p className={cn(
                      'font-[var(--font-mono)] text-xs',
                      status.blPop === 0 ? 'text-[var(--color-warning)]' : 'text-white/40',
                    )}>
                      BL Pop: {status.blPop === 0 ? 'NONE' : status.blPop}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
```

### 4.4 Mock Ownership Data

For development, define mock status for all 15 cards. Mix of states so all three visual treatments are visible:

```typescript
// src/lib/utils/mockHuntData.ts

import type { CardMeta } from './cardData';

export interface MockOwnership {
  slug: string;
  acquired: boolean;
  isBlackLabel: boolean;
  bestGrade?: string;
  bestGrader?: string;
  purchaseDate?: string;
  blPop: number;
}

export const MOCK_HUNT_STATUS: MockOwnership[] = [
  { slug: 'umbreon-vmax-215', acquired: false, isBlackLabel: false, blPop: 138 },
  { slug: 'rayquaza-vmax-218', acquired: false, isBlackLabel: false, blPop: 38 },
  { slug: 'deoxys-vmax-gg45', acquired: false, isBlackLabel: false, blPop: 12 },
  { slug: 'gengar-vmax-271', acquired: false, isBlackLabel: false, blPop: 10 },
  { slug: 'giratina-v-186', acquired: false, isBlackLabel: false, blPop: 10 },
  { slug: 'aerodactyl-v-180', acquired: false, isBlackLabel: false, blPop: 4 },
  { slug: 'dragonite-v-192', acquired: false, isBlackLabel: false, blPop: 4 },
  { slug: 'espeon-v-180', acquired: false, isBlackLabel: false, blPop: 2 },
  { slug: 'machamp-v-172', acquired: false, isBlackLabel: false, blPop: 2 },
  { slug: 'tyranitar-v-155', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'charizard-v-154', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'starmie-v-tg13', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'celebi-v-245', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'galarian-slowking-v-179', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'beedrill-v-161', acquired: false, isBlackLabel: false, blPop: 0 },
];
```

Note: I set all 15 to `acquired: false` to match your actual current state (you don't own any BLs yet). But to test all three visual states during development, Claude Code should temporarily set 1–2 cards to `isBlackLabel: true` and 2–3 to `acquired: true` with a non-BL grade, then revert before committing. Add a code comment noting this.

### 4.5 Sort Order on Hunt Page

Cards on The Hunt page sort differently than the home page. Instead of `displayOrder`, sort by **hunt priority**:

1. **Black Label acquired** cards at the top (trophies — celebrate them)
2. **Owned, not BL** cards in the middle (progress — show the upgrade path)
3. **Not owned** cards at the bottom, sorted by BL pop ascending (rarest opportunity first)

This means Tyranitar V (pop 0) and the other pop-0 cards surface at the bottom of the "not owned" section as the hardest (or most unique) targets. Within equal pop counts, fall back to `displayOrder`.

---

## 5. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/hunt/page.tsx` | **REWRITE** | Hunt page with progress ring + card grid |
| `src/components/hunt/HuntCard.tsx` | **CREATE** | Individual hunt card with 3 visual states |
| `src/components/hunt/ProgressRing.tsx` | **CREATE** | SVG donut progress ring |
| `src/components/hunt/HuntStats.tsx` | **CREATE** | Stats summary beside the ring |
| `src/lib/utils/mockHuntData.ts` | **CREATE** | Mock ownership data for all 15 cards |

---

## 6. Verification

```
□ /hunt page renders with "THE HUNT" title
□ Progress ring shows 0/15 (or test value) with count-up animation
□ Stats summary shows all four metrics with placeholder values
□ 15 hunt cards render in a 3×3 grid (5 rows)
□ Cards sort by hunt priority (acquired → owned → hunting, then by BL pop)
□ "Hunting" state cards are desaturated with dashed border
□ "Owned" state cards show grade badge (if testing with mock owned cards)
□ "Acquired" (BL) state cards glow with gold border (if testing)
□ BL Pop: 0 cards show "NONE" in warning color
□ Clicking a hunt card navigates to /card/[slug]
□ Scroll entrance animation with stagger works
□ Responsive: 3/2/1 columns at breakpoints
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

**→ Continue to PRD-04b for ownership management UI and acquisition tracking**
