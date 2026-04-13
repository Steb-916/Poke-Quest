# PRD-03b: Card Detail Data Panels

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 03b of 2 (Data Panel Layouts)  
**Depends on:** PRD-03a complete

---

## 1. Overview

This PRD defines the data visualization panels that sit below the hero section (slab viewer + card identity) on the card detail page. These panels display price history, population reports, and recent graded sales. All panels render with **placeholder/mock data** — real API integration happens in PRD-05. The goal here is to build the complete UI shell so that swapping in real data later requires only changing the data source, not the components.

---

## 2. Data Panel Navigation

### 2.1 Tab Bar

The data section uses a horizontal tab bar to switch between views:

```
[Price History]  [Pop Reports]  [Recent Sales]
```

- Active tab: bottom border in `var(--color-accent)`, text in primary color
- Inactive tab: no border, text in secondary color, hover brightens
- The tab bar is full-width within the max-w container
- Subtle bottom border across the entire tab bar in `var(--color-border-default)`
- Active indicator slides smoothly between tabs using Framer Motion `layoutId`

### 2.2 Panel Container

Below the tab bar, the active panel renders. Use `AnimatePresence` with fade transitions (no height animation — all panels are full-width, just cross-fade on switch).

```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    {activeTab === 'price' && <PriceHistoryPanel card={card} />}
    {activeTab === 'pop' && <PopReportPanel card={card} />}
    {activeTab === 'sales' && <RecentSalesPanel card={card} />}
  </motion.div>
</AnimatePresence>
```

### 2.3 Component: `src/components/cards/DataPanels.tsx`

This is the parent component that manages the tab state and renders the active panel. It receives the card as a prop.

---

## 3. Price History Panel

### 3.1 Component: `src/components/charts/PriceHistory.tsx`

A line chart showing price over time. Multiple lines can be toggled on/off:

**Lines available:**
- Raw NM (default on)
- PSA 10 (default on)
- BGS 10 Pristine (default off)
- BGS Black Label (default on — this is the key metric)
- CGC 10 (default off)

### 3.2 Chart Implementation

Use **Recharts** for this — it's the simplest path to a clean, interactive line chart in React.

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
```

**Chart styling:**
- Background: transparent (inherits page background)
- Grid lines: `var(--color-border-default)` at very low opacity (0.3)
- Axis labels: `var(--color-text-tertiary)`, `font-[var(--font-mono)]`, 11px
- Lines: each data series gets its own color
  - Raw: `var(--color-text-secondary)` (neutral gray)
  - PSA 10: `var(--color-psa)` (red)
  - BGS Pristine: `var(--color-bgs-gold)` (gold)
  - Black Label: `#ffffff` (white — stands out as the premium line)
  - CGC 10: `var(--color-cgc)` (blue)
- Line width: 2px, with `type="monotone"` for smooth curves
- Active dot on hover: 6px circle in line color with white border
- Tooltip: dark background (`var(--color-bg-tertiary)`), accent border, monospace prices

### 3.3 Time Range Selector

Above the chart, a row of buttons to select the time window:

```
[1M]  [3M]  [6M]  [1Y]  [ALL]
```

- Small pill buttons, similar styling to grader tabs but smaller
- Default: 1Y (one year)
- Active state matches tab pattern (accent background, accent text)

### 3.4 Line Toggle

Below the chart or beside the time range, small toggle chips for each data series:

```
● Raw NM  ● PSA 10  ○ BGS 10  ● Black Label  ○ CGC 10
```

- Filled dot = visible, outline dot = hidden
- Dot color matches the line color
- Click to toggle visibility
- At least one line must always be visible (prevent empty chart)

### 3.5 Mock Data

Generate 12 months of mock price data for each series. Prices should be semi-realistic:

```typescript
const MOCK_PRICE_DATA = [
  { date: '2025-04', raw: 980, psa10: 2400, bgsBlack: 28000 },
  { date: '2025-05', raw: 1020, psa10: 2500, bgsBlack: 29500 },
  { date: '2025-06', raw: 1050, psa10: 2650, bgsBlack: 31000 },
  // ... 12 months of data points
  { date: '2026-03', raw: 1055, psa10: 2800, bgsBlack: 33600 },
];
```

The specific numbers don't need to be accurate — they just need to be plausible so the chart looks realistic during development.

### 3.6 Empty State

If a data series has no data (will happen for some cards' Black Label prices), show a dashed line or "No data" label instead of hiding the series entirely. This communicates "we track this, there's just no sales data yet."

---

## 4. Pop Report Panel

### 4.1 Component: `src/components/charts/PopReport.tsx`

Displays grading population data across all companies. Two sub-sections:

**Section A: Grade Distribution (per grader)**

A horizontal stacked bar for each grading company showing how many cards exist at each grade level:

```
PSA    ████████████████████░░░░░  Total: 28,118
       10: 19,858 | 9: 5,699 | 8: 1,358 | ≤7: 1,203

BGS    ███████░░░░░░░░░░░░░░░░░  Total: 2,450
       BL: 138 | 10: 312 | 9.5: 890 | 9: 650 | ≤8.5: 460

CGC    ██████████░░░░░░░░░░░░░░  Total: 4,200
       10P: 45 | 10: 520 | 9.5: 1,800 | 9: 1,100 | ≤8.5: 735

SGC    ██░░░░░░░░░░░░░░░░░░░░░  Total: 380
       10: 210 | 9.5: 95 | 9: 50 | ≤8.5: 25
```

Implementation: custom horizontal bars using plain divs with percentage widths. Not a charting library — these are simpler as styled HTML. Each segment is colored:
- Grade 10 / Black Label: `var(--color-accent)` (card's accent)
- Grade 9.5: accent at 70% opacity
- Grade 9: accent at 40% opacity
- Grade 8.5 and below: `var(--color-text-tertiary)` at 30% opacity

Hover on a segment shows a tooltip with the exact count and percentage.

**Section B: Black Label Spotlight**

A dedicated callout box that highlights the Black Label population specifically:

```
┌──────────────────────────────────────┐
│  ■ BGS BLACK LABEL                   │
│                                       │
│  Population: 138                      │
│  % of all BGS graded: 5.6%           │
│  Trend: +12 in last 6 months         │
│                                       │
│  [mini sparkline of pop over time]    │
└──────────────────────────────────────┘
```

This box has a special border treatment: `border-[var(--color-bgs-gold)]` with a subtle glow. The population number is rendered large in `font-[var(--font-display)]`. If pop is under 10, add a "Ultra Rare" badge. If pop is 0, show "None Exist" with special emphasis.

### 4.2 Mock Data

```typescript
const MOCK_POP_DATA = {
  PSA: { total: 28118, grade10: 19858, grade9: 5699, grade8: 1358, below: 1203 },
  BGS: { total: 2450, blackLabel: 138, grade10: 312, grade95: 890, grade9: 650, below: 460 },
  CGC: { total: 4200, perfect10: 45, grade10: 520, grade95: 1800, grade9: 1100, below: 735 },
  SGC: { total: 380, grade10: 210, grade95: 95, grade9: 50, below: 25 },
};
```

Use Umbreon's approximate real numbers so the visual proportions look right. Other cards will have different mock data generated at different scales.

---

## 5. Recent Sales Panel

### 5.1 Component: `src/components/charts/RecentSales.tsx`

A table of recent graded sales for this card, sourced from eBay and other platforms.

### 5.2 Table Structure

| Date | Platform | Grader | Grade | Price | Link |
|------|----------|--------|-------|-------|------|
| Mar 15, 2026 | eBay | PSA | 10 | $2,850 | ↗ |
| Mar 12, 2026 | eBay | BGS | 9.5 | $1,920 | ↗ |
| Mar 8, 2026 | Fanatics | BGS | Black Label | $33,600 | ↗ |
| Feb 28, 2026 | eBay | CGC | 10 | $2,100 | ↗ |
| Feb 22, 2026 | eBay | RAW | NM | $1,055 | ↗ |

### 5.3 Table Styling

- No outer border — clean, borderless design
- Row separator: 1px `var(--color-border-default)` between rows
- Header row: uppercase, tiny font (11px), tertiary color, letter-spacing 0.1em
- Data rows: monospace for price and date, body font for platform and grader
- Grader column: show a small colored dot before the grader name (matching grader brand color)
- Grade column: "Black Label" gets bold + gold color treatment
- Price column: right-aligned, primary color for the number, "$" in tertiary
- Link column: small external link icon (↗), opens in new tab, accent color on hover
- Alternating row backgrounds: transparent and `var(--color-bg-secondary)` at 30% opacity
- Hover on row: background `var(--color-bg-hover)`

### 5.4 Filters

Above the table, small filter dropdowns or pills:

```
Grader: [All] [PSA] [BGS] [CGC] [SGC]     Grade: [All] [10+] [9-9.5] [<9]
```

These filter the table rows. Default is All/All.

### 5.5 Empty State

If no sales data exists for a card (common for ultra-rare Black Labels):

```
No recorded sales for this card.
Sales data will appear here as transactions are tracked.
```

Centered, secondary text, subtle.

### 5.6 Mock Data

Generate 8–10 mock sales entries per card with varying graders, grades, and platforms. Prices should be roughly proportional to grade (PSA 10 > BGS 9.5 > Raw, etc.).

---

## 6. Card Detail Page Component (`src/app/card/[slug]/page.tsx`)

### 6.1 Full Page Assembly

```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CARDS } from '@/lib/utils/cardData';
import { SlabViewer } from '@/components/cards/SlabViewer';
import { CardIdentity } from '@/components/cards/CardIdentity';
import { DataPanels } from '@/components/cards/DataPanels';

interface CardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const card = CARDS.find((c) => c.slug === slug);

  if (!card) return notFound();

  return (
    <div
      className="pt-16 min-h-screen"
      style={{
        '--color-accent': `var(--card-${card.pokemon.toLowerCase().replace('galarian ', '')})`,
        '--color-accent-dim': `var(--card-${card.pokemon.toLowerCase().replace('galarian ', '')})33`,
        '--color-accent-glow': `var(--card-${card.pokemon.toLowerCase().replace('galarian ', '')})55`,
      } as React.CSSProperties}
    >
      {/* Back Link */}
      <div className="mx-auto max-w-[1200px] px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <span>←</span>
          <span className="tracking-wide">Back to Vault</span>
        </Link>
      </div>

      {/* Hero: Slab Viewer + Card Identity */}
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <SlabViewer card={card} />
          <CardIdentity card={card} />
        </div>
      </div>

      {/* Data Panels */}
      <div className="mx-auto max-w-[1200px] px-8 pb-16">
        <DataPanels card={card} />
      </div>
    </div>
  );
}
```

Note: This page is a server component that passes the card data down. The `SlabViewer`, `CardIdentity`, and `DataPanels` are client components (they manage interactive state).

### 6.2 Pokemon Name → CSS Variable Mapping

The `card.pokemon.toLowerCase()` mapping needs to handle "Galarian Slowking" → `slowking`. The `.replace('galarian ', '')` handles this. All other pokemon names are single words and map directly.

Full mapping verification:
- Umbreon → `--card-umbreon` ✓
- Rayquaza → `--card-rayquaza` ✓
- Deoxys → `--card-deoxys` ✓
- Gengar → `--card-gengar` ✓
- Giratina → `--card-giratina` ✓
- Aerodactyl → `--card-aerodactyl` ✓
- Dragonite → `--card-dragonite` ✓
- Espeon → `--card-espeon` ✓
- Machamp → `--card-machamp` ✓
- Tyranitar → `--card-tyranitar` ✓
- Charizard → `--card-charizard` ✓
- Starmie → `--card-starmie` ✓
- Celebi → `--card-celebi` ✓
- Galarian Slowking → `slowking` (via replace) → `--card-slowking` ✓
- Beedrill → `--card-beedrill` ✓

---

## 7. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/card/[slug]/page.tsx` | **REWRITE** | Full page assembly with accent colors |
| `src/components/cards/DataPanels.tsx` | **CREATE** | Tab bar + panel switcher |
| `src/components/charts/PriceHistory.tsx` | **CREATE** | Recharts line chart with toggles |
| `src/components/charts/PopReport.tsx` | **CREATE** | Grade distribution bars + BL spotlight |
| `src/components/charts/RecentSales.tsx` | **CREATE** | Sales table with filters |

---

## 8. Verification

```
□ All checks from PRD-03a pass
□ Data panel tabs work (Price History, Pop Reports, Recent Sales)
□ Tab switch animates (fade + slide)
□ Active tab has accent underline that slides with layoutId
□ Price History chart renders with mock data and multiple lines
□ Time range buttons (1M/3M/6M/1Y/ALL) filter chart data
□ Line toggle chips show/hide individual data series
□ Pop Report shows horizontal bars for each grading company
□ Black Label spotlight box renders with special styling
□ Recent Sales table renders with mock data rows
□ Grader/Grade filters work on the sales table
□ "Black Label" rows in sales table have gold highlight
□ External link icons in sales table work
□ All panels display correctly at mobile breakpoint
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 9. What Comes Next

| PRD | Focus |
|-----|-------|
| **04** | The Hunt page — Black Label quest tracker with progress visualization and ownership management |
| **05** | Data Pipeline — API integration, cron jobs, database seeding, replacing all mock data |
| **06** | Advanced Visualizations — Rarity aurora, portfolio constellation, price prediction |
| **07** | Scroll Animations & Micro-interactions — GSAP ScrollTrigger, page transitions, polish |
| **08** | Performance & Mobile — Lazy loading, bundle splitting, lighthouse audit, touch interactions |
| **09** | Deployment — Vercel production config, Neon setup, cron scheduling, data seeding |
