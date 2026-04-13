# PRD-05c: Database Setup, API Guardrails & Admin Panel

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 05c (Infrastructure + Admin)  
**Depends on:** PRD-05a complete. Neon account and project already created by user.

---

## 1. Overview

Three goals:
1. **Database setup** — connect to the user's existing Neon project, push schema, seed cards
2. **API guardrails** — rate limiting and usage tracking so free tier quotas are never exceeded
3. **Admin panel** — a simple `/admin` page for manual data entry (pop reports, sales, prices) without touching code or using curl

---

## 2. Database Setup

### 2.1 Prerequisites

The user has already created a Neon account and project. Claude Code needs to:

1. **Get the connection string from Neon.** 
   - Navigate to https://console.neon.tech using the Chrome extension
   - Find the project the user created
   - Copy the connection string (it looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)
   - If unable to access via Chrome extension, prompt the user to paste the connection string

2. **Write it to `.env.local`:**
   ```
   DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

3. **Push the schema:**
   ```bash
   npx prisma db push
   ```
   This creates all tables (Card, PriceSnapshot, PopSnapshot, GradedSale, Ownership) in the Neon database.

4. **Seed the cards:**
   ```bash
   npx prisma db seed
   ```
   This inserts the 15 card records.

5. **Verify with Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   Opens a browser UI at localhost:5555. Confirm the Card table has 15 rows.

### 2.2 Generate CRON_SECRET

Generate a random string for the cron secret and add to `.env.local`:

```bash
# Generate a random 32-character hex string
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Add to `.env.local`:
```
CRON_SECRET="the-generated-string"
```

---

## 3. API Guardrails

### 3.1 Usage Tracking Table

Add a new model to `prisma/schema.prisma`:

```prisma
model ApiUsage {
  id          String   @id @default(cuid())
  service     String                      // "pokemontcg" | "pricetracker" | "soldcomps"
  endpoint    String                      // The specific endpoint called
  date        DateTime @default(now())    // When the call was made
  creditsUsed Int      @default(1)        // How many credits this call consumed
  success     Boolean  @default(true)     // Did it succeed?
  responseMs  Int?                        // Response time in ms

  @@index([service, date])
}
```

Run `npx prisma db push` after adding this model.

### 3.2 Rate Limiter Module: `src/lib/api/rateLimiter.ts`

A centralized guard that checks usage before allowing API calls.

```typescript
import { prisma } from '@/lib/db/prisma';

interface RateLimitConfig {
  service: string;
  maxPerDay?: number;
  maxPerMonth?: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  pokemontcg: {
    service: 'pokemontcg',
    maxPerDay: 18000,      // Actual limit: 20,000. Buffer: 2,000
  },
  pricetracker: {
    service: 'pricetracker',
    maxPerDay: 85,          // Actual limit: 100. Buffer: 15
  },
  soldcomps: {
    service: 'soldcomps',
    maxPerMonth: 22,        // Actual limit: 25. Buffer: 3
  },
};

export async function checkRateLimit(service: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  period: string;
}> {
  const config = LIMITS[service];
  if (!config) return { allowed: true, used: 0, limit: Infinity, period: 'none' };

  if (config.maxPerDay) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const used = await prisma.apiUsage.count({
      where: {
        service,
        date: { gte: startOfDay },
      },
    });

    return {
      allowed: used < config.maxPerDay,
      used,
      limit: config.maxPerDay,
      period: 'day',
    };
  }

  if (config.maxPerMonth) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const used = await prisma.apiUsage.count({
      where: {
        service,
        date: { gte: startOfMonth },
      },
    });

    return {
      allowed: used < config.maxPerMonth,
      used,
      limit: config.maxPerMonth,
      period: 'month',
    };
  }

  return { allowed: true, used: 0, limit: Infinity, period: 'none' };
}

export async function logApiCall(
  service: string,
  endpoint: string,
  success: boolean,
  responseMs?: number,
  creditsUsed: number = 1
) {
  await prisma.apiUsage.create({
    data: {
      service,
      endpoint,
      success,
      responseMs,
      creditsUsed,
    },
  });
}
```

### 3.3 Integrate Into API Clients

Every API client function wraps its fetch with the rate limiter:

```typescript
// Example in pokemontcg.ts
export async function fetchCardData(setCode: string, cardNumber: string) {
  const rateCheck = await checkRateLimit('pokemontcg');
  if (!rateCheck.allowed) {
    console.warn(`pokemontcg rate limit reached: ${rateCheck.used}/${rateCheck.limit} per ${rateCheck.period}`);
    return null;
  }

  const start = Date.now();
  try {
    const res = await fetch(/* ... */);
    const data = await res.json();

    await logApiCall('pokemontcg', `cards/${setCode}-${cardNumber}`, res.ok, Date.now() - start);

    return data.data;
  } catch (error) {
    await logApiCall('pokemontcg', `cards/${setCode}-${cardNumber}`, false, Date.now() - start);
    return null;
  }
}
```

Apply the same pattern to `pricetracker.ts` and `soldcomps.ts`.

### 3.4 Cron Job Safety

Each cron route should check the rate limit at the start before looping through cards. If the limit is close, fetch fewer cards (prioritize by displayOrder) rather than exceeding the quota:

```typescript
// In cron/prices/route.ts
const rateCheck = await checkRateLimit('pokemontcg');
const remaining = rateCheck.limit - rateCheck.used;
const cardsToFetch = CARDS.slice(0, Math.min(CARDS.length, remaining));

if (cardsToFetch.length < CARDS.length) {
  console.warn(`Only fetching ${cardsToFetch.length}/15 cards due to rate limit`);
}
```

---

## 4. Admin Panel

### 4.1 Route: `src/app/admin/page.tsx`

A simple, functional admin page at `/admin`. NOT linked in the main navigation — it's accessed by typing the URL directly. No authentication needed (personal site), but it's unlisted so it's not discoverable by casual visitors.

### 4.2 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Vault                                             │
│                                                               │
│  ADMIN PANEL                                                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ API Usage Dashboard                                       ││
│  │                                                           ││
│  │ pokemontcg.io    12 / 18,000 today     ████░░░░░░        ││
│  │ PriceTracker     15 / 85 today         ██████████░        ││
│  │ SoldComps        8 / 22 this month     ████████░░░        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  [Pop Reports]  [Sales Entry]  [Price Override]  [Triggers]  │
│                                                               │
│  ── Active Panel Below ──                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Tab: Pop Reports Entry

The most frequently used manual entry. Designed for speed — you visit Beckett/CGC/SGC once a month, then come here and punch in numbers.

```
Card:    [Umbreon VMAX ▾]         ← Dropdown of all 15 cards
Grader:  [BGS ▾]                  ← PSA | BGS | CGC | SGC

Total Graded:    [______]
Grade 10:        [______]
Black Label:     [______]         ← Only visible when BGS selected
Grade 9.5:       [______]
Grade 9:         [______]
Grade 8.5:       [______]
Grade 8:         [______]
7 and Below:     [______]
Authentic:       [______]

[Save Pop Report]
```

**Bulk Mode Toggle:** A checkbox that expands the form to show all 15 cards at once for the selected grader. This is for when you visit Beckett and want to enter data for all cards in one sitting:

```
Grader: [BGS ▾]

                     Total   10    BL    9.5   9    8.5   8    ≤7
Umbreon VMAX         [___]  [___] [___] [___] [___] [___] [___] [___]
Rayquaza VMAX        [___]  [___] [___] [___] [___] [___] [___] [___]
Deoxys VMAX          [___]  [___] [___] [___] [___] [___] [___] [___]
... (all 15 rows)

[Save All]
```

The bulk table is the killer feature for monthly data entry. Select BGS, type across the rows, hit save. All 15 pop snapshots created in one action.

### 4.4 Tab: Sales Entry

For recording individual graded sales you find on eBay or elsewhere.

```
Card:       [Umbreon VMAX ▾]
Date:       [2026-04-10]
Platform:   [eBay ▾]           ← eBay | Fanatics | Whatnot | PWCC | Other
Grader:     [BGS ▾]
Grade:      [Black Label ▾]
Price:      [$________]
Shipping:   [$________]
Listing URL: [________________________________]
Notes:      [________________________________]

[Save Sale]
```

After saving, show the sale in a mini table below the form so you can see what you've recently entered and catch mistakes.

**Recent Entries (last 10):**

| Date | Card | Grader | Grade | Price | ✕ |
|------|------|--------|-------|-------|---|

The ✕ button deletes the entry (with confirmation).

### 4.5 Tab: Price Override

For manually setting a price when the APIs don't have data (common for Black Label sales that happen off-platform).

```
Card:              [Umbreon VMAX ▾]
Source:            [Manual ▾]        ← Manual | eBay | TCGPlayer
Raw NM:            [$________]
PSA 10:            [$________]
BGS 10 Pristine:   [$________]
BGS Black Label:   [$________]
BGS 9.5:           [$________]
CGC 10 Perfect:    [$________]
CGC 10 Pristine:   [$________]

[Save Price Snapshot]
```

This creates a PriceSnapshot record with `source: 'manual'`. Manual entries coexist with API-fetched entries — they don't overwrite each other.

### 4.6 Tab: Triggers

Manual buttons to trigger cron jobs on demand (instead of waiting for the schedule):

```
┌──────────────────────────────────────┐
│  Fetch Prices Now                     │
│  Last run: Apr 13, 2026 6:00 AM      │
│  [Run Price Fetch]                    │
├──────────────────────────────────────┤
│  Fetch PSA Pop Reports Now            │
│  Last run: Apr 8, 2026 7:00 AM       │
│  [Run Pop Fetch]                      │
├──────────────────────────────────────┤
│  Fetch eBay Sales Now                 │
│  Last run: Apr 1, 2026 8:00 AM       │
│  [Run Sales Fetch]                    │
│                                       │
│  ⚠ SoldComps: 8/22 used this month   │
└──────────────────────────────────────┘
```

Each button calls the respective cron API route with the `CRON_SECRET` header. The rate limiter prevents exceeding quotas even if you spam the button. Show the current usage count next to each trigger so you can see where you stand.

### 4.7 API Routes for Admin

Create `src/app/api/admin/` routes for the admin panel:

**`POST /api/admin/pop`** — saves single or bulk pop snapshots
**`POST /api/admin/sale`** — saves a graded sale record  
**`DELETE /api/admin/sale`** — deletes a sale record by ID
**`POST /api/admin/price`** — saves a manual price snapshot
**`GET /api/admin/usage`** — returns current API usage stats for the dashboard

These are separate from the cron routes. No `CRON_SECRET` needed (personal site, unlisted page).

### 4.8 Admin Styling

The admin page doesn't need to match the vault aesthetic. It's a utility page. Keep it clean and functional:

- Same dark background and fonts as the rest of the site
- Simple form layouts with clear labels
- No animations or fancy effects
- Tables for data review
- Success/error toasts after save actions
- The focus is speed and usability, not visual polish

---

## 5. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | **MODIFY** | Add ApiUsage model |
| `src/lib/api/rateLimiter.ts` | **CREATE** | Rate limit checking + usage logging |
| `src/lib/api/pokemontcg.ts` | **MODIFY** | Add rate limiter integration |
| `src/lib/api/pricetracker.ts` | **MODIFY** | Add rate limiter integration |
| `src/lib/api/soldcomps.ts` | **MODIFY** | Add rate limiter integration |
| `src/app/api/cron/prices/route.ts` | **MODIFY** | Add rate limit check before loop |
| `src/app/api/cron/pop/route.ts` | **MODIFY** | Add rate limit check before loop |
| `src/app/api/cron/sales/route.ts` | **MODIFY** | Add rate limit check before loop |
| `src/app/admin/page.tsx` | **CREATE** | Admin panel page |
| `src/components/admin/PopEntryForm.tsx` | **CREATE** | Single + bulk pop entry |
| `src/components/admin/SalesEntryForm.tsx` | **CREATE** | Sales entry + recent list |
| `src/components/admin/PriceOverrideForm.tsx` | **CREATE** | Manual price entry |
| `src/components/admin/CronTriggers.tsx` | **CREATE** | Manual cron trigger buttons |
| `src/components/admin/UsageDashboard.tsx` | **CREATE** | API usage bars |
| `src/app/api/admin/pop/route.ts` | **CREATE** | Pop entry endpoint |
| `src/app/api/admin/sale/route.ts` | **CREATE** | Sale CRUD endpoint |
| `src/app/api/admin/price/route.ts` | **CREATE** | Price override endpoint |
| `src/app/api/admin/usage/route.ts` | **CREATE** | Usage stats endpoint |

---

## 6. Verification

```
□ Database connected: npx prisma db push succeeds against Neon
□ Seed works: npx prisma db seed shows 15 cards
□ Prisma Studio shows 15 Card rows and an empty ApiUsage table
□ /admin page loads with all four tabs
□ API Usage dashboard shows 0/limit for all three services
□ Pop Reports tab: single card entry saves to database
□ Pop Reports tab: bulk mode shows 15-row table, saves all at once
□ Sales Entry tab: form saves a sale, it appears in the recent list
□ Sales Entry tab: delete button removes a sale
□ Price Override tab: saves a manual price snapshot
□ Triggers tab: "Run Price Fetch" calls cron endpoint and updates usage count
□ Rate limiter blocks API calls when limit is reached (test by setting limit to 1)
□ Cron routes log usage to ApiUsage table
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

**→ After PRD-05c, all infrastructure is complete. PRD-06 begins the advanced visualization layer.**
