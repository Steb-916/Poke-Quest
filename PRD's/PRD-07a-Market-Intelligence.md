# PRD-07a: Market Intelligence Layer

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 07a (Market Analytics + Supply Signals)  
**Depends on:** PRD-05b complete, PriceSnapshot and GradedSale tables populated with real data (minimum 2 snapshots per card, spaced ≥7 days apart)

---

## 1. Overview

This PRD adds a market intelligence layer to the site — the analytical backbone that transforms raw price and sales data into actionable signals. It draws on secondary market methodology used by professional Pokémon TCG analysts: tracking **price momentum** (percentage moves over time), **supply scarcity** (listing availability thinning on the secondary market), and **sales velocity** (how frequently a card is transacting relative to its recent history). These three signals combine to tell a story that no other SWSH V/VMAX site is telling: this era is out of print, supply is finite, and the data proves it.

Three new components are introduced. Two live on the **home page** as a new section below the card grid. One lives on the **card detail page** inside the existing Recent Sales panel.

### 1.1 Why This Matters for SWSH V/VMAX

Modern sets like Ascended Heroes and Prismatic Evolutions have ongoing print runs — supply gets replenished with each wave. Sword & Shield V/VMAX alt arts have a **replacement rate of zero**. No more booster boxes are being printed. No more booster bundles are coming. Every card that gets graded, every slab that gets locked into a collection — that's permanent supply removal. The market signals on these cards behave fundamentally differently from in-print sets, and the site should surface that difference visually.

---

## 2. Home Page — New Section: Market Pulse

### 2.1 Placement

This section sits **below** the 5×3 card grid and **above** the page footer. It's separated from the card grid by `80px` of vertical space and a section divider.

### 2.2 Section Divider

A thin horizontal line with a centered label, matching the Hunt page title treatment:

```
                    ─────── MARKET PULSE ───────
```

`font-[var(--font-display)]`, 12px, uppercase, letter-spacing 0.3em, `var(--color-accent)` (default gold). The line extends to the edges of the `max-w-[1200px]` container, `var(--color-border-default)` at 30% opacity. The label sits centered on top of the line with `bg-[var(--color-bg-primary)]` padding to create the break.

### 2.3 Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                ─────── MARKET PULSE ───────                   │
│                                                               │
│  ┌───────────────────────────┐  ┌───────────────────────────┐│
│  │                           │  │                           ││
│  │      MARKET MOVERS        │  │     SUPPLY SIGNALS        ││
│  │                           │  │                           ││
│  │  ▲ Umbreon VMAX   +12.4% │  │  ● Umbreon     TIGHT     ││
│  │  ▲ Rayquaza VMAX   +8.1% │  │  ● Rayquaza    TIGHT     ││
│  │  ▲ Gengar VMAX     +6.3% │  │  ○ Espeon      STABLE    ││
│  │  ▼ Starmie V       -2.1% │  │  ○ Machamp     STABLE    ││
│  │  ▼ Beedrill V      -1.8% │  │  ◆ Celebi      SURPLUS   ││
│  │                           │  │                           ││
│  │  ── Based on 30-day ──    │  │  ── Based on listing ──   ││
│  │     price movement        │  │     availability          ││
│  │                           │  │                           ││
│  └───────────────────────────┘  └───────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Responsive

- **≥1024px:** Two panels side by side in a 2-column grid, `gap-8`
- **768–1023px:** Two panels side by side, tighter `gap-6`
- **<768px:** Single column, panels stacked vertically, `gap-6`

---

## 3. Component: Market Movers

### 3.1 File: `src/components/charts/MarketMovers.tsx`

This component replaces the existing mock Market Movers from PRD-06a. It ranks all 15 cards by their price change over a configurable time window and displays the top movers (biggest gainers and biggest losers).

### 3.2 Calculation Logic

The calculation lives in `src/lib/utils/calculations.ts` as a pure function:

```typescript
interface MarketMover {
  cardId: string;
  slug: string;
  name: string;
  pokemon: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;   // positive = gain, negative = loss
  changeAbsolute: number;  // dollar amount of change
  direction: 'up' | 'down' | 'flat';
  priceField: string;      // which price was compared (e.g., "psa10", "rawMarket")
}

/**
 * Calculate market movers from two sets of price snapshots.
 *
 * Strategy:
 * 1. For each card, find the most recent PriceSnapshot and the snapshot
 *    closest to `daysAgo` days in the past.
 * 2. Compare using a priority waterfall for price field selection:
 *    psa10 → rawMarket → rawMid → rawLow
 *    (Use the first non-null field that exists in BOTH snapshots)
 * 3. Calculate percentage change: ((current - previous) / previous) * 100
 * 4. Sort by absolute percentage change descending.
 * 5. Return top N gainers and top N losers.
 *
 * A card is "flat" if the change is less than ±0.5%.
 */
export function calculateMarketMovers(
  cards: Array<{ id: string; slug: string; name: string; pokemon: string }>,
  currentSnapshots: Map<string, PriceSnapshot>,
  previousSnapshots: Map<string, PriceSnapshot>,
  options: { topN?: number } = {}
): { gainers: MarketMover[]; losers: MarketMover[]; flat: MarketMover[] } {
  const { topN = 5 } = options;

  const PRICE_FIELDS = ['psa10', 'rawMarket', 'rawMid', 'rawLow'] as const;

  const movers: MarketMover[] = [];

  for (const card of cards) {
    const current = currentSnapshots.get(card.id);
    const previous = previousSnapshots.get(card.id);
    if (!current || !previous) continue;

    // Find the first price field that has non-null values in both snapshots
    let usedField: string | null = null;
    let currentPrice = 0;
    let previousPrice = 0;

    for (const field of PRICE_FIELDS) {
      const c = current[field];
      const p = previous[field];
      if (c != null && c > 0 && p != null && p > 0) {
        usedField = field;
        currentPrice = c;
        previousPrice = p;
        break;
      }
    }

    if (!usedField) continue;

    const changeAbsolute = currentPrice - previousPrice;
    const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

    movers.push({
      cardId: card.id,
      slug: card.slug,
      name: card.name,
      pokemon: card.pokemon,
      currentPrice,
      previousPrice,
      changePercent,
      changeAbsolute,
      direction: changePercent > 0.5 ? 'up' : changePercent < -0.5 ? 'down' : 'flat',
      priceField: usedField,
    });
  }

  // Sort by absolute change descending
  movers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const gainers = movers.filter((m) => m.direction === 'up').slice(0, topN);
  const losers = movers.filter((m) => m.direction === 'down').slice(0, topN);
  const flat = movers.filter((m) => m.direction === 'flat');

  return { gainers, losers, flat };
}
```

### 3.3 Database Queries

Add to `src/lib/db/queries.ts`:

```typescript
/**
 * Get the most recent PriceSnapshot for each card.
 * Returns a Map of cardId → PriceSnapshot.
 */
export async function getLatestPricesForAllCards(): Promise<Map<string, any>> {
  const cards = await prisma.card.findMany({ select: { id: true } });
  const map = new Map();

  for (const card of cards) {
    const snapshot = await prisma.priceSnapshot.findFirst({
      where: { cardId: card.id },
      orderBy: { date: 'desc' },
    });
    if (snapshot) map.set(card.id, snapshot);
  }

  return map;
}

/**
 * Get the PriceSnapshot closest to `daysAgo` for each card.
 * Looks for the snapshot with the nearest date to (now - daysAgo).
 * Falls back to the oldest available snapshot if none exists near that window.
 */
export async function getPricesAtDaysAgo(daysAgo: number): Promise<Map<string, any>> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  // Window: look within ±3 days of the target date
  const windowStart = new Date(targetDate);
  windowStart.setDate(windowStart.getDate() - 3);
  const windowEnd = new Date(targetDate);
  windowEnd.setDate(windowEnd.getDate() + 3);

  const cards = await prisma.card.findMany({ select: { id: true } });
  const map = new Map();

  for (const card of cards) {
    // Try to find a snapshot within the target window
    let snapshot = await prisma.priceSnapshot.findFirst({
      where: {
        cardId: card.id,
        date: { gte: windowStart, lte: windowEnd },
      },
      orderBy: { date: 'desc' },
    });

    // Fallback: oldest snapshot available (so we always have a comparison)
    if (!snapshot) {
      snapshot = await prisma.priceSnapshot.findFirst({
        where: { cardId: card.id },
        orderBy: { date: 'asc' },
      });
    }

    if (snapshot) map.set(card.id, snapshot);
  }

  return map;
}
```

### 3.4 Visual Design

The Market Movers panel is a contained card with a header and a ranked list.

**Panel container:**
- Background: `var(--color-bg-secondary)` at 50% opacity
- Border: 1px `var(--color-border-default)`
- Border-radius: 8px
- Padding: 24px

**Header:**
- Title: `MARKET MOVERS` in `font-[var(--font-display)]`, 11px, uppercase, letter-spacing 0.2em, `var(--color-text-secondary)`
- Subtitle: `30-Day Price Movement` in `font-[var(--font-mono)]`, 10px, `var(--color-text-tertiary)`
- Time range pill selector below the title (same pattern as Price History chart):

```
[7D]  [30D]  [90D]
```

- Default: 30D
- Active pill: `bg-[var(--color-accent)]/20`, `text-[var(--color-accent)]`, 1px `border-[var(--color-accent)]/40`
- Inactive pill: `text-[var(--color-text-tertiary)]`, hover brightens

**Mover rows:**

Each card gets a row. Show up to 5 gainers, then a subtle divider, then up to 5 losers. If fewer than 5 exist in a direction, show whatever is available. If all cards are flat, show a single centered message: `No significant movement in the last 30 days.`

```
┌──────────────────────────────────────────────┐
│  ▲  Umbreon VMAX           $2,800   +12.4%   │
│  ▲  Rayquaza VMAX          $1,920    +8.1%   │
│  ▲  Gengar VMAX              $485    +6.3%   │
│  ▲  Giratina V               $310    +4.7%   │
│  ▲  Dragonite V              $195    +3.2%   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  ▼  Starmie V                $105    -2.1%   │
│  ▼  Beedrill V                $88    -1.8%   │
└──────────────────────────────────────────────┘
```

**Row layout (each row):**
- Left: Direction arrow (▲ or ▼)
  - Gain arrow: `var(--color-accent)` (gold — fits the vault theme, these are appreciating collectibles)
  - Loss arrow: `#ef4444` (red, standard)
- Card name: `font-[var(--font-body)]`, `var(--color-text-primary)`, 14px
- Current price: `font-[var(--font-mono)]`, `var(--color-text-secondary)`, 13px, right-aligned
- Percentage: `font-[var(--font-mono)]`, 13px, color matches direction (gold for gain, red for loss)
  - Gains show `+X.X%`
  - Losses show `-X.X%`

**Row spacing:** 12px vertical gap between rows. No borders between rows — clean and airy. Row separator between gainers and losers: 1px dashed `var(--color-border-default)` at 40% opacity, 16px vertical margin.

**Row hover:** background shifts to `var(--color-bg-hover)` with 200ms transition. Entire row is a `<Link>` to `/card/[slug]`.

**Row entrance animation:** When the section scrolls into view, rows stagger in from left with 60ms delay per row. Use Framer Motion:

```typescript
<motion.div
  initial={{ opacity: 0, x: -12 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true, margin: '-40px' }}
  transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
>
```

### 3.5 Empty State

If there are fewer than 2 price snapshots in the database (not enough data to calculate movement):

```
Market data is building.
Price movement appears once we have 7+ days of price tracking.
```

Centered, `var(--color-text-tertiary)`, 13px. No placeholder data. The component renders at its minimum height (panel header + empty state message) so the layout doesn't collapse.

### 3.6 Price Field Label

Below the list, a small footnote showing which price field was used for comparison:

```
Compared using PSA 10 market prices where available, raw NM otherwise.
```

`font-[var(--font-mono)]`, 10px, `var(--color-text-tertiary)`, italic.

---

## 4. Component: Supply Signals

### 4.1 File: `src/components/charts/SupplySignals.tsx`

This component tracks the **availability** of cards on the secondary market by analyzing the frequency and density of recent sales. The core insight from professional market analysis: when sales cluster together and listings thin out on a card with no replacement supply, that's a leading indicator of a price increase. For out-of-print SWSH cards, this signal is especially meaningful because there are no incoming waves of new product to refill the market.

### 4.2 Calculation Logic

Add to `src/lib/utils/calculations.ts`:

```typescript
type SupplyStatus = 'tight' | 'stable' | 'surplus';

interface SupplySignal {
  cardId: string;
  slug: string;
  name: string;
  pokemon: string;
  status: SupplyStatus;
  recentSalesCount: number;     // Sales in the last 14 days
  previousSalesCount: number;   // Sales in the 14 days before that
  velocityChange: number;       // Percentage change in sales frequency
  avgDaysBetweenSales: number;  // Average gap between recent sales
  lastSaleDate: Date | null;    // When was the last sale recorded
  daysSinceLastSale: number;    // How many days since last sale
}

/**
 * Determine supply status for each card based on GradedSale records.
 *
 * Methodology:
 * 1. Count sales in the CURRENT 14-day window vs. the PREVIOUS 14-day window.
 * 2. Calculate velocity change: ((current - previous) / max(previous, 1)) * 100
 * 3. Calculate average days between sales in the current window.
 * 4. Classify:
 *    - TIGHT: velocity is up (more sales happening) AND avg gap is shrinking,
 *      OR it has been 14+ days since the last sale (nothing available to buy)
 *    - SURPLUS: velocity is down significantly (>30% fewer sales) AND avg gap is growing
 *    - STABLE: everything else
 *
 * The "tight" signal means: cards are selling faster than they're being listed,
 * or there simply aren't any listings. For out-of-print cards, both are bullish.
 */
export function calculateSupplySignals(
  cards: Array<{ id: string; slug: string; name: string; pokemon: string }>,
  salesByCard: Map<string, GradedSale[]>,
  now: Date = new Date()
): SupplySignal[] {
  const WINDOW_DAYS = 14;

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - WINDOW_DAYS);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - WINDOW_DAYS);

  const signals: SupplySignal[] = [];

  for (const card of cards) {
    const sales = salesByCard.get(card.id) || [];

    // Split sales into current and previous windows
    const currentWindowSales = sales.filter(
      (s) => s.date >= currentStart && s.date <= now
    );
    const previousWindowSales = sales.filter(
      (s) => s.date >= previousStart && s.date < currentStart
    );

    const recentCount = currentWindowSales.length;
    const prevCount = previousWindowSales.length;
    const velocityChange = ((recentCount - prevCount) / Math.max(prevCount, 1)) * 100;

    // Average days between sales in current window
    let avgGap = 0;
    if (currentWindowSales.length >= 2) {
      const sorted = [...currentWindowSales].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      let totalGap = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalGap += (sorted[i].date.getTime() - sorted[i - 1].date.getTime())
          / (1000 * 60 * 60 * 24);
      }
      avgGap = totalGap / (sorted.length - 1);
    } else if (currentWindowSales.length === 1) {
      avgGap = WINDOW_DAYS; // Only one sale in the window
    } else {
      avgGap = WINDOW_DAYS * 2; // No sales — effectively infinite gap
    }

    // Last sale
    const allSorted = [...sales].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    const lastSaleDate = allSorted.length > 0 ? allSorted[0].date : null;
    const daysSinceLastSale = lastSaleDate
      ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Classify
    let status: SupplyStatus;
    if (daysSinceLastSale >= 14) {
      status = 'tight'; // Nothing has sold — implies nothing available
    } else if (velocityChange > 20 && avgGap < 5) {
      status = 'tight'; // Selling faster, gaps shrinking
    } else if (velocityChange < -30 && avgGap > 7) {
      status = 'surplus'; // Selling slower, gaps growing
    } else {
      status = 'stable';
    }

    signals.push({
      cardId: card.id,
      slug: card.slug,
      name: card.name,
      pokemon: card.pokemon,
      status,
      recentSalesCount: recentCount,
      previousSalesCount: prevCount,
      velocityChange,
      avgDaysBetweenSales: Math.round(avgGap * 10) / 10,
      lastSaleDate,
      daysSinceLastSale,
    });
  }

  // Sort: tight first, then stable, then surplus
  const ORDER: Record<SupplyStatus, number> = { tight: 0, stable: 1, surplus: 2 };
  signals.sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return signals;
}
```

### 4.3 Database Query

Add to `src/lib/db/queries.ts`:

```typescript
/**
 * Get all GradedSale records from the last 30 days, grouped by cardId.
 * The 30-day window covers both the "current" and "previous" 14-day windows
 * used by the supply signal calculation.
 */
export async function getRecentSalesForAllCards(
  days: number = 30
): Promise<Map<string, any[]>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.gradedSale.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
  });

  const map = new Map<string, any[]>();
  for (const sale of sales) {
    if (!map.has(sale.cardId)) map.set(sale.cardId, []);
    map.get(sale.cardId)!.push(sale);
  }

  return map;
}
```

### 4.4 Visual Design

The Supply Signals panel sits beside Market Movers in the 2-column layout.

**Panel container:** Same styling as Market Movers (matching panels).

**Header:**
- Title: `SUPPLY SIGNALS` in `font-[var(--font-display)]`, 11px, uppercase, letter-spacing 0.2em, `var(--color-text-secondary)`
- Subtitle: `Secondary Market Availability` in `font-[var(--font-mono)]`, 10px, `var(--color-text-tertiary)`

**Signal rows:**

Each card gets a row showing its supply status. All 15 cards are shown, sorted by status (tight → stable → surplus).

```
┌──────────────────────────────────────────────────────────┐
│  ●  Umbreon VMAX        3 sales / 14d        TIGHT      │
│  ●  Rayquaza VMAX       2 sales / 14d        TIGHT      │
│  ●  Giratina V          0 sales / 14d        TIGHT      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ○  Espeon V            4 sales / 14d        STABLE     │
│  ○  Machamp V           3 sales / 14d        STABLE     │
│  ○  Dragonite V         5 sales / 14d        STABLE     │
│  ○  Tyranitar V         2 sales / 14d        STABLE     │
│  ○  Deoxys VMAX         3 sales / 14d        STABLE     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ◇  Celebi V            8 sales / 14d        SURPLUS    │
│  ◇  Starmie V           6 sales / 14d        SURPLUS    │
└──────────────────────────────────────────────────────────┘
```

**Row layout:**
- Left: Status indicator dot
  - `tight`: filled circle, `#f59e0b` (amber — warning, supply is thinning)
  - `stable`: hollow circle, `var(--color-text-tertiary)` (neutral)
  - `surplus`: hollow diamond, `#22c55e` (green — plenty available)
- Card name: `font-[var(--font-body)]`, `var(--color-text-primary)`, 14px
- Sales count: `font-[var(--font-mono)]`, `var(--color-text-tertiary)`, 12px — format: `X sales / 14d`
- Status badge: right-aligned pill
  - `TIGHT`: `bg-[#f59e0b]/15`, `text-[#f59e0b]`, `border-[#f59e0b]/30`
  - `STABLE`: `bg-[var(--color-bg-hover)]`, `var(--color-text-tertiary)`, `border-[var(--color-border-default)]`
  - `SURPLUS`: `bg-[#22c55e]/15`, `text-[#22c55e]`, `border-[#22c55e]/30`
  - All badges: `font-[var(--font-mono)]`, 10px, uppercase, letter-spacing 0.1em, border-radius 4px, padding 2px 8px

**Row spacing:** 10px vertical gap. Rows are denser than Market Movers because all 15 cards are shown. The panel scrolls internally if it exceeds the Market Movers panel height — set `max-h-[480px] overflow-y-auto` with a custom scrollbar matching `var(--color-bg-hover)`.

**Section dividers:** Same dashed treatment as Market Movers between status groups. Only render the divider if both groups have entries (don't show a divider above an empty group).

**Row hover:** Same as Market Movers — `var(--color-bg-hover)` with 200ms transition. Entire row is a `<Link>` to `/card/[slug]`.

**Row entrance animation:** Same stagger pattern as Market Movers but from the right side:

```typescript
<motion.div
  initial={{ opacity: 0, x: 12 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true, margin: '-40px' }}
  transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
>
```

### 4.5 Empty State

If no GradedSale records exist:

```
Sales tracking is building.
Supply signals appear once we have recorded sales data.
```

Same treatment as Market Movers empty state.

### 4.6 Tooltip on Row Hover

When hovering a supply signal row for 400ms, show a small tooltip below the row with contextual detail:

```
┌─────────────────────────────────────┐
│  Last 14 days: 3 sales              │
│  Previous 14 days: 1 sale           │
│  Velocity: +200%                    │
│  Last sale: 2 days ago              │
└─────────────────────────────────────┘
```

Background: `var(--color-bg-tertiary)`, border: `var(--color-border-hover)`, `font-[var(--font-mono)]`, 11px. Use Framer Motion for fade-in (200ms, opacity 0→1, y shift 4px→0).

---

## 5. Component: Velocity Indicator (Card Detail Page)

### 5.1 File: `src/components/charts/VelocityIndicator.tsx`

This is a small inline component that gets added to the **existing Recent Sales panel** on the card detail page (`/card/[slug]`). It sits directly above the sales table, below the grader/grade filter pills, as a compact summary bar.

### 5.2 Placement in Existing Layout

```
┌─────────────────────────────────────────────────┐
│  [Price History]  [Pop Reports]  [Recent Sales]  │  ← existing tab bar
├─────────────────────────────────────────────────┤
│                                                   │
│  Grader: [All] [PSA] [BGS] [CGC] [SGC]          │  ← existing filter
│  Grade:  [All] [10+] [9-9.5] [<9]               │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ ▲ 5 sales last 14d  vs  2 sales prior 14d  │ │  ← NEW: VelocityIndicator
│  │   Velocity: +150%   Avg gap: 2.8 days       │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  | Date | Platform | Grader | Grade | Price | ↗ | │  ← existing table
│  | ...  | ...      | ...    | ...   | ...   |   | │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 5.3 Calculation

Reuses the same logic from `calculateSupplySignals` but for a single card. Extract the per-card calculation into a shared helper:

```typescript
/**
 * Calculate velocity for a single card's sales.
 * Used by both the home page SupplySignals (all cards) and
 * the card detail VelocityIndicator (single card).
 */
export function calculateSingleCardVelocity(
  sales: GradedSale[],
  now: Date = new Date()
): {
  recentCount: number;
  previousCount: number;
  velocityPercent: number;
  avgGapDays: number;
  daysSinceLastSale: number;
  status: SupplyStatus;
} {
  // Same windowing logic as calculateSupplySignals
  // but for a single card's sales array
  // ... (extract from Section 4.2 into this shared function)
}
```

Then `calculateSupplySignals` calls this internally per card, and `VelocityIndicator` calls it directly.

### 5.4 Visual Design

A compact horizontal bar, full-width within the data panel.

**Container:**
- Background: `var(--color-bg-tertiary)` at 60% opacity
- Border-radius: 6px
- Padding: 12px 16px
- Margin: 0 0 16px 0 (space before the sales table)

**Layout — single horizontal line with flex:**

```
[▲ direction arrow]  [sales count summary]  [velocity percentage]  [avg gap]
```

- **Direction arrow:** Same as Market Movers (▲ gold for up, ▼ red for down, – gray for flat). Size: 14px.
- **Sales count:** `5 sales / 14d vs 2 prior` — `font-[var(--font-mono)]`, 12px, `var(--color-text-secondary)`
- **Velocity:** `+150%` — `font-[var(--font-mono)]`, 12px, bold, color matches direction
- **Avg gap:** `Avg gap: 2.8d` — `font-[var(--font-mono)]`, 11px, `var(--color-text-tertiary)`

If velocity is flat (less than ±10%), collapse the display to:

```
[–]  3 sales / 14d  ·  Stable  ·  Avg gap: 4.2d
```

### 5.5 Empty State

If no sales exist for this card:

```
No recorded sales to calculate velocity.
```

Same inline bar, but with tertiary text and no arrow or stats. The bar still renders (doesn't collapse) so the layout is consistent.

---

## 6. Home Page Integration

### 6.1 File: `src/app/page.tsx`

Add the Market Pulse section after the card grid. The data fetching happens in the server component (page.tsx) and gets passed as props.

```typescript
// Add to the existing server-side data fetching in page.tsx:

import { getLatestPricesForAllCards, getPricesAtDaysAgo, getRecentSalesForAllCards } from '@/lib/db/queries';
import { calculateMarketMovers } from '@/lib/utils/calculations';
import { calculateSupplySignals } from '@/lib/utils/calculations';

export default async function HomePage() {
  // ... existing card grid data fetching ...

  // Market Pulse data
  const [currentPrices, previousPrices, recentSales] = await Promise.all([
    getLatestPricesForAllCards(),
    getPricesAtDaysAgo(30),
    getRecentSalesForAllCards(30),
  ]);

  const cards = await getAllCards();
  const cardMeta = cards.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    pokemon: c.pokemon,
  }));

  const marketMovers = calculateMarketMovers(cardMeta, currentPrices, previousPrices);
  const supplySignals = calculateSupplySignals(cardMeta, recentSales);

  return (
    <main>
      {/* ... existing vault overlay, portfolio header, card grid ... */}

      {/* Market Pulse Section */}
      <section className="mx-auto max-w-[1200px] px-8 pt-20 pb-16">
        <MarketPulseDivider />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
          <MarketMovers data={marketMovers} />
          <SupplySignals data={supplySignals} />
        </div>
      </section>
    </main>
  );
}
```

### 6.2 Component: `src/components/ui/MarketPulseDivider.tsx`

The section divider described in Section 2.2:

```typescript
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
```

---

## 7. Card Detail Page Integration

### 7.1 File: `src/app/card/[slug]/page.tsx`

Add sales velocity data fetching for the specific card and pass to the existing `DataPanels` component.

```typescript
// Add to existing data fetching:
import { getRecentSales } from '@/lib/db/queries';
import { calculateSingleCardVelocity } from '@/lib/utils/calculations';

// Inside the page component:
const sales = await getRecentSales(card.id, 50); // Get more sales for velocity calc
const velocity = calculateSingleCardVelocity(sales);

// Pass to DataPanels:
<DataPanels card={card} velocity={velocity} />
```

### 7.2 File: `src/components/cards/DataPanels.tsx`

Update to accept and forward `velocity` prop to the Recent Sales panel.

### 7.3 File: `src/components/charts/RecentSales.tsx`

Import and render `VelocityIndicator` above the sales table, below the filter pills.

```typescript
import { VelocityIndicator } from './VelocityIndicator';

// Inside the component, after filters, before table:
<VelocityIndicator velocity={velocity} />
```

---

## 8. Contextual Narrative: Out-of-Print Badge

### 8.1 Overview

One non-data element inspired by the market analysis methodology: a permanent contextual badge on the home page that frames the entire collection's market position. This is the "last era of booster box print runs" narrative — a single, subtle piece of context that tells visitors why this collection is structurally different.

### 8.2 Component: `src/components/ui/EraContext.tsx`

A small, unobtrusive callout that sits between the Portfolio Header and the card grid on the home page.

```typescript
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
          Sword & Shield era · No new supply · All prices reflect secondary market only
        </span>
      </div>
    </div>
  );
}
```

This renders as a single horizontal line — a gold "Out of Print" pill followed by a quiet explanation. It's not a banner, not a hero element — just a factual label that reframes everything below it.

---

## 9. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/charts/MarketMovers.tsx` | **REWRITE** | Real market movers with DB data, time range selector |
| `src/components/charts/SupplySignals.tsx` | **CREATE** | Supply scarcity signals from sales data |
| `src/components/charts/VelocityIndicator.tsx` | **CREATE** | Inline velocity bar for card detail sales panel |
| `src/components/ui/MarketPulseDivider.tsx` | **CREATE** | Centered divider with "Market Pulse" label |
| `src/components/ui/EraContext.tsx` | **CREATE** | Out-of-print contextual badge |
| `src/lib/utils/calculations.ts` | **MODIFY** | Add `calculateMarketMovers`, `calculateSupplySignals`, `calculateSingleCardVelocity` |
| `src/lib/db/queries.ts` | **MODIFY** | Add `getLatestPricesForAllCards`, `getPricesAtDaysAgo`, `getRecentSalesForAllCards` |
| `src/app/page.tsx` | **MODIFY** | Add Market Pulse section below card grid, fetch data server-side |
| `src/app/card/[slug]/page.tsx` | **MODIFY** | Fetch sales velocity, pass to DataPanels |
| `src/components/cards/DataPanels.tsx` | **MODIFY** | Accept and forward `velocity` prop |
| `src/components/charts/RecentSales.tsx` | **MODIFY** | Render VelocityIndicator above table |

---

## 10. Verification

```
□ Home page: Market Pulse section visible below card grid
□ Market Pulse divider renders with gold "Market Pulse" label centered on line
□ Market Movers panel renders with real data (or empty state if <2 snapshots)
□ Market Movers: time range pills (7D/30D/90D) switch and recalculate
□ Market Movers: gainers show gold ▲ with positive percentages
□ Market Movers: losers show red ▼ with negative percentages
□ Market Movers: dashed divider between gainers and losers sections
□ Market Movers: rows link to /card/[slug] on click
□ Market Movers: row stagger animation on scroll into view
□ Market Movers: footnote shows which price field was used
□ Supply Signals panel renders with real data (or empty state if no sales)
□ Supply Signals: cards sorted by status (tight → stable → surplus)
□ Supply Signals: TIGHT rows show amber dot and amber pill
□ Supply Signals: STABLE rows show gray hollow circle and gray pill
□ Supply Signals: SURPLUS rows show green diamond and green pill
□ Supply Signals: dashed dividers between status groups
□ Supply Signals: tooltip appears on 400ms hover with velocity details
□ Supply Signals: rows link to /card/[slug] on click
□ Supply Signals: row stagger animation on scroll into view
□ Supply Signals: panel scrolls internally if taller than Market Movers
□ Card detail page: VelocityIndicator renders above sales table
□ VelocityIndicator: shows direction arrow, sales counts, velocity %, avg gap
□ VelocityIndicator: flat state shows "Stable" with dash icon
□ VelocityIndicator: empty state shows "No recorded sales" message
□ EraContext badge renders between Portfolio Header and card grid
□ EraContext: gold "Out of Print" pill with dot indicator
□ Responsive: Market Pulse panels stack on mobile (<768px)
□ Responsive: VelocityIndicator wraps gracefully on narrow screens
□ All new components handle empty database gracefully (no crashes)
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 11. What Comes Next

| PRD | Focus |
|-----|-------|
| **07b** | Wire remaining PRD-06a visualizations to real DB data (Rarity Aurora, Radar Chart, Portfolio Chart, Scarcity Spectrum) — remove ALL mock data |
| **08** | Scroll Animations & Page Transitions — GSAP ScrollTrigger, Framer Motion page morphs, Market Pulse entrance choreography |
| **09** | Performance & Mobile — Lazy loading, bundle splitting, touch interactions, Lighthouse audit |
| **10** | Deployment — Vercel production, cron activation, domain setup, initial data population |
