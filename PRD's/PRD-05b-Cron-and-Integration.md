# PRD-05b: Cron Jobs, Data Refresh & Replacing Mock Data

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 05b of 2 (Automation + Page Integration)  
**Depends on:** PRD-05a complete, database seeded, API keys configured

---

## 1. Overview

This PRD wires the data pipeline into automated cron jobs and replaces all mock/placeholder data across every page with real database queries. After this PRD, the site shows live data everywhere — prices, pop reports, sales, portfolio values, and hunt progress.

---

## 2. Cron Job: Price Fetching

### 2.1 File: `src/app/api/cron/prices/route.ts`

Runs daily. Fetches current prices for all 15 cards from pokemontcg.io (raw prices) and PokemonPriceTracker (graded prices), then writes PriceSnapshot records.

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { fetchCardData } from '@/lib/api/pokemontcg';
import { fetchGradedPrices } from '@/lib/api/pricetracker';
import { CARDS } from '@/lib/utils/cardData';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];

  for (const cardMeta of CARDS) {
    try {
      // 1. Fetch raw prices from pokemontcg.io
      const tcgData = await fetchCardData(cardMeta.setCode, cardMeta.cardNumber);

      // 2. Fetch graded prices from PokemonPriceTracker
      const gradedData = cardMeta.tcgplayerId
        ? await fetchGradedPrices(cardMeta.tcgplayerId)
        : null;

      // 3. Look up card in database
      const card = await prisma.card.findUnique({
        where: { slug: cardMeta.slug },
      });

      if (!card) continue;

      // 4. Write price snapshot
      const snapshot = await prisma.priceSnapshot.create({
        data: {
          cardId: card.id,
          source: 'combined',
          rawLow: tcgData?.tcgplayer?.prices?.holofoil?.low ?? null,
          rawMid: tcgData?.tcgplayer?.prices?.holofoil?.mid ?? null,
          rawHigh: tcgData?.tcgplayer?.prices?.holofoil?.high ?? null,
          rawMarket: tcgData?.tcgplayer?.prices?.holofoil?.market ?? null,
          psa10: gradedData?.gradedPrices?.psa10 ?? null,
          psa9: gradedData?.gradedPrices?.psa9 ?? null,
          // Map additional graded fields as available
        },
      });

      results.push({ card: cardMeta.slug, status: 'ok', snapshotId: snapshot.id });

      // Rate limit: 200ms between cards
      await new Promise((r) => setTimeout(r, 200));
    } catch (error) {
      results.push({ card: cardMeta.slug, status: 'error', error: String(error) });
    }
  }

  return NextResponse.json({ fetched: results.length, results });
}
```

### 2.2 Vercel Cron Configuration

Create `vercel.json` in the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/prices",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/pop",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

- Prices: daily at 6:00 AM UTC
- Pop reports: weekly on Monday at 7:00 AM UTC

Both routes receive an automatic `authorization` header from Vercel matching the `CRON_SECRET` environment variable.

---

## 3. Cron Job: PSA Pop Report

### 3.1 File: `src/app/api/cron/pop/route.ts`

Runs weekly. Fetches PSA pop data for all 15 cards. BGS, CGC, and SGC data are entered manually via the `/api/pop` route (PRD-05a).

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { fetchPsaPop } from '@/lib/api/psapop';
import { CARDS } from '@/lib/utils/cardData';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];

  for (const cardMeta of CARDS) {
    try {
      const card = await prisma.card.findUnique({
        where: { slug: cardMeta.slug },
      });

      if (!card) continue;

      const psaData = await fetchPsaPop(cardMeta.setCode, cardMeta.cardNumber);

      if (psaData) {
        await prisma.popSnapshot.create({
          data: {
            cardId: card.id,
            grader: 'PSA',
            total: psaData.total,
            grade10: psaData.gem10,
            grade95: 0, // PSA doesn't have 9.5
            grade9: psaData.mint9,
            grade85: 0,
            grade8: psaData.nmMint8,
            grade7AndBelow: psaData.below8,
            authentic: psaData.authentic,
          },
        });
      }

      results.push({ card: cardMeta.slug, status: 'ok' });
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      results.push({ card: cardMeta.slug, status: 'error', error: String(error) });
    }
  }

  return NextResponse.json({ fetched: results.length, results });
}
```

---

## 4. Sold Data Fetching

### 4.1 File: `src/app/api/cron/sales/route.ts` (NEW)

Add a third cron route for eBay sold data. Runs bi-weekly (twice a month) due to the 25 requests/month limit on SoldComps free tier.

```typescript
// Fetches sold listings for each card
// Keyword pattern: "{cardName} {cardNumber}"
// Stores results in the GradedSale table
// Deduplicates by checking listingUrl against existing records
```

Add to `vercel.json`:
```json
{
  "path": "/api/cron/sales",
  "schedule": "0 8 1,15 * *"
}
```

Runs on the 1st and 15th of each month at 8:00 AM UTC.

### 4.2 Deduplication

Before inserting a sold listing, check if a record with the same `listingUrl` already exists. Skip if duplicate. This prevents double-counting on overlapping fetches.

---

## 5. Replacing Mock Data — Home Page

### 5.1 File: `src/app/page.tsx`

The home page currently uses static `CARDS` array data. Update to fetch from database:

```typescript
import { getAllCards } from '@/lib/db/queries';
import { getPortfolioValue, getHuntProgress } from '@/lib/db/queries';

export default async function HomePage() {
  const cards = await getAllCards();
  const portfolioValue = await getPortfolioValue();
  const huntProgress = await getHuntProgress();

  return (
    <>
      <VaultOverlay />
      <div className="pt-16">
        <PortfolioHeader
          value={portfolioValue}
          cardCount={cards.length}
          blackLabels={huntProgress.blackLabels}
          totalCards={huntProgress.total}
        />
        <div className="mx-auto max-w-[1200px] px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card, index) => (
              <Link key={card.slug} href={`/card/${card.slug}`}>
                <CardTilt card={card} index={index} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

### 5.2 PortfolioHeader Update

Modify `PortfolioHeader` to accept props instead of hardcoded values:

```typescript
interface PortfolioHeaderProps {
  value: number;
  cardCount: number;
  blackLabels: number;
  totalCards: number;
}
```

---

## 6. Replacing Mock Data — Card Detail Page

### 6.1 File: `src/app/card/[slug]/page.tsx`

Fetch real data for the card:

```typescript
import { getCardBySlug, getLatestPrices, getLatestPop, getRecentSales, getPriceHistory } from '@/lib/db/queries';

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);

  if (!card) return notFound();

  const latestPrices = await getLatestPrices(card.id);
  const priceHistory = await getPriceHistory(card.id);
  const popData = await getLatestPop(card.id);
  const recentSales = await getRecentSales(card.id);

  return (
    <div style={accentColorStyle}>
      <BackLink />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <SlabViewer card={card} />
        <CardIdentity
          card={card}
          prices={latestPrices}
          ownership={card.ownership?.[0] ?? null}
        />
      </div>
      <DataPanels
        card={card}
        priceHistory={priceHistory}
        popData={popData}
        recentSales={recentSales}
      />
    </div>
  );
}
```

### 6.2 Component Updates

Each data component updates its props interface to accept real data:

- **CardIdentity**: `prices` prop replaces hardcoded `$—` placeholders
- **PriceHistory**: `data` prop replaces `MOCK_PRICE_DATA`
- **PopReport**: `data` prop replaces `MOCK_POP_DATA`
- **RecentSales**: `data` prop replaces mock rows

Components should **gracefully handle null/empty data** — show "No data yet" states instead of crashing. This is critical because the database will be empty until cron jobs have run or manual data has been entered.

---

## 7. Replacing Mock Data — Hunt Page

### 7.1 File: `src/app/hunt/page.tsx`

Replace mock hunt data with real ownership records:

```typescript
import { getAllCards } from '@/lib/db/queries';
import { getAllOwnership, getHuntProgress } from '@/lib/db/queries';

export default async function HuntPage() {
  const cards = await getAllCards();
  const ownership = await getAllOwnership();
  const progress = await getHuntProgress();

  // Merge cards with ownership data
  const huntData = cards.map((card) => {
    const own = ownership.find((o) => o.cardId === card.id);
    return {
      card,
      status: {
        acquired: own?.acquired ?? false,
        isBlackLabel: own?.labelType === 'Black',
        bestGrade: own?.grade ?? undefined,
        bestGrader: own?.condition ?? undefined,
        purchaseDate: own?.purchaseDate?.toISOString() ?? undefined,
        blPop: 0, // Populated from latest pop snapshot
      },
    };
  });

  return <HuntPageClient huntData={huntData} progress={progress} />;
}
```

### 7.2 Pop Data Integration

For the BL pop count on each hunt card, query the latest BGS pop snapshot:

```typescript
// In the hunt page data assembly:
const bgsPopSnapshots = await prisma.popSnapshot.findMany({
  where: { grader: 'BGS' },
  orderBy: { date: 'desc' },
  distinct: ['cardId'],
});

// Merge blPop into each card's hunt status
const blPopMap = new Map(
  bgsPopSnapshots.map((p) => [p.cardId, p.blackLabel])
);
```

---

## 8. Graceful Empty States

Every component that receives data from the database MUST handle the empty case. The database will be empty on first deploy. Components should show helpful empty states, not crash.

| Component | Empty State Message |
|-----------|-------------------|
| PortfolioHeader | `$0.00` value, `0 / 15` progress |
| PriceHistory chart | "No price data yet. Data populates automatically via daily sync." |
| PopReport bars | "No population data yet. Enter data manually or wait for weekly sync." |
| RecentSales table | "No recorded sales. Sales data syncs bi-weekly from eBay." |
| HuntCard BL pop | "Pop: —" (em dash instead of number) |
| CardIdentity prices | `$—` for each price line |

---

## 9. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/cron/prices/route.ts` | **REWRITE** | Real price fetching with auth |
| `src/app/api/cron/pop/route.ts` | **REWRITE** | Real PSA pop fetching with auth |
| `src/app/api/cron/sales/route.ts` | **CREATE** | eBay sold data fetching |
| `vercel.json` | **CREATE** | Cron schedule configuration |
| `src/app/page.tsx` | **MODIFY** | Use database queries instead of static array |
| `src/app/card/[slug]/page.tsx` | **MODIFY** | Fetch real prices, pop, sales |
| `src/app/hunt/page.tsx` | **MODIFY** | Fetch real ownership + pop data |
| `src/components/ui/PortfolioHeader.tsx` | **MODIFY** | Accept props instead of hardcoded values |
| `src/components/cards/CardIdentity.tsx` | **MODIFY** | Accept price + ownership props |
| `src/components/charts/PriceHistory.tsx` | **MODIFY** | Accept real data, add empty state |
| `src/components/charts/PopReport.tsx` | **MODIFY** | Accept real data, add empty state |
| `src/components/charts/RecentSales.tsx` | **MODIFY** | Accept real data, add empty state |
| `src/components/hunt/HuntCard.tsx` | **MODIFY** | Use real ownership + pop data |

---

## 10. Verification

```
□ npx prisma db seed completes (15 cards in database)
□ Manually trigger /api/cron/prices with correct auth header — writes snapshots
□ Manually trigger /api/cron/pop with correct auth header — writes pop data
□ POST /api/pop with manual BGS data — stores correctly
□ Home page shows portfolio value from database (or $0.00 if no price data yet)
□ Card detail page shows real prices (or $— empty states)
□ Card detail chart shows real price history (or empty state message)
□ Card detail pop report shows real data (or empty state message)
□ Card detail sales table shows real data (or empty state message)
□ Hunt page shows real ownership data
□ Hunt page BL pop counts come from database
□ All pages handle empty database gracefully (no crashes)
□ vercel.json exists with cron schedules
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 11. What Comes Next

| PRD | Focus |
|-----|-------|
| **06** | Advanced Visualizations — Rarity aurora rings, portfolio constellation, price prediction models |
| **07** | Scroll Animations & Micro-interactions — GSAP ScrollTrigger, page transitions, final polish |
| **08** | Performance & Mobile — Lazy loading, bundle splitting, lighthouse, touch |
| **09** | Deployment — Vercel production, Neon setup, cron scheduling, initial data population |
