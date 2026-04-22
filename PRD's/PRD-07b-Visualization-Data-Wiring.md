# PRD-07b: Visualization Data Wiring — Kill All Mock Data

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 07b (Real Data for Remaining Viz Components)  
**Depends on:** PRD-07a complete, PRD-05b complete, PriceSnapshot / PopSnapshot / GradedSale tables populated

---

## 1. Overview

Five visualization components were built during PRD-06a. All five currently render with hardcoded mock data. This PRD replaces every mock value with a real database query or a calculation derived from real data. After this PRD, **zero mock data remains anywhere on the site.** Every number, every chart point, every ring segment comes from Prisma.

The five components:

| Component | Location | Current State | Data Source |
|-----------|----------|---------------|-------------|
| Rarity Aurora | Card detail page | Mock ring data | PopSnapshot (all graders) |
| Card Radar Chart | Card detail page | Hardcoded axes | Calculated from Pop + Price + Sales |
| Portfolio Value Chart | Home page | 1 real data point | PriceSnapshot time series |
| Scarcity Spectrum | Home page or Hunt page | Mock BL pop | PopSnapshot (BGS Black Label) |
| Trend Indicators | Card grid / card detail | Mock arrows | PriceSnapshot (latest vs previous) |

### 1.1 Prerequisite: Minimum Data

These components degrade gracefully with sparse data, but to look meaningful:
- PriceSnapshot: at least 3 snapshots per card, spaced across 2+ weeks
- PopSnapshot: at least 1 snapshot per grader per card (PSA ✅, BGS ✅, CGC ✅ per status doc)
- GradedSale: at least a few records (from SoldComps or manual admin entry)

Empty states are defined for each component. No component should crash on empty data.

---

## 2. Component 1: Rarity Aurora

### 2.1 File: `src/components/charts/RarityAurora.tsx`

The Rarity Aurora is a set of concentric rings on the card detail page that visualizes how rare this card is across all grading companies. Each ring represents a grader, and the ring's circumference is divided into segments by grade.

### 2.2 What It Currently Does

Uses a hardcoded `MOCK_AURORA_DATA` object with fake population numbers. The rings render but the proportions are meaningless.

### 2.3 Real Data Source

Query the latest `PopSnapshot` for each grader for this specific card. The data shape is already in the database — PRD-05b wired the PopReport bars to real data. The Aurora uses the same underlying data but visualizes it differently (radial instead of horizontal bars).

### 2.4 Data Fetching

The card detail page (`/card/[slug]/page.tsx`) already fetches pop data via `getLatestPop(cardId)`. The Aurora component receives this as a prop — no new query needed. The existing query returns the latest snapshot per grader with fields: `total`, `grade10`, `blackLabel`, `grade95`, `grade9`, `grade85`, `grade8`, `grade7AndBelow`, `authentic`.

### 2.5 Ring Mapping

Each grader gets one concentric ring. Order from inside out:

```
Ring 1 (innermost):  BGS   — color: var(--color-bgs-gold)
Ring 2:              PSA   — color: var(--color-psa)
Ring 3:              CGC   — color: var(--color-cgc)
Ring 4 (outermost):  SGC   — color: var(--color-sgc)
```

If a grader has no PopSnapshot data, its ring renders as a thin dashed outline with a "No data" label — the ring is still present (preserves the concentric layout) but visually empty.

### 2.6 Segment Calculation

Each ring is a full circle divided into arc segments proportional to grade distribution:

```typescript
interface AuroraRing {
  grader: string;
  color: string;
  segments: Array<{
    grade: string;       // "Black Label" | "10" | "9.5" | "9" | "8.5" | "8" | "≤7"
    count: number;
    percentage: number;  // count / total * 100
    color: string;       // grade-specific color (brighter for higher grades)
  }>;
  total: number;
}

/**
 * Transform PopSnapshot data into Aurora ring segments.
 */
export function buildAuroraRings(
  popData: Array<{
    grader: string;
    total: number;
    grade10: number;
    blackLabel: number;
    grade95: number;
    grade9: number;
    grade85: number;
    grade8: number;
    grade7AndBelow: number;
    authentic: number;
  }>
): AuroraRing[] {
  const GRADER_ORDER = ['BGS', 'PSA', 'CGC', 'SGC'];
  const GRADER_COLORS: Record<string, string> = {
    BGS: 'var(--color-bgs-gold)',
    PSA: 'var(--color-psa)',
    CGC: 'var(--color-cgc)',
    SGC: 'var(--color-sgc)',
  };

  return GRADER_ORDER.map((grader) => {
    const pop = popData.find((p) => p.grader === grader);

    if (!pop || pop.total === 0) {
      return {
        grader,
        color: GRADER_COLORS[grader] || 'var(--color-text-tertiary)',
        segments: [],
        total: 0,
      };
    }

    const baseColor = GRADER_COLORS[grader] || 'var(--color-text-tertiary)';

    // Build segments from highest to lowest grade
    const raw = [
      { grade: grader === 'BGS' ? 'Black Label' : grader === 'CGC' ? 'Perfect 10' : '10', count: grader === 'BGS' ? pop.blackLabel : 0, opacity: 1.0 },
      { grade: '10', count: pop.grade10, opacity: 0.85 },
      { grade: '9.5', count: pop.grade95, opacity: 0.65 },
      { grade: '9', count: pop.grade9, opacity: 0.45 },
      { grade: '8.5', count: pop.grade85, opacity: 0.3 },
      { grade: '8', count: pop.grade8, opacity: 0.2 },
      { grade: '≤7', count: pop.grade7AndBelow, opacity: 0.1 },
    ].filter((s) => s.count > 0);

    return {
      grader,
      color: baseColor,
      segments: raw.map((s) => ({
        grade: s.grade,
        count: s.count,
        percentage: (s.count / pop.total) * 100,
        color: baseColor, // Opacity is applied per-segment via the opacity field
      })),
      total: pop.total,
    };
  });
}
```

Add this function to `src/lib/utils/calculations.ts`.

### 2.7 D3 Rendering Update

The Aurora already uses D3 for SVG arc generation. The change is replacing the mock data input with the `buildAuroraRings()` output. The D3 arc generator stays the same — it receives an array of segments with percentages and draws proportional arcs.

**Key update in the component:**

```typescript
// REMOVE:
// import { MOCK_AURORA_DATA } from '@/lib/utils/mockAuroraData';

// REPLACE with prop:
interface RarityAuroraProps {
  popData: Array<PopSnapshot>; // from getLatestPop(cardId)
}

export function RarityAurora({ popData }: RarityAuroraProps) {
  const rings = buildAuroraRings(popData);
  // ... existing D3 rendering using rings instead of mock data
}
```

### 2.8 Center Stat

The center of the Aurora rings displays a key stat. Replace the mock value with:

```
Total Graded
XX,XXX
```

Calculated as the sum of `total` across all graders for this card. `font-[var(--font-display)]` for the number, `font-[var(--font-mono)]` 10px uppercase for the label. If total is 0, show `—` with "No grading data" below.

### 2.9 Black Label Callout

If this card has any BGS Black Label copies (blackLabel > 0), render a small radial line from the Black Label arc segment to a floating label outside the outermost ring:

```
                    ┌─────────────┐
    ╱───────────────│  BL: 138    │
   ╱                └─────────────┘
  ◉ (arc segment)
```

This pulls the eye to the most important data point. The label has `bg-[var(--color-bg-tertiary)]`, border `var(--color-bgs-gold)`, `font-[var(--font-mono)]` 11px. If blackLabel is 0, the callout still renders but shows `BL: 0` with `var(--color-warning)` text.

### 2.10 Empty State

If no PopSnapshot records exist for this card at all:

```
No grading population data available yet.
```

The ring area renders as 4 thin dashed concentric circles in `var(--color-border-default)` at 20% opacity — a skeleton of what the Aurora will look like when data arrives.

---

## 3. Component 2: Card Radar Chart

### 3.1 File: `src/components/charts/CardRadar.tsx`

A radar (spider) chart on the card detail page that scores a card across multiple dimensions. This gives visitors an at-a-glance "profile" of a card — is it rare? Is it expensive? Is it trending? Is it popular?

### 3.2 What It Currently Does

Renders a 5-axis radar with hardcoded values between 0 and 100.

### 3.3 Axes and Calculation Logic

Five axes, each scored 0–100 based on real data. Add to `src/lib/utils/calculations.ts`:

```typescript
interface RadarScore {
  axis: string;
  value: number;    // 0–100
  rawValue: string; // Human-readable raw value for tooltip
}

/**
 * Calculate radar chart scores for a single card.
 *
 * Each axis normalizes a real metric to a 0–100 scale relative to
 * the other 14 cards in the collection. This means the "best" card
 * on any axis scores ~100 and the "worst" scores ~0.
 *
 * Axes:
 * 1. SCARCITY — Based on BGS Black Label pop (inverted: lower pop = higher score)
 * 2. VALUE — Based on PSA 10 or rawMarket price (higher = higher score)
 * 3. MOMENTUM — Based on 30-day price change % (higher gain = higher score)
 * 4. DEMAND — Based on GradedSale count in last 30 days (more sales = higher score)
 * 5. GRADE RATE — Based on PSA 10 as % of total PSA graded (higher % = higher score)
 */
export function calculateRadarScores(
  cardId: string,
  allCardsData: {
    cards: Array<{ id: string; slug: string; name: string }>;
    blPops: Map<string, number>;          // cardId → BL pop count
    prices: Map<string, number>;          // cardId → current price (PSA 10 or raw)
    priceChanges: Map<string, number>;    // cardId → 30-day % change
    salesCounts: Map<string, number>;     // cardId → sale count last 30 days
    gradeRates: Map<string, number>;      // cardId → PSA 10 as % of total PSA
  }
): RadarScore[] {
  const { cards, blPops, prices, priceChanges, salesCounts, gradeRates } = allCardsData;

  // Helper: normalize a value within the range of all 15 cards to 0–100
  function normalize(
    cardId: string,
    dataMap: Map<string, number>,
    invert: boolean = false
  ): { value: number; raw: number } {
    const values = cards
      .map((c) => dataMap.get(c.id) ?? 0)
      .filter((v) => v !== 0);

    if (values.length === 0) return { value: 50, raw: 0 }; // Default to midpoint

    const min = Math.min(...values);
    const max = Math.max(...values);
    const raw = dataMap.get(cardId) ?? 0;

    if (max === min) return { value: 50, raw };

    let normalized = ((raw - min) / (max - min)) * 100;
    if (invert) normalized = 100 - normalized;

    return { value: Math.round(Math.max(0, Math.min(100, normalized))), raw };
  }

  const scarcity = normalize(cardId, blPops, true); // Lower pop = higher score
  const value = normalize(cardId, prices);
  const momentum = normalize(cardId, priceChanges);
  const demand = normalize(cardId, salesCounts);
  const gradeRate = normalize(cardId, gradeRates);

  return [
    { axis: 'Scarcity', value: scarcity.value, rawValue: `BL Pop: ${scarcity.raw}` },
    { axis: 'Value', value: value.value, rawValue: `$${value.raw.toLocaleString()}` },
    { axis: 'Momentum', value: momentum.value, rawValue: `${momentum.raw > 0 ? '+' : ''}${momentum.raw.toFixed(1)}%` },
    { axis: 'Demand', value: demand.value, rawValue: `${demand.raw} sales / 30d` },
    { axis: 'Grade Rate', value: gradeRate.value, rawValue: `${gradeRate.raw.toFixed(1)}% PSA 10` },
  ];
}
```

### 3.4 Data Assembly

The card detail page needs to fetch data for **all 15 cards** (not just the current card) to compute relative normalization. Add to `src/lib/db/queries.ts`:

```typescript
/**
 * Get all data needed for radar chart normalization across all 15 cards.
 * Returns pre-computed maps that calculateRadarScores() consumes.
 */
export async function getRadarChartData(): Promise<{
  cards: Array<{ id: string; slug: string; name: string }>;
  blPops: Map<string, number>;
  prices: Map<string, number>;
  priceChanges: Map<string, number>;
  salesCounts: Map<string, number>;
  gradeRates: Map<string, number>;
}> {
  const cards = await prisma.card.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { displayOrder: 'asc' },
  });

  const blPops = new Map<string, number>();
  const prices = new Map<string, number>();
  const priceChanges = new Map<string, number>();
  const salesCounts = new Map<string, number>();
  const gradeRates = new Map<string, number>();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const card of cards) {
    // BL Pop: latest BGS snapshot
    const bgsPop = await prisma.popSnapshot.findFirst({
      where: { cardId: card.id, grader: 'BGS' },
      orderBy: { date: 'desc' },
    });
    blPops.set(card.id, bgsPop?.blackLabel ?? 0);

    // Price: latest snapshot, prefer PSA 10, fall back to rawMarket
    const latestPrice = await prisma.priceSnapshot.findFirst({
      where: { cardId: card.id },
      orderBy: { date: 'desc' },
    });
    prices.set(card.id, latestPrice?.psa10 ?? latestPrice?.rawMarket ?? 0);

    // Price change: compare latest vs ~30 days ago
    const oldPrice = await prisma.priceSnapshot.findFirst({
      where: { cardId: card.id, date: { lte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    });
    if (latestPrice && oldPrice) {
      const current = latestPrice.psa10 ?? latestPrice.rawMarket ?? 0;
      const previous = oldPrice.psa10 ?? oldPrice.rawMarket ?? 0;
      if (previous > 0) {
        priceChanges.set(card.id, ((current - previous) / previous) * 100);
      }
    }

    // Sales count: last 30 days
    const salesCount = await prisma.gradedSale.count({
      where: { cardId: card.id, date: { gte: thirtyDaysAgo } },
    });
    salesCounts.set(card.id, salesCount);

    // Grade rate: PSA 10 as % of total PSA graded
    const psaPop = await prisma.popSnapshot.findFirst({
      where: { cardId: card.id, grader: 'PSA' },
      orderBy: { date: 'desc' },
    });
    if (psaPop && psaPop.total > 0) {
      gradeRates.set(card.id, (psaPop.grade10 / psaPop.total) * 100);
    }
  }

  return { cards, blPops, prices, priceChanges, salesCounts, gradeRates };
}
```

### 3.5 Component Update

```typescript
// REMOVE:
// const MOCK_RADAR = [{ axis: 'Scarcity', value: 85 }, ...];

// REPLACE:
interface CardRadarProps {
  scores: RadarScore[];
  accentColor: string; // The card's accent CSS variable
}

export function CardRadar({ scores, accentColor }: CardRadarProps) {
  // ... existing Recharts RadarChart or D3 radar rendering
  // using scores prop instead of mock data
}
```

### 3.6 Recharts Radar Configuration

The radar chart uses Recharts `RadarChart`:

```typescript
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
```

**Styling:**
- Grid: `var(--color-border-default)` at 20% opacity
- Polygon fill: `var(--color-accent)` at 15% opacity
- Polygon stroke: `var(--color-accent)` at 80% opacity, 2px
- Dots at each axis point: 4px circles in `var(--color-accent)`
- Axis labels: `font-[var(--font-mono)]`, 10px, `var(--color-text-tertiary)`
- Tooltip: shows axis name + score + raw value

### 3.7 Empty State

If fewer than 2 data sources have values (e.g., only pop data exists but no prices or sales):

```
Not enough data to generate a card profile.
More dimensions unlock as price and sales data are collected.
```

Render a faded pentagon outline (the 5-axis grid with no filled polygon) behind the message.

### 3.8 Placement

The radar chart sits in the card detail page's right column (CardIdentity area), below the Market Snapshot prices and above the Hunt Status. It's a compact visualization — 200px × 200px max, with labels extending slightly beyond.

---

## 4. Component 3: Portfolio Value Chart

### 4.1 File: `src/components/charts/PortfolioValue.tsx`

An area chart on the home page showing the total estimated portfolio value over time. This is the "big picture" — how much is your 15-card collection worth today, and how has that changed?

### 4.2 What It Currently Does

Renders a single data point (or mock time series) as a Recharts AreaChart.

### 4.3 Calculation Logic

Add to `src/lib/utils/calculations.ts`:

```typescript
interface PortfolioDataPoint {
  date: string;         // ISO date string
  totalValue: number;   // Sum of all 15 cards' prices at this date
  cardCount: number;    // How many cards had price data at this date
}

/**
 * Build portfolio value time series from PriceSnapshot records.
 *
 * Strategy:
 * 1. Get all PriceSnapshots for all 15 cards, ordered by date.
 * 2. Group snapshots by date (rounded to day).
 * 3. For each unique date, sum the price across all cards that have
 *    a snapshot on or before that date (carry forward last known price).
 * 4. Return the time series.
 *
 * Price priority per card: psa10 → rawMarket → rawMid
 * (Use the first non-null value — same waterfall as Market Movers)
 */
export function buildPortfolioTimeSeries(
  snapshots: Array<{
    cardId: string;
    date: Date;
    psa10: number | null;
    rawMarket: number | null;
    rawMid: number | null;
  }>,
  cardIds: string[]
): PortfolioDataPoint[] {
  if (snapshots.length === 0) return [];

  // Extract price using waterfall
  function getPrice(snap: typeof snapshots[0]): number {
    return snap.psa10 ?? snap.rawMarket ?? snap.rawMid ?? 0;
  }

  // Group by date (day granularity)
  const byDate = new Map<string, Map<string, number>>();

  // Track last known price per card for carry-forward
  const lastKnown = new Map<string, number>();

  // Sort all snapshots by date
  const sorted = [...snapshots].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (const snap of sorted) {
    const dateKey = snap.date.toISOString().split('T')[0];
    const price = getPrice(snap);

    if (price > 0) {
      lastKnown.set(snap.cardId, price);
    }

    if (!byDate.has(dateKey)) {
      // Carry forward all last known prices to this new date
      byDate.set(dateKey, new Map(lastKnown));
    } else {
      // Update this card's price for this date
      if (price > 0) {
        byDate.get(dateKey)!.set(snap.cardId, price);
      }
    }
  }

  // Build time series
  const series: PortfolioDataPoint[] = [];
  for (const [dateKey, cardPrices] of byDate) {
    let total = 0;
    let count = 0;
    for (const cardId of cardIds) {
      const price = cardPrices.get(cardId);
      if (price && price > 0) {
        total += price;
        count++;
      }
    }
    series.push({
      date: dateKey,
      totalValue: Math.round(total * 100) / 100,
      cardCount: count,
    });
  }

  return series;
}
```

### 4.4 Database Query

Add to `src/lib/db/queries.ts`:

```typescript
/**
 * Get all PriceSnapshot records for all cards, ordered by date.
 * Used to build the portfolio value time series.
 */
export async function getAllPriceSnapshots(): Promise<any[]> {
  return prisma.priceSnapshot.findMany({
    select: {
      cardId: true,
      date: true,
      psa10: true,
      rawMarket: true,
      rawMid: true,
    },
    orderBy: { date: 'asc' },
  });
}
```

### 4.5 Component Update

```typescript
// REMOVE: mock time series data

interface PortfolioValueProps {
  data: PortfolioDataPoint[];
  currentTotal: number; // Latest total for the header display
}

export function PortfolioValue({ data, currentTotal }: PortfolioValueProps) {
  // ... existing Recharts AreaChart rendering with real data
}
```

### 4.6 Chart Styling

Already defined in prior PRDs but confirming for the real data integration:

- Area fill: `var(--color-accent)` at 10% opacity, with a gradient fade to transparent at the bottom
- Line stroke: `var(--color-accent)` at 80%, 2px
- X-axis: dates in `font-[var(--font-mono)]`, 10px, `var(--color-text-tertiary)` — show month labels
- Y-axis: dollar values in `font-[var(--font-mono)]`, 10px — use `$XXk` format for readability
- Tooltip: shows exact date, exact dollar value, and how many of 15 cards had price data
- Reference line at the earliest total value — a horizontal dashed line showing the starting point, so the visual gain/loss is immediately obvious

### 4.7 Header Above Chart

```
Portfolio Value
$47,850
▲ +$3,200 (+7.1%) since tracking began
```

- Title: `font-[var(--font-display)]`, 11px, uppercase, tracking, secondary text
- Value: `font-[var(--font-display)]`, 32px, `var(--color-text-primary)` — uses `AnimatedCounter` on page load
- Change line: `font-[var(--font-mono)]`, 12px, gold for gain / red for loss
- "since tracking began" in `var(--color-text-tertiary)`

Calculate change by comparing the latest data point's `totalValue` to the earliest.

### 4.8 Placement

The Portfolio Value chart sits on the **home page** between the EraContext badge (from PRD-07a) and the card grid. It's full-width within the `max-w-[1200px]` container but has a max-height of 220px for the chart area (tight — this is a glanceable overview, not a deep dive).

```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Bar                                              │
├─────────────────────────────────────────────────────────────┤
│  Portfolio Header Strip ($XX,XXX | 15 Cards | X/15 BL)       │
├─────────────────────────────────────────────────────────────┤
│  [Out of Print] Sword & Shield era...        ← EraContext    │
├─────────────────────────────────────────────────────────────┤
│  Portfolio Value                              ← NEW POSITION │
│  $47,850                                                     │
│  ▲ +$3,200 (+7.1%) since tracking began                      │
│  ┌─────────────────────────────────────────┐                 │
│  │  ╱‾‾‾‾╲                   ╱‾‾‾‾‾‾      │                 │
│  │ ╱      ╲_________________╱              │  ← AreaChart    │
│  │╱                                        │                 │
│  └─────────────────────────────────────────┘                 │
│  Apr    May    Jun    Jul    Aug    Sep                       │
├─────────────────────────────────────────────────────────────┤
│  Card Grid (5×3)                                             │
│  ...                                                         │
```

### 4.9 Time Range Selector

Same pill pattern as other charts:

```
[1M]  [3M]  [6M]  [1Y]  [ALL]
```

Default: ALL (show entire tracking history). Since data is sparse early on, ALL will be the most useful for months. The pills filter the data array client-side — all data is passed in from the server.

### 4.10 Empty State

If fewer than 2 data points exist:

```
Portfolio tracking begins with your next price sync.
Value history will build over time as daily prices are collected.
```

Render a flat dashed line at the current portfolio value (if known from the latest single snapshot) or a completely empty chart area with the message centered.

---

## 5. Component 4: Scarcity Spectrum

### 5.1 File: `src/components/charts/ScarcitySpectrum.tsx`

A horizontal spectrum that ranks all 15 cards by their BGS Black Label population — from rarest (pop 0) on the left to most common on the right. This is the visual answer to "which of my 15 cards is the rarest in Black Label form?"

### 5.2 What It Currently Does

Uses mock hunt data with fake BL pop numbers.

### 5.3 Real Data Source

Query the latest BGS PopSnapshot for each card and extract the `blackLabel` field.

### 5.4 Database Query

This can reuse `getLatestPop` with grader filter, but for efficiency across all 15 cards, add to `src/lib/db/queries.ts`:

```typescript
/**
 * Get the latest BGS Black Label population for all cards.
 * Returns a Map of cardId → blackLabel count.
 */
export async function getBlackLabelPops(): Promise<Map<string, number>> {
  const cards = await prisma.card.findMany({ select: { id: true } });
  const map = new Map<string, number>();

  for (const card of cards) {
    const bgsPop = await prisma.popSnapshot.findFirst({
      where: { cardId: card.id, grader: 'BGS' },
      orderBy: { date: 'desc' },
    });
    map.set(card.id, bgsPop?.blackLabel ?? 0);
  }

  return map;
}
```

### 5.5 Calculation

Add to `src/lib/utils/calculations.ts`:

```typescript
interface ScarcityEntry {
  cardId: string;
  slug: string;
  name: string;
  pokemon: string;
  blPop: number;
  tier: 'mythic' | 'ultra' | 'rare' | 'uncommon';
  position: number; // 0–100, where 0 = rarest, 100 = most common
}

/**
 * Build the scarcity spectrum for all 15 cards.
 *
 * Tiers:
 * - MYTHIC: BL pop 0 (none exist)
 * - ULTRA: BL pop 1–5
 * - RARE: BL pop 6–50
 * - UNCOMMON: BL pop 51+
 *
 * Position is normalized across the 15-card set for visual spacing.
 */
export function buildScarcitySpectrum(
  cards: Array<{ id: string; slug: string; name: string; pokemon: string }>,
  blPops: Map<string, number>
): ScarcityEntry[] {
  const entries: ScarcityEntry[] = cards.map((card) => {
    const pop = blPops.get(card.id) ?? 0;

    let tier: ScarcityEntry['tier'];
    if (pop === 0) tier = 'mythic';
    else if (pop <= 5) tier = 'ultra';
    else if (pop <= 50) tier = 'rare';
    else tier = 'uncommon';

    return {
      cardId: card.id,
      slug: card.slug,
      name: card.name,
      pokemon: card.pokemon,
      blPop: pop,
      tier,
      position: 0, // calculated below
    };
  });

  // Sort by BL pop ascending (rarest first)
  entries.sort((a, b) => a.blPop - b.blPop);

  // Assign position 0–100 evenly
  entries.forEach((entry, i) => {
    entry.position = (i / (entries.length - 1)) * 100;
  });

  return entries;
}
```

### 5.6 Visual Design

A full-width horizontal bar with card markers positioned along it.

```
MYTHIC          ULTRA            RARE             UNCOMMON
  ◆               ◆  ◆             ◆ ◆ ◆ ◆          ◆ ◆ ◆ ◆ ◆ ◆
  Tyranitar       Mach Aero        Esp Dra Cel Bee   Umb Ray Gen Gir Deo Cha Sta Slo Mew
  Pop: 0          Pop: 2  3        Pop: 8  12 15 22  Pop: 45 52 ...
  ┣━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━┫
```

**Bar:**
- Background: gradient from `var(--color-warning)` (left/rarest) through `var(--color-accent)` to `var(--color-text-tertiary)` (right/most common), all at 15% opacity
- Height: 4px
- Full width of the `max-w-[1200px]` container

**Tier labels:**
- Above the bar, positioned at the tier boundaries
- `font-[var(--font-mono)]`, 9px, uppercase, letter-spacing 0.15em, `var(--color-text-tertiary)`

**Card markers:**
- Diamond shapes (◆) positioned along the bar at their `position` value
- Size: 10px
- Color by tier:
  - `mythic`: `var(--color-warning)` (#fbbf24) — these are the crown jewels, pop 0
  - `ultra`: `var(--color-accent)` (gold)
  - `rare`: `var(--color-text-secondary)`
  - `uncommon`: `var(--color-text-tertiary)`
- Below each marker: card name (abbreviated to first 3 letters for space) and BL pop count
  - `font-[var(--font-mono)]`, 9px
  - Pop 0 cards: `var(--color-warning)`, bold

**Hover on marker:** Expands to show full card name, full BL pop, and a small card thumbnail (40px wide). Use Framer Motion for scale + opacity transition.

**Click on marker:** Navigates to `/card/[slug]`.

### 5.7 Placement

The Scarcity Spectrum sits on the **home page**, inside the Market Pulse section (from PRD-07a), below the Market Movers + Supply Signals two-column layout. It spans the full width.

```
┌─────────────────────────────────────────────────────────────┐
│           ─────── MARKET PULSE ───────                       │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │   MARKET MOVERS     │  │   SUPPLY SIGNALS     │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                               │
│  SCARCITY SPECTRUM (full width)                   ← THIS     │
│  ◆───◆──◆──────◆─◆─◆─◆──────◆─◆─◆─◆─◆─◆─◆─◆               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.8 Empty State

If no BGS PopSnapshot data exists:

```
Black Label population data not yet available.
```

Render the bar with no markers — just the gradient track and tier labels.

---

## 6. Component 5: Trend Indicators

### 6.1 File: `src/components/ui/TrendIndicator.tsx`

A tiny inline component — just an arrow and a percentage — that appears on card grid tiles (home page) and in the CardIdentity panel (card detail page). It shows whether a card's price is trending up, down, or flat over the last 30 days.

### 6.2 What It Currently Does

Renders mock arrows with hardcoded percentages.

### 6.3 Calculation

This reuses the Market Movers calculation from PRD-07a. The `calculateMarketMovers` function already computes `changePercent` and `direction` for every card. The Trend Indicator just renders that data in a compact format.

No new calculation function needed — pass the mover data through as props.

### 6.4 Component

```typescript
'use client';

interface TrendIndicatorProps {
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  size?: 'sm' | 'md'; // sm for card grid, md for card detail
}

export function TrendIndicator({
  changePercent,
  direction,
  size = 'sm',
}: TrendIndicatorProps) {
  if (direction === 'flat') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-[var(--font-mono)] text-[var(--color-text-tertiary)]',
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        )}
      >
        – 0%
      </span>
    );
  }

  const isUp = direction === 'up';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-[var(--font-mono)]',
        isUp ? 'text-[var(--color-accent)]' : 'text-[var(--color-negative)]',
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      )}
    >
      <span className={size === 'sm' ? 'text-[8px]' : 'text-[10px]'}>
        {isUp ? '▲' : '▼'}
      </span>
      {isUp ? '+' : ''}{changePercent.toFixed(1)}%
    </span>
  );
}
```

### 6.5 Integration: Home Page Card Grid

Each card in the 5×3 grid gets a Trend Indicator in the bottom-right corner of the card tile, overlaid on top of the card image.

```typescript
// In CardTilt.tsx or CardGrid.tsx, add to each card's overlay:
<div className="absolute bottom-2 right-2">
  <TrendIndicator
    changePercent={moverData.changePercent}
    direction={moverData.direction}
    size="sm"
  />
</div>
```

The indicator sits on a very subtle backdrop-blur pill: `bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5`.

### 6.6 Integration: Card Detail Page

In `CardIdentity.tsx`, add the Trend Indicator next to the card name or inside the Market Snapshot section:

```
Umbreon VMAX  ▲ +12.4%
```

Use `size="md"` for the detail page variant.

### 6.7 Data Flow

The home page already fetches market mover data in PRD-07a. Pass a `Map<string, { changePercent: number; direction: string }>` as a prop to the card grid, and each `CardTilt` component receives its card's trend data.

For the card detail page, fetch the same mover data server-side (or pass through from the already-computed home page data via a shared query).

### 6.8 Empty State

If no price change data exists for a card, don't render the Trend Indicator at all — return `null`. No skeleton, no placeholder. The space just doesn't show an indicator, which is fine.

---

## 7. Mock Data Cleanup

### 7.1 Files to Delete

After all five components are wired to real data, delete every mock data file:

```
DELETE: src/lib/utils/mockAuroraData.ts    (if exists)
DELETE: src/lib/utils/mockHuntData.ts      (if exists)
DELETE: src/lib/utils/mockRadarData.ts     (if exists)
DELETE: src/lib/utils/mockPriceData.ts     (if exists)
```

### 7.2 Grep Verification

Run a project-wide search to confirm no mock data remains:

```bash
# These should all return zero results:
grep -r "MOCK_" src/ --include="*.tsx" --include="*.ts"
grep -r "mockData" src/ --include="*.tsx" --include="*.ts"
grep -r "placeholder" src/ --include="*.tsx" --include="*.ts" | grep -i "price\|pop\|sale\|value"
```

Any hits that aren't comments or empty-state messages are bugs. Fix them.

---

## 8. Home Page Final Layout

After PRD-07a and PRD-07b, the home page layout from top to bottom:

```
┌─────────────────────────────────────────────────────────────┐
│  Navigation Bar (fixed)                                      │
├─────────────────────────────────────────────────────────────┤
│  Portfolio Header Strip                                       │
├─────────────────────────────────────────────────────────────┤
│  [Out of Print] Sword & Shield era...            (EraContext) │
├─────────────────────────────────────────────────────────────┤
│  Portfolio Value                                              │
│  $47,850  ▲ +7.1%                                            │
│  [area chart ~~~~~~~~~~~~~~~~~~~~~~~~~~~~]                    │
├─────────────────────────────────────────────────────────────┤
│  Card Grid (5×3)                                             │
│  Each card has a TrendIndicator overlay                       │
├─────────────────────────────────────────────────────────────┤
│           ─────── MARKET PULSE ───────                       │
│                                                               │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │  MARKET MOVERS    │  │  SUPPLY SIGNALS   │               │
│  └───────────────────┘  └───────────────────┘               │
│                                                               │
│  SCARCITY SPECTRUM                                           │
│  ◆──◆──◆──────◆─◆─◆─◆──────◆─◆─◆─◆─◆─◆─◆─◆               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/charts/RarityAurora.tsx` | **MODIFY** | Replace mock data with real PopSnapshot props, update ring builder |
| `src/components/charts/CardRadar.tsx` | **MODIFY** | Replace hardcoded values with calculated RadarScore props |
| `src/components/charts/PortfolioValue.tsx` | **MODIFY** | Replace mock series with real time series, add header with change calc |
| `src/components/charts/ScarcitySpectrum.tsx` | **MODIFY** | Replace mock hunt data with real BL pop data, add tier classification |
| `src/components/ui/TrendIndicator.tsx` | **MODIFY** | Replace mock arrows with real Market Mover data passthrough |
| `src/lib/utils/calculations.ts` | **MODIFY** | Add `buildAuroraRings`, `calculateRadarScores`, `buildPortfolioTimeSeries`, `buildScarcitySpectrum` |
| `src/lib/db/queries.ts` | **MODIFY** | Add `getRadarChartData`, `getAllPriceSnapshots`, `getBlackLabelPops` |
| `src/app/page.tsx` | **MODIFY** | Wire PortfolioValue chart, ScarcitySpectrum, TrendIndicator data |
| `src/app/card/[slug]/page.tsx` | **MODIFY** | Wire RarityAurora, CardRadar, TrendIndicator data |
| `src/components/cards/CardIdentity.tsx` | **MODIFY** | Add TrendIndicator next to card name |
| `src/components/cards/CardTilt.tsx` | **MODIFY** | Add TrendIndicator overlay on card tiles |
| `src/lib/utils/mockAuroraData.ts` | **DELETE** | No more mock data |
| `src/lib/utils/mockHuntData.ts` | **DELETE** | No more mock data |
| `src/lib/utils/mockRadarData.ts` | **DELETE** | No more mock data |
| `src/lib/utils/mockPriceData.ts` | **DELETE** | No more mock data |

---

## 10. Verification

```
□ Rarity Aurora renders with real pop data on card detail page
□ Aurora rings show correct proportional segments per grader
□ Aurora center stat shows real total graded count
□ Aurora Black Label callout points to BL arc segment (or shows "BL: 0")
□ Aurora handles missing graders gracefully (dashed ring placeholder)
□ Card Radar renders with 5 calculated axes on card detail page
□ Radar scores are relative to all 15 cards (not absolute)
□ Radar tooltip shows axis name + score + raw value
□ Radar handles sparse data (shows empty polygon outline)
□ Portfolio Value chart renders on home page with real time series
□ Portfolio header shows current total with AnimatedCounter
□ Portfolio change line shows gain/loss since tracking began
□ Portfolio time range pills (1M/3M/6M/1Y/ALL) filter correctly
□ Portfolio handles single data point (shows flat line at current value)
□ Scarcity Spectrum renders below Market Movers on home page
□ Spectrum cards positioned by BL pop (rarest left, most common right)
□ Spectrum tier labels (MYTHIC/ULTRA/RARE/UNCOMMON) positioned correctly
□ Spectrum pop 0 cards highlighted in warning color
□ Spectrum card markers are clickable → navigate to /card/[slug]
□ Spectrum hover expands to show full name + thumbnail
□ Trend Indicators appear on home page card grid (bottom-right corner)
□ Trend Indicators appear on card detail CardIdentity panel
□ Trend arrows gold for up, red for down, gray for flat
□ Trend returns null (renders nothing) when no price data exists
□ grep -r "MOCK_" src/ returns zero results (excluding comments)
□ No mock data files remain in src/lib/utils/
□ All empty states render correctly when database tables are empty
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 11. What Comes Next

| PRD | Focus |
|-----|-------|
| **08** | Scroll Animations & Page Transitions — GSAP ScrollTrigger for Market Pulse entrance, Framer Motion page morphs, card grid stagger fix, micro-interactions |
| **09** | Performance & Mobile — Lazy loading Three.js, bundle splitting heavy deps, touch interactions, Lighthouse audit, mobile responsiveness pass |
| **10** | Deployment — Vercel production, cron activation, custom domain, OG images, error monitoring, initial data population |
