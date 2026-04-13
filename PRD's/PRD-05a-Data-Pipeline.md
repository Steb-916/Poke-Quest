# PRD-05a: Data Pipeline — Seeding, API Clients & Query Layer

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 05a of 2 (Data Sources + Query Layer)  
**Depends on:** PRD-04b complete, DATABASE_URL configured in .env.local

---

## 1. Overview

This PRD establishes the data pipeline: seeding the database with the 15 cards, building API client modules for each external data source, and creating the query layer that every page component will use to fetch real data. After this PRD, the database is populated and the fetch functions exist — PRD-05b wires them into cron jobs and replaces mock data across all pages.

### 1.1 Prerequisites

Before starting this PRD:
1. A PostgreSQL database must be running (Neon free tier recommended)
2. `DATABASE_URL` must be set in `.env.local`
3. Run `npx prisma db push` to create all tables from the schema in PRD-01

---

## 2. Database Seeding

### 2.1 Seed Script: `prisma/seed.ts`

A TypeScript seed script that populates the `Card` table with all 15 cards. This runs once to initialize the database. It uses upsert so it's safe to re-run without creating duplicates.

```typescript
import { PrismaClient } from '@prisma/client';
import { CARDS } from '../src/lib/utils/cardData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 15 cards...');

  for (const card of CARDS) {
    await prisma.card.upsert({
      where: { slug: card.slug },
      update: {
        name: card.name,
        pokemon: card.pokemon,
        set: card.set,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        artType: card.artType,
        illustrator: card.illustrator,
        hp: card.hp,
        typing: card.typing,
        stage: card.stage,
        displayOrder: card.displayOrder,
        // imageUrl and tcgplayerId are set by the pokemontcg.io fetch
        imageUrl: card.imageUrl || '',
        imageUrlSmall: card.imageUrlSmall || '',
      },
      create: {
        slug: card.slug,
        name: card.name,
        pokemon: card.pokemon,
        set: card.set,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        artType: card.artType,
        illustrator: card.illustrator,
        hp: card.hp,
        typing: card.typing,
        stage: card.stage,
        displayOrder: card.displayOrder,
        imageUrl: card.imageUrl || '',
        imageUrlSmall: card.imageUrlSmall || '',
      },
    });
    console.log(`  ✓ ${card.name}`);
  }

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 2.2 Update `cardData.ts`

Add `imageUrl` and `imageUrlSmall` fields to each card entry using the pokemontcg.io CDN pattern:

```typescript
// Pattern: https://images.pokemontcg.io/{setCode}/{cardNumberBeforeSlash}_hires.png
// Example: swsh7/215_hires.png

// Add to each CardMeta entry:
imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
imageUrlSmall: 'https://images.pokemontcg.io/swsh7/215.png',
```

The card number before the slash needs to be extracted from `cardNumber`. For cards like `215/203`, use `215`. For `GG45/GG70`, use `GG45`. For `TG13/TG30`, use `TG13`.

Also add a `tcgplayerId` field to `CardMeta` — this will be populated by the pokemontcg.io API lookup (Section 3) and stored in the database for price API lookups.

### 2.3 Package.json Seed Command

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Install ts-node as a dev dependency:
```bash
npm install -D ts-node
```

Run with: `npx prisma db seed`

---

## 3. API Client: pokemontcg.io

### 3.1 File: `src/lib/api/pokemontcg.ts`

This client fetches card metadata and TCGPlayer pricing from the free pokemontcg.io API (v2).

### 3.2 Functions

**`fetchCardData(setCode: string, cardNumber: string)`**

Looks up a single card and returns metadata + TCGPlayer prices.

```typescript
const API_BASE = 'https://api.pokemontcg.io/v2';

interface PokemonTcgCard {
  id: string;
  name: string;
  images: { small: string; large: string };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: {
      holofoil?: { low: number; mid: number; high: number; market: number };
      // Other variants possible
    };
  };
}

export async function fetchCardData(
  setCode: string,
  cardNumber: string
): Promise<PokemonTcgCard | null> {
  // Card number needs slash stripped: "215/203" → "215"
  const num = cardNumber.split('/')[0];
  const cardId = `${setCode}-${num}`;

  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    headers: {
      'X-Api-Key': process.env.POKEMONTCG_API_KEY || '',
    },
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}
```

**`fetchAllCardPrices()`**

Batch-fetches TCGPlayer prices for all 15 cards. Returns a map of slug → price data.

```typescript
export async function fetchAllCardPrices(): Promise<Map<string, TcgPriceData>> {
  // Fetch each card, extract tcgplayer.prices
  // Return as a Map keyed by card slug
}
```

### 3.3 Rate Limiting

pokemontcg.io allows 20,000 requests/day with an API key (1,000 without). For 15 cards fetched once daily, this is well within limits. Add a 200ms delay between requests to be polite.

---

## 4. API Client: PokemonPriceTracker

### 4.1 File: `src/lib/api/pricetracker.ts`

This client fetches graded card prices (PSA 10, BGS, CGC grades) sourced from eBay sold data.

### 4.2 Functions

**`fetchGradedPrices(tcgplayerId: string)`**

Fetches graded sale prices for a card. The PokemonPriceTracker API uses TCGPlayer IDs to look up cards.

```typescript
const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';

export async function fetchGradedPrices(tcgplayerId: string) {
  const res = await fetch(
    `${API_BASE}/cards?tcgPlayerId=${tcgplayerId}&includeEbay=true`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PRICETRACKER_API_KEY}`,
      },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}
```

### 4.3 Free Tier Limits

Free tier: 100 credits/day. Each card lookup = 1 credit. 15 cards = 15 credits/day — plenty of headroom. The $9.99/month plan (20k credits) is available if more history depth is needed later.

### 4.4 Data Mapping

Map the API response into our `PriceSnapshot` schema:

```typescript
export function mapToPriceSnapshot(apiData: any, cardId: string): Partial<PriceSnapshot> {
  return {
    cardId,
    source: 'pricetracker',
    rawMarket: apiData.prices?.market,
    rawLow: apiData.prices?.low,
    rawMid: apiData.prices?.mid,
    rawHigh: apiData.prices?.high,
    psa10: apiData.gradedPrices?.psa10,
    psa9: apiData.gradedPrices?.psa9,
    // BGS and CGC may not be available on free tier
    // Map whatever fields the API returns
  };
}
```

---

## 5. API Client: SoldComps (eBay Sold Data)

### 5.1 File: `src/lib/api/soldcomps.ts`

Fetches recent eBay sold listings for specific graded card searches.

### 5.2 Functions

**`fetchSoldListings(keyword: string)`**

```typescript
const API_BASE = 'https://sold-comps.com/api/v1';

export async function fetchSoldListings(keyword: string) {
  const res = await fetch(
    `${API_BASE}/scrape?keyword=${encodeURIComponent(keyword)}&site=EBAY-US`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SOLDCOMPS_API_KEY}`,
      },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}
```

**`fetchCardSoldData(cardName: string, grader?: string, grade?: string)`**

Wrapper that constructs the right keyword string:

```typescript
export async function fetchCardSoldData(
  cardName: string,
  cardNumber: string,
  grader?: string,
  grade?: string
) {
  // Build keyword: "Umbreon VMAX 215/203 BGS 10 Black Label"
  let keyword = `${cardName} ${cardNumber}`;
  if (grader) keyword += ` ${grader}`;
  if (grade) keyword += ` ${grade}`;

  const results = await fetchSoldListings(keyword);

  // Map to our GradedSale schema
  return results.map((item: any) => ({
    date: new Date(item.soldDate),
    platform: 'ebay',
    grader: grader || 'RAW',
    grade: grade || 'NM',
    price: item.soldPrice,
    shippingCost: item.shippingCost,
    listingUrl: item.url,
  }));
}
```

### 5.3 Free Tier Limits

25 requests/month on free tier. Each request returns up to 240 results. Strategy:
- Fetch each card once per month for raw sold data: 15 requests
- Fetch targeted Black Label searches for key cards: ~5 requests
- Total: ~20/month, under the 25 limit

For higher volume, the $19/month plan provides 500 requests.

---

## 6. PSA Pop Report Fetching

### 6.1 File: `src/lib/api/psapop.ts`

PSA doesn't have a public API, but their pop report pages are scrapeable. The Apify scraper (referenced in our research) can pull this data. For our 15 cards, we can also fetch from the PSA website directly.

### 6.2 Approach

Use a server-side fetch to the PSA pop report page for each card and parse the HTML response. However, **this is fragile and may break if PSA changes their page structure.** The more reliable approach for 15 cards is:

**Option A (recommended for now):** Manual entry via a simple admin function. Fetch the data yourself from psacard.com/pop monthly and enter it through an API route.

**Option B (automated):** Use the Apify PSA Pop Scraper actor with a scheduled run. This costs Apify credits but is hands-off.

### 6.3 Manual Entry API Route

Create `src/app/api/pop/route.ts`:

```typescript
// POST — Submit a pop snapshot for a card + grader
{
  cardSlug: string;
  grader: 'PSA' | 'BGS' | 'CGC' | 'SGC';
  total: number;
  grade10: number;
  blackLabel?: number;    // BGS only
  grade95?: number;
  grade9?: number;
  grade85?: number;
  grade8?: number;
  grade7AndBelow?: number;
  authentic?: number;
}
```

This lets you manually submit pop data from any grading company. The cron job (PRD-05b) handles automated PSA fetching; BGS, CGC, and SGC pop data are entered manually via this route (monthly, as discussed in the data strategy).

---

## 7. Database Query Layer

### 7.1 File: `src/lib/db/queries.ts`

Centralized typed query functions that all page components use. These abstract away Prisma calls so components never import Prisma directly.

```typescript
import { prisma } from './prisma';

// ── Card Queries ──

export async function getAllCards() {
  return prisma.card.findMany({
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getCardBySlug(slug: string) {
  return prisma.card.findUnique({
    where: { slug },
    include: {
      ownership: true,
    },
  });
}

// ── Price Queries ──

export async function getLatestPrices(cardId: string) {
  return prisma.priceSnapshot.findFirst({
    where: { cardId },
    orderBy: { date: 'desc' },
  });
}

export async function getPriceHistory(cardId: string, days: number = 365) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.priceSnapshot.findMany({
    where: {
      cardId,
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  });
}

// ── Pop Report Queries ──

export async function getLatestPop(cardId: string, grader?: string) {
  const where: any = { cardId };
  if (grader) where.grader = grader;

  return prisma.popSnapshot.findMany({
    where,
    orderBy: { date: 'desc' },
    distinct: ['grader'],
  });
}

export async function getPopHistory(cardId: string, grader: string) {
  return prisma.popSnapshot.findMany({
    where: { cardId, grader },
    orderBy: { date: 'asc' },
  });
}

// ── Sales Queries ──

export async function getRecentSales(cardId: string, limit: number = 20) {
  return prisma.gradedSale.findMany({
    where: { cardId },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

export async function getSalesByGrader(
  cardId: string,
  grader: string,
  grade?: string
) {
  const where: any = { cardId, grader };
  if (grade) where.grade = grade;

  return prisma.gradedSale.findMany({
    where,
    orderBy: { date: 'desc' },
  });
}

// ── Ownership Queries ──

export async function getOwnership(cardId: string) {
  return prisma.ownership.findFirst({
    where: { cardId },
  });
}

export async function getAllOwnership() {
  return prisma.ownership.findMany({
    include: { card: true },
  });
}

// ── Portfolio Aggregate Queries ──

export async function getPortfolioValue() {
  const cards = await prisma.card.findMany({
    include: {
      prices: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  let total = 0;
  for (const card of cards) {
    const latest = card.prices[0];
    if (latest?.rawMarket) total += latest.rawMarket;
  }

  return total;
}

export async function getHuntProgress() {
  const ownership = await prisma.ownership.findMany();

  const total = 15;
  const acquired = ownership.filter((o) => o.acquired).length;
  const blackLabels = ownership.filter(
    (o) => o.acquired && o.labelType === 'Black'
  ).length;

  return { total, acquired, blackLabels };
}
```

### 7.2 Usage Pattern

Page components call these functions in server components:

```typescript
// In src/app/card/[slug]/page.tsx
const card = await getCardBySlug(slug);
const prices = card ? await getLatestPrices(card.id) : null;
const popData = card ? await getLatestPop(card.id) : null;
const sales = card ? await getRecentSales(card.id) : null;
```

Then pass the data as props to client components.

---

## 8. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `prisma/seed.ts` | **CREATE** | Database seed script for 15 cards |
| `src/lib/api/pokemontcg.ts` | **CREATE** | pokemontcg.io API client |
| `src/lib/api/pricetracker.ts` | **CREATE** | PokemonPriceTracker API client |
| `src/lib/api/soldcomps.ts` | **CREATE** | SoldComps eBay data client |
| `src/lib/api/psapop.ts` | **CREATE** | PSA pop data fetching/entry |
| `src/lib/api/types.ts` | **CREATE** | Shared API response types |
| `src/lib/db/queries.ts` | **CREATE** | Centralized database query functions |
| `src/app/api/pop/route.ts` | **CREATE** | Manual pop data entry endpoint |
| `src/lib/utils/cardData.ts` | **MODIFY** | Add imageUrl, imageUrlSmall, tcgplayerId |
| `package.json` | **MODIFY** | Add seed command + ts-node dev dep |

---

## 9. Verification

```
□ npx prisma db push creates tables successfully
□ npx prisma db seed populates 15 cards without errors
□ Card records visible in database (use Prisma Studio: npx prisma studio)
□ pokemontcg.ts fetchCardData returns data for Umbreon VMAX
□ pricetracker.ts fetchGradedPrices returns price data (if API key set)
□ soldcomps.ts fetchSoldListings returns results (if API key set)
□ POST /api/pop accepts and stores a pop snapshot
□ queries.ts functions compile without errors
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

**→ Continue to PRD-05b for cron jobs, data refresh scheduling, and replacing mock data across all pages**
