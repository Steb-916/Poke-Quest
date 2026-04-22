# PRD-06a: Rarity Aurora & Portfolio Analytics

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 06a of 2 (Card-Level + Portfolio-Level Visualizations)  
**Depends on:** PRD-05a/b/c complete (real data flowing)

---

## 1. Overview

This PRD adds two visualization systems: the **Rarity Aurora** (a per-card scarcity visualization that replaces or augments the pop report bars) and **Portfolio Analytics** (aggregate views across all 15 cards on the home page). These are the visual features that make the site a portfolio piece — they go beyond standard charts into custom, branded data art.

---

## 2. Rarity Aurora

### 2.1 Concept

The Rarity Aurora is a circular visualization that shows a card's grading population at a glance. It replaces the mental work of reading pop report numbers with an immediate visual impression of "how rare is this card."

It consists of concentric rings around the card image, one ring per grading tier. The innermost ring is the rarest grade (Black Label), the outermost is the most common (PSA 10). Thinner, brighter rings = rarer. Thicker, dimmer rings = more common. The visual metaphor: the card sits at the center of its own gravitational field, with rarity creating tighter orbits.

### 2.2 Ring Structure (inside → outside)

| Ring | Grade | Color | Behavior |
|------|-------|-------|----------|
| 1 (innermost) | BGS Black Label | `#c9a84c` (gold) | Thinnest ring, brightest glow. If pop 0: dashed ring |
| 2 | BGS 10 Pristine | `#c9a84c` at 60% opacity | Thin |
| 3 | CGC 10 Perfect | `var(--color-cgc)` at 80% | Thin-medium |
| 4 | PSA 10 | `var(--color-psa)` at 80% | Medium-thick (usually highest pop) |
| 5 (outermost) | Total Graded (all companies) | `var(--color-text-tertiary)` at 40% | Thickest, most transparent |

### 2.3 Ring Sizing Math

Ring thickness is logarithmically proportional to population count. This prevents PSA 10 (often 10,000+) from completely dominating the visual while still showing the relative difference.

```typescript
function ringThickness(pop: number, maxThickness: number = 20): number {
  if (pop === 0) return 1; // Minimum 1px for dashed "empty" ring
  // Log scale: pop of 1 → ~2px, pop of 100 → ~10px, pop of 10000 → ~18px
  return Math.max(2, Math.min(maxThickness, 2 + Math.log10(pop + 1) * 4));
}
```

### 2.4 Ring Animation

On page load (or when the component enters the viewport), rings animate outward from the center:

1. All rings start at radius 0 with opacity 0
2. Each ring expands to its final radius with a spring ease, staggered 80ms apart (innermost first)
3. Opacity fades in during the expansion
4. The Black Label ring (if pop > 0) gets a subtle pulse animation after settling: `opacity: 0.8 → 1.0 → 0.8` on a 3-second loop

### 2.5 Interaction

Hovering over a ring highlights it (brightens to full opacity) and shows a tooltip with:
```
BGS Black Label
Pop: 138
% of total BGS: 5.6%
```

Hovering dims all other rings to 30% opacity so the selected ring stands out.

### 2.6 SVG Implementation

Build as a custom SVG component using `<circle>` elements with `stroke-width` for ring thickness:

```typescript
// Component: src/components/charts/RarityAurora.tsx

interface AuroraRing {
  label: string;
  pop: number;
  color: string;
  radius: number;     // Distance from center
  thickness: number;  // Calculated from pop
  dashed?: boolean;   // True if pop is 0
}
```

Each ring is a `<circle>` with:
- `fill="none"`
- `stroke={color}`
- `stroke-width={thickness}`
- `stroke-dasharray` if dashed (pop 0)
- Animated `r` (radius) via Framer Motion's `motion.circle`

The card image sits in the center as a clipped circle (using `<clipPath>`) or a small square with rounded corners.

### 2.7 Placement

The Rarity Aurora replaces or sits alongside the horizontal pop report bars on the card detail page. It goes inside the Pop Reports data panel as a visual header above the detailed bar breakdown. The bars remain for exact numbers — the aurora is for instant visual comprehension.

### 2.8 Component: `src/components/charts/RarityAurora.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardMeta } from '@/lib/utils/cardData';

interface PopData {
  blackLabel: number;
  bgs10: number;
  cgc10: number;
  psa10: number;
  totalGraded: number;
}

interface RarityAuroraProps {
  card: CardMeta;
  popData: PopData;
}

export function RarityAurora({ card, popData }: RarityAuroraProps) {
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

  const rings = [
    { id: 'bl', label: 'BGS Black Label', pop: popData.blackLabel, color: '#c9a84c', baseRadius: 70 },
    { id: 'bgs10', label: 'BGS 10 Pristine', pop: popData.bgs10, color: 'rgba(201,168,76,0.6)', baseRadius: 90 },
    { id: 'cgc10', label: 'CGC 10 Perfect', pop: popData.cgc10, color: 'rgba(21,101,192,0.8)', baseRadius: 110 },
    { id: 'psa10', label: 'PSA 10', pop: popData.psa10, color: 'rgba(211,47,47,0.8)', baseRadius: 130 },
    { id: 'total', label: 'Total Graded', pop: popData.totalGraded, color: 'rgba(138,138,154,0.4)', baseRadius: 155 },
  ];

  // ... render SVG with animated circles, center card thumbnail, tooltips
}
```

### 2.9 Empty State

If no pop data exists for a card, show the aurora with all rings dashed and a center label: "No grading data yet."

---

## 3. Portfolio Value Over Time

### 3.1 Component: `src/components/charts/PortfolioValueChart.tsx`

An area chart showing the total portfolio value across all 15 cards over time. This goes on the home page below the card grid (new section).

### 3.2 Chart Specs

- **Type:** Area chart (filled below the line) using Recharts `<AreaChart>`
- **Data:** Sum of `rawMarket` prices for all 15 cards at each date
- **Fill:** Gradient from `var(--color-accent)` at 20% opacity at top to transparent at bottom
- **Line:** 2px stroke in `var(--color-accent)`
- **Time range:** Default to ALL, with 1M/3M/6M/1Y/ALL toggles
- **Y-axis:** Dollar values, formatted as $XXk
- **X-axis:** Dates, formatted as MMM YY
- **Tooltip:** Shows total value + per-card breakdown of top movers on that date
- **Responsive:** Full width of the content container

### 3.3 Section Wrapper

The chart lives in a new section on the home page, below the card grid:

```
── PORTFOLIO PERFORMANCE ────────────────────────
[1M] [3M] [6M] [1Y] [ALL]

[            Area Chart              ]
[         $47,850.99 total          ]

── MARKET MOVERS ────────────────────────────────
↑ Umbreon VMAX    +$2,400 (7.7%)    last 30d
↑ Charizard V     +$180 (12.1%)     last 30d
↓ Rayquaza VMAX   -$600 (-5.4%)     last 30d
```

### 3.4 Market Movers

Below the chart, a simple list of cards sorted by price change over the selected time range. Shows top 3 gainers and top 3 losers.

Each row:
- Arrow (↑ green or ↓ red)
- Card name
- Dollar change
- Percentage change
- Time period

```typescript
interface MarketMover {
  card: CardMeta;
  dollarChange: number;
  percentChange: number;
  direction: 'up' | 'down';
}
```

### 3.5 Data Source

Query the `PriceSnapshot` table, group by date, sum `rawMarket` across all cards:

```typescript
// Add to src/lib/db/queries.ts:
export async function getPortfolioHistory(days: number = 365) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await prisma.priceSnapshot.findMany({
    where: { date: { gte: since } },
    select: { date: true, rawMarket: true, cardId: true },
    orderBy: { date: 'asc' },
  });

  // Group by date, sum rawMarket per date
  const byDate = new Map<string, number>();
  for (const s of snapshots) {
    if (!s.rawMarket) continue;
    const key = s.date.toISOString().split('T')[0];
    byDate.set(key, (byDate.get(key) || 0) + s.rawMarket);
  }

  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}
```

---

## 4. Card Comparison Radar

### 4.1 Concept

A radar/spider chart that compares a card across multiple dimensions. Useful for evaluating which cards to prioritize for acquisition. This appears on the card detail page as an additional tab or below the existing data panels.

### 4.2 Dimensions (6 axes)

| Axis | Metric | Higher = ? |
|------|--------|------------|
| Value | Raw NM market price | More valuable |
| Scarcity | Inverse of total graded pop (1/pop normalized) | Rarer |
| BL Rarity | Inverse of Black Label pop | Fewer BLs exist |
| Price Momentum | 30-day price change % | Appreciating faster |
| Grade Rate | % of submissions that hit 10 (any company) | Easier to get a 10 |
| Demand | Sales volume over last 90 days | More actively traded |

### 4.3 Implementation

Use **D3.js** for this — Recharts' RadarChart exists but D3 gives more control over the aesthetic.

Each axis is normalized to 0–1 scale. The card's values fill a polygon. Optionally, overlay the average of all 15 cards as a semi-transparent polygon for comparison.

```typescript
// Component: src/components/charts/CardRadar.tsx
```

### 4.4 Styling

- Axis lines: `var(--color-border-default)` at 40% opacity
- Axis labels: `var(--color-text-tertiary)`, small, positioned at each spoke end
- Card polygon fill: `var(--color-accent)` at 15% opacity
- Card polygon stroke: `var(--color-accent)` at 80%
- Average polygon fill: `var(--color-text-secondary)` at 8% opacity (ghosted)
- Average polygon stroke: `var(--color-text-tertiary)` at 30% (barely visible)
- Hover on an axis: highlight that dimension, show the raw value in a tooltip

### 4.5 Placement

New tab in the card detail DataPanels: add "Analysis" as a fourth tab after "Recent Sales". The radar chart is the hero of this tab, with the raw numbers listed below it in a clean two-column layout.

---

## 5. Price Prediction Indicators

### 5.1 Concept

Not a full ML model — just simple trend indicators based on the data we have. These are visual cues that help inform buying decisions.

### 5.2 Indicators

**30-Day Trend Arrow** — already partially implemented in Market Movers. Add it to the CardIdentity panel on the card detail page next to each price line:

```
Raw NM        $1,055  ↑ +3.2%
PSA 10        $2,800  → flat
Black Label   $33,600 ↑ +12.1%
```

Arrow + color: green ↑ (>2% increase), red ↓ (>2% decrease), gray → (within ±2%)

**Price-to-Pop Ratio** — a simple metric showing value relative to scarcity:

```
Price per BL pop point: $243.48
```

Calculated as: `Black Label price / Black Label pop`. Lower = potentially undervalued relative to scarcity. Show this on the card detail page and on The Hunt page for each card.

**Estimated Fair Value Range** — based on comparable cards:

For each card, find other cards in the collection with similar pop ranges and calculate a price band. Display as a simple min–max bar with the current price marked:

```
Fair Value Range (based on comparable BL pops)
$28,000 ├────────●─────┤ $40,000
                $33,600 (current)
```

This is naive but useful — it's saying "other cards with similar Black Label populations trade in this range."

### 5.3 Component: `src/components/charts/TrendIndicators.tsx`

A set of small, inline indicator components:

```typescript
export function TrendArrow({ change }: { change: number }) { /* ↑ ↓ → */ }
export function PricePerPop({ price, pop }: { price: number; pop: number }) { /* ratio */ }
export function FairValueBar({ low, high, current }: { low: number; high: number; current: number }) { /* bar */ }
```

These are inline components used inside CardIdentity and the Analysis tab — not standalone panels.

---

## 6. Home Page Additions

### 6.1 New Sections Below Card Grid

The home page gets two new sections below the 15-card grid:

```
[Card Grid — 5×3]

── PORTFOLIO PERFORMANCE ──
[PortfolioValueChart]
[Market Movers: top 3 up, top 3 down]

── COLLECTION OVERVIEW ──
[Scarcity Spectrum — all 15 cards plotted by BL pop]
```

### 6.2 Scarcity Spectrum

A horizontal strip showing all 15 cards positioned by their Black Label population. Cards with pop 0 sit at the left (rarest), Umbreon with pop 138 sits at the right (most common). Each card is represented by a small circular thumbnail.

Implementation: a simple D3 scale mapping pop → x position, with card thumbnails as positioned elements.

```
POP 0                                                POP 138
●●●●●●  ●  ●  ●●  ●   ●          ●         ●
Ttar    Aero Drag  Esp  Gir  Deo   Ray      Umb
Zard    Bee  Star  Mac  Gen
Cele    Slow
```

Hover on a dot: shows card name, BL pop, and current BL price (if available). Click navigates to the card detail page.

---

## 7. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/charts/RarityAurora.tsx` | **CREATE** | Concentric ring scarcity visualization |
| `src/components/charts/PortfolioValueChart.tsx` | **CREATE** | Area chart for total portfolio value |
| `src/components/charts/MarketMovers.tsx` | **CREATE** | Top gainers/losers list |
| `src/components/charts/CardRadar.tsx` | **CREATE** | D3 radar/spider comparison chart |
| `src/components/charts/TrendIndicators.tsx` | **CREATE** | Inline trend arrows, price-per-pop, fair value bar |
| `src/components/charts/ScarcitySpectrum.tsx` | **CREATE** | Horizontal BL pop distribution |
| `src/lib/db/queries.ts` | **MODIFY** | Add getPortfolioHistory, getMarketMovers |
| `src/app/page.tsx` | **MODIFY** | Add Portfolio Performance + Scarcity Spectrum sections |
| `src/components/charts/PopReport.tsx` | **MODIFY** | Add RarityAurora as visual header |
| `src/components/cards/DataPanels.tsx` | **MODIFY** | Add "Analysis" tab with CardRadar |
| `src/components/cards/CardIdentity.tsx` | **MODIFY** | Add trend arrows next to prices |

---

## 8. Verification

```
□ Card detail Pop Reports tab shows Rarity Aurora above the bar breakdown
□ Aurora rings animate outward on page load with stagger
□ Hovering a ring highlights it and shows tooltip with pop + percentage
□ Pop 0 rings render as dashed
□ Black Label ring pulses subtly if pop > 0
□ Home page shows Portfolio Performance section below card grid
□ Area chart renders with time range toggles
□ Market Movers shows top 3 up and top 3 down
□ Scarcity Spectrum shows all 15 cards positioned by BL pop
□ Card detail Analysis tab shows radar chart with 6 dimensions
□ Trend arrows appear next to prices in CardIdentity (green/red/gray)
□ All visualizations handle empty data gracefully
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

**→ Continue to PRD-06b for scroll animations, micro-interactions, and final visual polish**
