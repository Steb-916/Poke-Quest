# PRD-05d: API Client Correction — Drop Scrydex, Free Sources Only

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 05d (Patch — applies to PRD-05a/b)  
**Reason:** Scrydex (formerly pokemontcg.io) has no free tier. Minimum $29/month. Dropped entirely.

---

## 1. What Changed

The pokemontcg.io API migrated to Scrydex and eliminated its free tier. All plans start at $29/month. Since this project uses free APIs only, Scrydex is removed from the data pipeline entirely.

**This does NOT affect card images.** The pokemontcg.io image CDN (`https://images.pokemontcg.io/`) still serves images independently and requires no API key. Card images continue to work.

---

## 2. Revised Data Source Map

| Data Type | Source | Cost | Method |
|-----------|--------|------|--------|
| Card metadata | `cardData.ts` (hardcoded) | Free | Static — already in codebase |
| Card images | `images.pokemontcg.io` CDN | Free | Direct URL, no API key |
| Raw TCGPlayer prices | PokemonPriceTracker.com | Free (100 credits/day) | API |
| Graded prices (PSA/CGC/BGS) | PokemonPriceTracker.com | Free (100 credits/day) | API |
| eBay sold comps | SoldComps.com | Free (25 requests/month) | API |
| PSA pop reports | Manual via admin panel | Free | User entry |
| BGS/CGC/SGC pop reports | Manual via admin panel | Free | User entry |
| Black Label sales | Manual via admin panel | Free | User entry |

---

## 3. Files to Remove

**DELETE** `src/lib/api/pokemontcg.ts` — This entire file is no longer needed.

---

## 4. Files to Modify

### 4.1 `src/lib/api/pricetracker.ts`

PokemonPriceTracker is now the **sole automated pricing source**. It needs to handle both raw and graded prices. Update the client to fetch all available price data per card.

The PokemonPriceTracker API uses card names and set identifiers (not pokemontcg.io card IDs). Update the lookup to search by name + set:

```typescript
const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';

export async function fetchCardPrices(cardName: string, setName: string) {
  const res = await fetch(
    `${API_BASE}/cards?search=${encodeURIComponent(cardName)}&set=${encodeURIComponent(setName)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PRICETRACKER_API_KEY}`,
      },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();

  // Find the best match from results
  // API may return multiple cards — match by card number
  return data.data;
}
```

The response includes:
- TCGPlayer raw prices (market, low, mid, high by condition)
- PSA graded prices (8, 9, 10) from eBay sold data
- Card images and metadata as bonus

### 4.2 `src/lib/utils/cardData.ts`

Remove the `tcgplayerId` field if it was added. It's no longer needed since we're not using TCGPlayer's API directly. PokemonPriceTracker searches by name + set.

Keep `imageUrl` and `imageUrlSmall` — these point to the pokemontcg.io CDN which still works without an API key.

### 4.3 `src/app/api/cron/prices/route.ts`

Remove all references to `fetchCardData` from pokemontcg.ts. The cron job now only calls PokemonPriceTracker:

```typescript
import { fetchCardPrices } from '@/lib/api/pricetracker';
// REMOVED: import { fetchCardData } from '@/lib/api/pokemontcg';

// For each card:
const priceData = await fetchCardPrices(cardMeta.name, cardMeta.set);

// Write PriceSnapshot with whatever fields PriceTracker returns
await prisma.priceSnapshot.create({
  data: {
    cardId: card.id,
    source: 'pricetracker',
    rawMarket: priceData?.prices?.market ?? null,
    rawLow: priceData?.prices?.low ?? null,
    rawMid: priceData?.prices?.mid ?? null,
    rawHigh: priceData?.prices?.high ?? null,
    psa10: priceData?.gradedPrices?.psa10 ?? null,
    psa9: priceData?.gradedPrices?.psa9 ?? null,
    // BGS and CGC graded prices may not be available on free tier
    // Those get entered manually via admin panel
  },
});
```

### 4.4 `src/lib/api/rateLimiter.ts`

Remove the `pokemontcg` entry from the LIMITS config:

```typescript
const LIMITS: Record<string, RateLimitConfig> = {
  // REMOVED: pokemontcg entry
  pricetracker: {
    service: 'pricetracker',
    maxPerDay: 85,          // Actual limit: 100. Buffer: 15
  },
  soldcomps: {
    service: 'soldcomps',
    maxPerMonth: 22,        // Actual limit: 25. Buffer: 3
  },
};
```

### 4.5 `.env.local`

Remove `POKEMONTCG_API_KEY`. The only API keys needed are:

```env
DATABASE_URL="..."
PRICETRACKER_API_KEY=""
SOLDCOMPS_API_KEY=""
CRON_SECRET=""
```

### 4.6 `.env.example`

Same — remove `POKEMONTCG_API_KEY`.

### 4.7 Admin Panel — CronTriggers component

Remove the "pokemontcg.io" row from the API Usage Dashboard. Only show:
- PokemonPriceTracker: XX / 85 today
- SoldComps: XX / 22 this month

### 4.8 `prisma/seed.ts`

No changes needed — the seed script uses `cardData.ts` which has all metadata hardcoded. It never called the pokemontcg.io API.

---

## 5. What We Lose (and Why It's Fine)

| Lost | Impact | Mitigation |
|------|--------|------------|
| pokemontcg.io card metadata API | None | Already hardcoded in cardData.ts |
| pokemontcg.io TCGPlayer price embedding | Minimal | PokemonPriceTracker provides the same TCGPlayer prices |
| Automated card image URL lookup | None | CDN URLs are hardcoded and still work |
| BGS/CGC graded price automation | Minor | Free tier of PriceTracker may not have these. Enter manually via admin panel |

The only real gap is BGS and CGC graded prices, which the PokemonPriceTracker free tier may not cover fully. For high-value Black Label sales, those are rare enough that you'll likely find and enter them manually anyway (they're tracked as individual events, not market prices).

---

## 6. Verification

```
□ src/lib/api/pokemontcg.ts is deleted
□ No imports of pokemontcg anywhere in the codebase
□ POKEMONTCG_API_KEY removed from .env.local and .env.example
□ Cron price route uses only PokemonPriceTracker
□ Rate limiter has no pokemontcg entry
□ Admin usage dashboard shows only 2 services
□ Card images still load (CDN is independent of API)
□ npx tsc --noEmit passes
□ npm run build succeeds
```
