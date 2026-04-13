# PRD-03a: Card Detail Page & Slab Viewer

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 03a of 2 (Page Structure + Slab Viewer)  
**Depends on:** PRD-02a and PRD-02b complete and verified

---

## 1. Overview

The card detail page (`/card/[slug]`) is where a single card gets the full treatment. It's the analytical deep dive — slab viewer, price history, pop reports, graded sales, and ownership/hunt status. This PRD covers the page structure, the slab viewer with grading company switching, and the dynamic accent color system. Data panels are laid out with placeholder content — real data integration happens in PRD-05.

---

## 2. Page Layout

### 2.1 Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Bar (fixed)                                      │
├─────────────────────────────────────────────────────────────┤
│  Back Link: ← Back to Vault                                 │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                    │
│     SLAB VIEWER          │    CARD IDENTITY                   │
│                          │                                    │
│  ┌──────────────────┐    │    Umbreon VMAX                    │
│  │                  │    │    Evolving Skies · 215/203        │
│  │   [Card in Slab] │    │    Illustrated by Keiichiro Ito    │
│  │                  │    │    Dark · VMAX · 310 HP            │
│  │   floating,      │    │                                    │
│  │   tilting with    │    │    ┌─────────────────────────┐    │
│  │   mouse          │    │    │ Current Market Value     │    │
│  │                  │    │    │ RAW: $1,055    PSA 10: — │    │
│  └──────────────────┘    │    │ BGS BL: $33,600          │    │
│                          │    └─────────────────────────┘    │
│  [RAW] [PSA] [BGS]       │                                    │
│  [CGC] [SGC]             │    Hunt Status:                    │
│                          │    ● Hunting Black Label           │
│  BGS: [Silver][Gold]     │                                    │
│       [■ Black Label]    │                                    │
│                          │                                    │
├──────────────────────────┴──────────────────────────────────┤
│                                                               │
│  DATA PANELS (tabbed or stacked)                             │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐           │
│  │ Price History│ │ Pop Reports │ │ Recent Sales  │           │
│  └─────────────┘ └─────────────┘ └──────────────┘           │
│                                                               │
│  [Chart / Visualization / Table area]                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Behavior

- **≥1024px:** Two-column hero (slab viewer left, card info right), data panels full width below
- **<1024px:** Single column — slab viewer stacks above card info, data panels below

### 2.3 Page Entry Animation

When navigating to the card detail page, the content enters with a coordinated sequence:
1. The slab viewer fades in from the left with a slight X offset (Framer Motion, 400ms)
2. The card identity block fades in from the right (400ms, 100ms delay)
3. The data panels fade up from below (500ms, 200ms delay)

Use `framer-motion`'s `motion.div` with `initial` / `animate` props. No `whileInView` here — everything animates on page mount since this is a navigation, not a scroll.

---

## 3. Dynamic Accent Color System

### 3.1 Concept

Each card has a unique accent color defined in `cardData.ts`. When you navigate to a card's detail page, the page's accent color shifts to match that card. This affects borders, glows, active states, progress bars, and chart colors throughout the page.

### 3.2 Implementation

On the card detail page, set a CSS custom property override on the page wrapper:

```typescript
<div style={{ '--color-accent': card.accentColor } as React.CSSProperties}>
  {/* All child components inherit this card's accent */}
</div>
```

Because all components already reference `var(--color-accent)` for their active/highlight states (from the design system in PRD-01), this single override cascades everywhere. The nav, portfolio header, and other global elements outside this wrapper keep the default gold accent.

### 3.3 Accent Glow

Derive dim and glow variants dynamically. Add these to the page wrapper as well:

```typescript
// In the page component, compute from the card's accentColor hex
const accentHex = card.accentColor; // e.g., "var(--card-umbreon)" resolves to #8b5cf6

// Set on the wrapper div:
style={{
  '--color-accent': `var(--card-${card.pokemon.toLowerCase()})`,
  '--color-accent-dim': `var(--card-${card.pokemon.toLowerCase()})33`,
  '--color-accent-glow': `var(--card-${card.pokemon.toLowerCase()})55`,
} as React.CSSProperties}
```

Note: For Galarian Slowking, the pokemon key is `slowking` (matching the CSS variable `--card-slowking`).

---

## 4. Back Navigation

### 4.1 Back Link

At the top of the page content (below nav, above hero), a subtle back link:

```typescript
<Link
  href="/"
  className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
>
  <span className="text-lg">←</span>
  <span className="tracking-wide">Back to Vault</span>
</Link>
```

Styled as secondary text, becomes primary on hover. Uses a simple arrow character (not an icon library — keeping dependencies minimal).

---

## 5. Slab Viewer Component

### 5.1 Component: `src/components/cards/SlabViewer.tsx`

The slab viewer is the visual centerpiece of the card detail page. It displays the card image inside a grading company's slab frame, with interactive mouse-tracking tilt.

### 5.2 Grader Tabs

A row of tab buttons below the slab image:

```
[RAW]  [PSA]  [BGS]  [CGC]  [SGC]
```

- **RAW** is selected by default (matches the home page showing raw cards)
- Active tab: `bg-[var(--color-accent-dim)]` background, `text-[var(--color-accent)]` text, subtle border in accent
- Inactive tab: `bg-transparent`, `text-[var(--color-text-tertiary)]`, border in `var(--color-border-default)`
- Hover on inactive: text brightens to secondary
- Transition: 200ms on background and color

### 5.3 BGS Sub-Tabs

When BGS is the active grader, a secondary row of tabs appears below the main tabs with a slide-down animation (Framer Motion `AnimatePresence` + height animation):

```
Label:  [Silver]  [Gold]  [■ Black Label]
```

- Black Label tab has special styling: black background, white text, subtle gold border glow
- Gold tab: gold-tinted background
- Silver tab: neutral/gray
- Default selection when BGS is clicked: Gold (the most common BGS 10)

### 5.4 Slab Image Display

**RAW state:** Shows just the card image with a subtle card-stock border effect (thin white/cream border around the image to simulate the card edge, then a very subtle drop shadow). No slab frame.

**Graded states (PSA/BGS/CGC/SGC):** The card image is composited inside a slab frame. For now, since the user will source slab images later, we build the system to work with slab frame overlays but use a **generated CSS slab** as placeholder.

### 5.5 CSS Placeholder Slab

Until real slab PNGs are added, generate a visual slab using pure CSS/HTML:

```
┌──────────────────────────┐  ← Slab outer edge (rounded rect)
│  ┌────────────────────┐  │
│  │   GRADER LABEL      │  │  ← Label area (grader logo, grade, cert#)
│  │   PSA  GEM MINT 10  │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │                    │  │
│  │    [Card Image]    │  │  ← Card window
│  │                    │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

**Slab styling per grader:**

| Grader | Border Color | Label BG | Label Text | Special |
|--------|-------------|----------|------------|---------|
| PSA | `var(--color-psa)` | White | Red + black | Red accent stripe |
| BGS Silver | `#8a8a8a` | Silver gradient | Dark text | Gray trim |
| BGS Gold | `var(--color-bgs-gold)` | Gold gradient | Dark text | Gold trim |
| BGS Black | `#1a1a1a` | Black | White text | Gold inner border, strongest glow |
| CGC | `var(--color-cgc)` | White | Blue + black | Blue accent stripe |
| SGC | `var(--color-sgc)` | White | Green + black | Green accent |

The slab has:
- Outer border: 3px solid in grader color
- Rounded corners: 8px
- Inner padding: 12px around the card, 40px at top for label
- Background: semi-transparent white (`rgba(255,255,255,0.03)`) to simulate slab plastic
- A very subtle inner shadow to create depth

### 5.6 Slab Tilt Interaction

Reuse the `useCardTilt` hook from PRD-02b, but with slightly different parameters for the slab context:

- Max tilt: **6 degrees** (slightly less than the grid cards — the slab is larger on screen)
- Scale on hover: **1.02** (subtler — it's already the hero element, doesn't need to "pop")
- The shimmer effect applies over the entire slab (not just the card window)
- Add a subtle reflection on the slab surface: a white-to-transparent linear gradient at ~15° angle, very low opacity (0.03), that shifts position slightly with tilt

### 5.7 Tab Switch Animation

When switching between graders:

1. Current slab fades out slightly and scales down to 0.97 (150ms)
2. Slab frame updates to new grader
3. New slab fades in and scales up to 1.0 (200ms)

Use Framer Motion `AnimatePresence` with `mode="wait"` and a key based on the active grader + label type. This ensures the exit animation completes before the enter animation starts.

### 5.8 Component Architecture

```typescript
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { useCardTilt } from '@/hooks/useCardTilt';
import type { CardMeta } from '@/lib/utils/cardData';

type Grader = 'RAW' | 'PSA' | 'BGS' | 'CGC' | 'SGC';
type BgsLabel = 'Silver' | 'Gold' | 'Black Label';

interface SlabViewerProps {
  card: CardMeta;
}

export function SlabViewer({ card }: SlabViewerProps) {
  const [activeGrader, setActiveGrader] = useState<Grader>('RAW');
  const [bgsLabel, setBgsLabel] = useState<BgsLabel>('Gold');
  const slabRef = useRef<HTMLDivElement>(null);
  const { tiltStyle, shimmerStyle, isHovering, handlers } = useCardTilt(slabRef, {
    maxTilt: 6,
    scaleHover: 1.02,
  });

  const slabKey = activeGrader === 'BGS' ? `${activeGrader}-${bgsLabel}` : activeGrader;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Slab Display */}
      <div
        ref={slabRef}
        style={{ ...tiltStyle, transformStyle: 'preserve-3d' }}
        {...handlers}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slabKey}
            initial={{ opacity: 0.8, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeGrader === 'RAW' ? (
              <RawCardDisplay card={card} shimmerStyle={shimmerStyle} isHovering={isHovering} />
            ) : (
              <SlabDisplay
                card={card}
                grader={activeGrader}
                bgsLabel={activeGrader === 'BGS' ? bgsLabel : undefined}
                shimmerStyle={shimmerStyle}
                isHovering={isHovering}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Grader Tabs */}
      <GraderTabs active={activeGrader} onChange={setActiveGrader} />

      {/* BGS Sub-Tabs (conditional) */}
      <AnimatePresence>
        {activeGrader === 'BGS' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <BgsLabelTabs active={bgsLabel} onChange={setBgsLabel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

Note: `RawCardDisplay`, `SlabDisplay`, `GraderTabs`, and `BgsLabelTabs` are sub-components defined within the same file or as small siblings. They don't need their own files — they're tightly coupled to the slab viewer.

### 5.9 useCardTilt Hook Update

The hook needs to accept optional config parameters now (it was hardcoded in PRD-02b). Update the signature:

```typescript
interface TiltConfig {
  maxTilt?: number;     // default 8
  scaleHover?: number;  // default 1.04
}

export function useCardTilt(
  cardRef: RefObject<HTMLDivElement | null>,
  config?: TiltConfig
): CardTiltReturn {
  const maxTilt = config?.maxTilt ?? 8;
  const scaleHover = config?.scaleHover ?? 1.04;
  // ... rest uses these instead of constants
}
```

This is a backward-compatible change — the existing `CardTilt` component from PRD-02b continues to work without passing config.

---

## 6. Card Identity Panel

The right side of the hero section. Displays static metadata + key market values.

### 6.1 Content Blocks

**Card Name** — Large, display font, card's accent color:
```
font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent)]
```

**Set & Number** — Secondary text, monospace for the number:
```
Evolving Skies · 215/203
```

**Illustrator** — Subtle attribution:
```
Illustrated by Keiichiro Ito
```

**Card Attributes** — Small pills/tags:
```
[Dark]  [VMAX]  [310 HP]
```
Styled as small rounded tags with accent-dim background and accent text.

**Market Snapshot** — Key prices in a compact grid (placeholder values for now):

```
┌─────────────────────────────┐
│  Current Market              │
│                              │
│  Raw NM        $1,055        │
│  PSA 10        $2,800        │
│  BGS 10        $3,200        │
│  Black Label   $33,600       │
│  CGC 10        $2,100        │
└─────────────────────────────┘
```

All prices in `font-[var(--font-mono)]`. Labels in secondary text. The "Black Label" row should have a subtle gold/accent highlight to visually distinguish it from the other grades.

**Hunt Status** — Shows current ownership and target:
```
Status: Hunting Black Label
Best Owned: [none yet]  ← or "PSA 10" etc.
```

If the user owns a copy, show which grader/grade. If not, show "Not yet acquired" with a subtle call-to-action feel (accent-colored dot or icon).

### 6.2 Component: `src/components/cards/CardIdentity.tsx`

This is a presentational component that receives card metadata and (eventually) pricing/ownership data as props. For now, use placeholder values for prices and ownership.

---

## 7. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/card/[slug]/page.tsx` | **REWRITE** | Full card detail page with slab viewer + identity + data panels |
| `src/components/cards/SlabViewer.tsx` | **CREATE** | Slab viewer with grader tabs, tilt, animations |
| `src/components/cards/CardIdentity.tsx` | **CREATE** | Card metadata + market snapshot + hunt status |
| `src/hooks/useCardTilt.ts` | **MODIFY** | Add optional config parameter for maxTilt and scaleHover |

---

## 8. Verification

```
□ Navigating from home grid to /card/umbreon-vmax-215 works
□ Page accent color changes to purple (Umbreon's color)
□ Back link navigates to home
□ Slab viewer shows raw card by default
□ Clicking PSA/BGS/CGC/SGC tabs switches slab display with fade animation
□ BGS tab reveals sub-tabs (Silver/Gold/Black Label) with slide-down
□ Selecting Black Label shows special styling on the slab
□ Switching back to a non-BGS grader hides the sub-tabs with slide-up
□ Slab tilts on mouse movement (max 6°, scale 1.02)
□ Card identity panel shows name, set, illustrator, attributes
□ Placeholder prices display in monospace font
□ Page entry animation: slab from left, identity from right, panels from below
□ Responsive: two-column on desktop, stacked on mobile
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

**→ Continue to PRD-03b for Data Panel layouts (Price History, Pop Reports, Recent Sales)**
