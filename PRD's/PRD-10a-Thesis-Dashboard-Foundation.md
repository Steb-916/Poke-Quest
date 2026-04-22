# PRD-10a: Thesis Dashboard — Foundation

**Version:** 1.0
**Date:** April 22, 2026
**Status:** Ready for Implementation
**PRD Sequence:** 10a of 5 (Data Layer + Page Shell)
**Depends on:** PRD-09 complete and verified

---

## 1. Overview

### 1.1 What This Is

The Thesis Dashboard is a new top-level section at `/thesis` that presents a data-driven investment thesis for pitching prospective investors. It is distinct from the main 15-card portfolio: it analyzes a different card universe (13 chase cards across XY Evolutions and Scarlet & Violet 151, plus 17 sealed products), uses a different data cadence (static April 22, 2026 snapshot, not live-updated), and speaks to a different audience (external investors, not the portfolio owner).

The dashboard's job is to argue three conclusions:

1. **Active trading** — raw Mega EX Full Arts from XY Evolutions grade for 200–260% expected adjusted margins, with M Blastoise-EX Full Art leading at 258%.
2. **Passive sealed investing** — Evolutions sealed matches market benchmarks at 8.4% CAGR over five years; SV151 sealed underperforms at 1.6%.
3. **Ripping sealed for singles** — universally unattractive, best-case 73% capital recovery on an Evolutions booster pack.

PRD-10a establishes the foundation: the data model, the snapshot seed pipeline, the route and page shell, the navigation integration, and the executive summary hero. PRD-10b through 10e build the analytical sections on top of this foundation.

### 1.2 What This Is Not

- **Not** integrated with the main `Card` model. The thesis universe (EVO + SV151) and the portfolio universe (SWSH V/VMAX alt arts) are separate asset classes with separate data pipelines.
- **Not** live-updated. The seed is a fixed snapshot. Future snapshots can be added without schema changes (see §4.3), but there is no cron, no API polling, no PriceTracker integration for this section.
- **Not** a portfolio tracking tool. Investors viewing this section see analytical conclusions, not a P&L.
- **Not** transaction-ready. There are no "buy" buttons, no cart, no broker integration. The dashboard persuades; it does not execute.

### 1.3 Scope Boundary

Everything in the `Thesis*` Prisma models, everything rendered under `/thesis/*`, and everything imported from the snapshot JSON is in scope. The main portfolio at `/`, `/collection`, `/hunt`, and `/card/[slug]` is untouched. The cron routes at `/api/cron/*` are untouched. The `PriceSnapshot`, `PopSnapshot`, `GradedSale`, and `Ownership` models are untouched.

---

## 2. Information Architecture

### 2.1 Route

```
/thesis                    → The single dashboard page (scrolling sections)
```

No sub-routes in the initial build. All five analytical sections live on the same scrollable page and are navigated via a fixed scrollspy sidebar (see §8). This is deliberate: an investor-facing pitch is easier to screenshot, share, and scroll through as a single continuous document than as a multi-page flow.

### 2.2 Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Navigation Bar (existing) — now with "Thesis" link                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  HERO SECTION                                                         │
│                                                                       │
│  INVESTMENT THESIS                                                    │
│  Grade-Gap and Sealed Product Opportunities in                        │
│  XY Evolutions & Scarlet & Violet 151                                 │
│                                                                       │
│  Steven Nielsen  ·  Data snapshot: April 22, 2026                     │
│                                                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐      │
│  │  ACTIVE TRADING  │ │   SEALED HOLD    │ │  RIP & GRADE     │      │
│  │                  │ │                  │ │                  │      │
│  │     258%         │ │    8.4%          │ │   NEGATIVE       │      │
│  │  adj. margin     │ │    CAGR          │ │   every SKU      │      │
│  │                  │ │                  │ │                  │      │
│  │ M Blastoise-EX   │ │  EVO sealed      │ │  73% best-case   │      │
│  │ Full Art · EVO   │ │  5yr base case   │ │  recovery        │      │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘      │
│                                                                       │
├───────────────────┬───────────────────────────────────────────────────┤
│                   │                                                    │
│  SCROLLSPY NAV    │   ANALYTICAL SECTIONS                              │
│  (sticky left)    │   (scrolls)                                        │
│                   │                                                    │
│  §1 Grade-Gap     │   §1 Grade-Gap Trading                             │
│  §2 Market        │     (PRD-10b fills this)                           │
│     Structure     │                                                    │
│  §3 Sealed        │   §2 Market Structure                              │
│  §4 Recs          │     (PRD-10c fills this)                           │
│  §5 Caveats       │                                                    │
│                   │   §3 Sealed Product Analysis                       │
│                   │     (PRD-10d fills this)                           │
│                   │                                                    │
│                   │   §4 Recommendations                               │
│                   │     (PRD-10e fills this)                           │
│                   │                                                    │
│                   │   §5 Caveats & Methodology                         │
│                   │     (PRD-10e fills this)                           │
│                   │                                                    │
└───────────────────┴───────────────────────────────────────────────────┘
```

### 2.3 Responsive Behavior

- **≥1280px** — scrollspy sidebar visible on the left at 220px, content area takes remaining width capped at 960px.
- **1024–1279px** — scrollspy sidebar collapses to a thin icon rail at 56px; labels appear on hover.
- **<1024px** — sidebar becomes a horizontal sticky bar under the nav (same scrollspy logic, different presentation). Hero cards stack vertically.

---

## 3. Data Model

### 3.1 Prisma Schema Additions

Add the following models to `prisma/schema.prisma`. Append at the end of the file — do not reorder or modify any existing models.

```prisma
// ─────────────────────────────────────────────
// THESIS DASHBOARD (PRD-10a+)
// Separate universe from main Card model.
// Time-series-ready; initial seed is a single snapshot.
// ─────────────────────────────────────────────

model ThesisSnapshot {
  id                  String                  @id @default(cuid())
  snapshotId          String                  @unique              // "snapshot_2026-04-22_T1530Z"
  snapshotDate        DateTime                                     // 2026-04-22
  title               String                                       // "April 22, 2026 base case"
  isPrimary           Boolean                 @default(false)      // Only one true at a time; drives default view

  gemRates            ThesisGemRate[]
  gradeGaps           ThesisGradeGap[]
  sealedHolds         ThesisSealedHold[]
  sealedRipGrades     ThesisSealedRipGrade[]
  packEvs             ThesisPackEv[]
  parameters          ThesisParameter[]

  createdAt           DateTime                @default(now())

  @@index([snapshotDate])
  @@index([isPrimary])
}

model ThesisCard {
  id                  String                  @id                  // "evo_102_m_blastoise_ex_fa"
  cardName            String                                       // "M Blastoise-EX Full Art"
  setCode             String                                       // "EVO" | "SV151"
  setName             String                                       // "XY Evolutions" | "Scarlet & Violet 151"
  cardNumber          String                                       // "102/108"
  variant             String?                                      // "holo" | "reverse_holo" | "staff" | "prerelease" | null
  rarity              String                                       // "Ultra Rare (Mega EX Full Art)"
  releaseDate         DateTime
  baseCardId          String?                                      // For variants, points to base card
  displayOrder        Int                     @default(0)          // Sort order within set

  gemRates            ThesisGemRate[]
  gradeGaps           ThesisGradeGap[]
  packEvs             ThesisPackEv[]

  @@index([setCode, displayOrder])
}

model ThesisGemRate {
  id                  String                  @id @default(cuid())
  snapshotId          String
  snapshot            ThesisSnapshot          @relation(fields: [snapshotId], references: [snapshotId])
  cardId              String
  card                ThesisCard              @relation(fields: [cardId], references: [id])

  grader              String                                       // "PSA" | "CGC" | "BGS"
  totalGraded         Int
  gemCount            Int                                          // PSA 10 / CGC Pristine 10 / BGS Black Label count
  gemRate             Float                                        // 0.0 to 1.0
  qualifierCountExcluded Int                  @default(0)
  flag                String                  @default("OK")       // "OK" | "THIN"

  @@unique([snapshotId, cardId, grader])
  @@index([cardId, grader])
}

model ThesisGradeGap {
  id                           String         @id @default(cuid())
  snapshotId                   String
  snapshot                     ThesisSnapshot @relation(fields: [snapshotId], references: [snapshotId])
  cardId                       String
  card                         ThesisCard     @relation(fields: [cardId], references: [id])

  rank                         Int                                 // 1-based ranking within snapshot
  rawPriceNm                   Float
  psa10Price                   Float
  psa9Price                    Float
  psaGemRate                   Float                               // Denormalized from ThesisGemRate for query efficiency
  psaTotalGraded               Int
  assumedGradingFee            Float                               // PSA fee tier fee ($25 / $40 / $100 / $300)

  // Nominal calculation (no PSA 9 realization haircut)
  grossEvNominal               Float
  netEvNominal                 Float
  expectedMarginPctNominal     Float

  // Adjusted calculation (75% PSA 9 realization haircut — the primary ranking column)
  grossEvAdjusted              Float
  netEvAdjusted                Float
  expectedMarginPctAdjusted    Float

  distributionProfile          String                              // "GEM_CONCENTRATED" | "BALANCED" | "TAIL_DRIVEN"
  economicTier                 String                              // "STRONG" | "VIABLE" | "UNPROFITABLE"
  playType                     String                              // "STEADY" | "TAIL_PROFITABLE" | "TAIL_LOTTERY" | "AVOID"
  confidence                   String                              // "OK" | "THIN"

  nForReliability              Int                                 // ceil(3 / gemRate)
  capitalAtScale               Float                               // nForReliability * rawPriceNm
  scaleTier                    String                              // "SMALL" | "MEDIUM" | "LARGE" | "INSTITUTIONAL"

  @@unique([snapshotId, cardId])
  @@index([snapshotId, rank])
}

model ThesisSealedProduct {
  id                  String                  @id                  // "evo_booster_box"
  productName         String                                       // "XY Evolutions Booster Box"
  setCode             String                                       // "evolutions" | "sv151"
  skuType             String                                       // "booster_box" | "etb" | "pack" | "upc" | "collection_box" | "bundle" | "bundle_display" | "blister"
  packsPerUnit        Int?                                         // NULL for non-pack products (binder collection, poster)
  releaseYear         Int
  displayOrder        Int                     @default(0)
  notes               String?

  holds               ThesisSealedHold[]
  ripGrades           ThesisSealedRipGrade[]

  @@index([setCode, displayOrder])
}

model ThesisSealedHold {
  id                     String               @id @default(cuid())
  snapshotId             String
  snapshot               ThesisSnapshot       @relation(fields: [snapshotId], references: [snapshotId])
  productId              String
  product                ThesisSealedProduct  @relation(fields: [productId], references: [id])

  currentPriceUsd        Float
  futureNetValue         Float                                     // After exit transaction costs
  totalReturnPct         Float
  impliedCagr            Float
  benchmarkComparison    String                                    // "BEATS_MARKET" | "MATCHES_MARKET" | "UNDERPERFORMS"

  @@unique([snapshotId, productId])
}

model ThesisSealedRipGrade {
  id                     String               @id @default(cuid())
  snapshotId             String
  snapshot               ThesisSnapshot       @relation(fields: [snapshotId], references: [snapshotId])
  productId              String
  product                ThesisSealedProduct  @relation(fields: [productId], references: [id])

  impliedPricePerPack    Float
  freshPackGradeEv       Float
  productLevelEv         Float                                     // Can be negative
  productRoiPct          Float                                     // Can be negative
  arbitrageFlag          String                                    // "ATTRACTIVE" | "MODERATE" | "UNATTRACTIVE"

  @@unique([snapshotId, productId])
}

model ThesisPackEv {
  id                     String               @id @default(cuid())
  snapshotId             String
  snapshot               ThesisSnapshot       @relation(fields: [snapshotId], references: [snapshotId])
  cardId                 String
  card                   ThesisCard           @relation(fields: [cardId], references: [id])

  pullRateDecimal        Float?                                    // NULL for cards with no known pull rate (Staff Stamp, Prerelease)
  grossEvAdjusted        Float
  perPackContribution    Float                                     // pullRate * grossEvAdjusted; 0 if pullRate is NULL
  derivedFlag            Boolean              @default(false)      // TRUE when pullRate is derived from pool rather than directly measured

  @@unique([snapshotId, cardId])
}

model ThesisParameter {
  id                  String                  @id @default(cuid())
  snapshotId          String
  snapshot            ThesisSnapshot          @relation(fields: [snapshotId], references: [snapshotId])

  parameter           String                                       // "annual_appreciation_evo" | "psa9_realization_factor" | etc.
  value               String                                       // Stored as string to preserve original formatting
  valueNumeric        Float?                                       // Parsed numeric value where applicable
  category            String                                       // "appreciation" | "grading" | "fresh_pack" | "holding" | "misc"
  notes               String?

  @@unique([snapshotId, parameter])
  @@index([snapshotId, category])
}
```

### 3.2 Run the Migration

```bash
npx prisma generate
npx prisma db push
```

Do not write a migration file for this — the project uses `db push` throughout (per PRD-01 and PRD-05a). Verify in Prisma Studio that all eight new tables exist and are empty.

---

## 4. Snapshot Seed Pipeline

### 4.1 Seed Source

The seed is a single JSON file at `prisma/thesis-seed/snapshot_2026-04-22.json`. This file is derived from the master workbook (`pokemon_master_phase5c_repaired.xlsx`) and committed to the repository. It is treated as source-of-truth for the thesis data and should not be edited by hand after generation.

### 4.2 JSON Structure

```jsonc
{
  "snapshot": {
    "snapshotId": "snapshot_2026-04-22_T1530Z",
    "snapshotDate": "2026-04-22",
    "title": "April 22, 2026 base case",
    "isPrimary": true
  },
  "cards": [
    {
      "id": "evo_011_charizard_holo",
      "cardName": "Charizard",
      "setCode": "EVO",
      "setName": "XY Evolutions",
      "cardNumber": "11/108",
      "variant": "holo",
      "rarity": "Holo Rare",
      "releaseDate": "2016-11-02",
      "baseCardId": null,
      "displayOrder": 1
    }
    // ...13 entries total (10 EVO + 3 SV151), matching card_metadata_all tab
  ],
  "products": [
    {
      "id": "evo_booster_box",
      "productName": "XY Evolutions Booster Box",
      "setCode": "evolutions",
      "skuType": "booster_box",
      "packsPerUnit": 36,
      "releaseYear": 2016,
      "displayOrder": 1,
      "notes": "36-pack booster box, original English print"
    }
    // ...17 entries total, matching product_metadata_all tab
  ],
  "gemRates": [
    {
      "cardId": "evo_102_m_blastoise_ex_fa",
      "grader": "PSA",
      "totalGraded": 16493,
      "gemCount": 6125,
      "gemRate": 0.371369671982053,
      "qualifierCountExcluded": 47,
      "flag": "OK"
    }
    // ...all rows from calc_gem_rates tab
  ],
  "gradeGaps": [
    {
      "cardId": "evo_102_m_blastoise_ex_fa",
      "rank": 1,
      "rawPriceNm": 40.75,
      "psa10Price": 352.59,
      "psa9Price": 85.00,
      "psaGemRate": 0.371369671982053,
      "psaTotalGraded": 16493,
      "assumedGradingFee": 25,
      "grossEvNominal": 184.37481052567756,
      "netEvNominal": 118.62481052567756,
      "expectedMarginPctNominal": 2.9110382951086518,
      "grossEvAdjusted": 171.0164160552962,
      "netEvAdjusted": 105.26641605529619,
      "expectedMarginPctAdjusted": 2.583224933872299,
      "distributionProfile": "GEM_CONCENTRATED",
      "economicTier": "STRONG",
      "playType": "STEADY",
      "confidence": "OK",
      "nForReliability": 9,
      "capitalAtScale": 366.75,
      "scaleTier": "SMALL"
    }
    // ...13 entries, matching dash_grade_gap_ranking tab
  ],
  "sealedHolds": [
    {
      "productId": "evo_booster_box",
      "currentPriceUsd": 2005.57,
      "futureNetValue": 3004.324668139111,
      "totalReturnPct": 0.4979904307200004,
      "impliedCagr": 0.08418103920277908,
      "benchmarkComparison": "MATCHES_MARKET"
    }
    // ...17 entries, matching calc_sealed_hold_model tab
  ],
  "sealedRipGrades": [
    // ...17 entries, matching calc_sealed_rip_and_grade tab §3
  ],
  "packEvs": [
    // ...entries for each card with pack_ev, matching calc_pack_ev tab
  ],
  "parameters": [
    { "parameter": "annual_appreciation_evo", "value": "0.12", "valueNumeric": 0.12, "category": "appreciation", "notes": "Loose proxy from Evolutions price history 2016-2026" },
    { "parameter": "annual_appreciation_sv151", "value": "0.05", "valueNumeric": 0.05, "category": "appreciation", "notes": "Modern sets appreciate slower until rotation; conservative" },
    { "parameter": "holding_period_years", "value": "5", "valueNumeric": 5, "category": "holding", "notes": "Base-case holding period" },
    { "parameter": "transaction_cost_pct", "value": "0.15", "valueNumeric": 0.15, "category": "holding", "notes": "Combined eBay + PayPal + shipping on exit" },
    { "parameter": "psa9_realization_factor", "value": "0.75", "valueNumeric": 0.75, "category": "grading", "notes": "Haircut applied to PSA 9 payout leg; editable for stress-testing" },
    { "parameter": "fresh_pack_gem_multiplier_evo", "value": "10", "valueNumeric": 10, "category": "fresh_pack", "notes": "Freshly pulled cards gem at 10x historical market rate (capped at 80%)" },
    { "parameter": "fresh_pack_gem_multiplier_sv151", "value": "1.5", "valueNumeric": 1.5, "category": "fresh_pack", "notes": "More conservative multiplier for modern set" },
    { "parameter": "fresh_pack_gem_cap", "value": "0.80", "valueNumeric": 0.80, "category": "fresh_pack", "notes": "Ceiling on fresh-pack gem rate regardless of multiplier" }
  ]
}
```

The values shown are illustrative; the actual file is populated from the workbook tabs `card_metadata_all`, `product_metadata_all`, `calc_gem_rates`, `dash_grade_gap_ranking`, `calc_sealed_hold_model`, `calc_sealed_rip_and_grade`, `calc_pack_ev`, and `model_parameters`.

### 4.3 Seed Script

Create `prisma/seed-thesis.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import snapshotData from './thesis-seed/snapshot_2026-04-22.json';

const prisma = new PrismaClient();

async function seedThesis() {
  const { snapshot, cards, products, gemRates, gradeGaps, sealedHolds, sealedRipGrades, packEvs, parameters } = snapshotData;

  console.log(`Seeding thesis snapshot: ${snapshot.snapshotId}`);

  // Demote any existing primary snapshot so only one is flagged
  if (snapshot.isPrimary) {
    await prisma.thesisSnapshot.updateMany({
      where: { isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // Upsert snapshot
  await prisma.thesisSnapshot.upsert({
    where: { snapshotId: snapshot.snapshotId },
    create: {
      snapshotId: snapshot.snapshotId,
      snapshotDate: new Date(snapshot.snapshotDate),
      title: snapshot.title,
      isPrimary: snapshot.isPrimary,
    },
    update: {
      snapshotDate: new Date(snapshot.snapshotDate),
      title: snapshot.title,
      isPrimary: snapshot.isPrimary,
    },
  });

  // Upsert cards (idempotent — same card_id across snapshots)
  for (const card of cards) {
    await prisma.thesisCard.upsert({
      where: { id: card.id },
      create: { ...card, releaseDate: new Date(card.releaseDate) },
      update: { ...card, releaseDate: new Date(card.releaseDate) },
    });
  }

  // Upsert products (idempotent — same product_id across snapshots)
  for (const product of products) {
    await prisma.thesisSealedProduct.upsert({
      where: { id: product.id },
      create: product,
      update: product,
    });
  }

  // Per-snapshot rows — delete-then-insert by snapshotId to keep re-seeds clean
  await prisma.thesisGemRate.deleteMany({ where: { snapshotId: snapshot.snapshotId } });
  await prisma.thesisGradeGap.deleteMany({ where: { snapshotId: snapshot.snapshotId } });
  await prisma.thesisSealedHold.deleteMany({ where: { snapshotId: snapshot.snapshotId } });
  await prisma.thesisSealedRipGrade.deleteMany({ where: { snapshotId: snapshot.snapshotId } });
  await prisma.thesisPackEv.deleteMany({ where: { snapshotId: snapshot.snapshotId } });
  await prisma.thesisParameter.deleteMany({ where: { snapshotId: snapshot.snapshotId } });

  await prisma.thesisGemRate.createMany({
    data: gemRates.map((g) => ({ ...g, snapshotId: snapshot.snapshotId })),
  });
  await prisma.thesisGradeGap.createMany({
    data: gradeGaps.map((g) => ({ ...g, snapshotId: snapshot.snapshotId })),
  });
  await prisma.thesisSealedHold.createMany({
    data: sealedHolds.map((h) => ({ ...h, snapshotId: snapshot.snapshotId })),
  });
  await prisma.thesisSealedRipGrade.createMany({
    data: sealedRipGrades.map((r) => ({ ...r, snapshotId: snapshot.snapshotId })),
  });
  await prisma.thesisPackEv.createMany({
    data: packEvs.map((p) => ({ ...p, snapshotId: snapshot.snapshotId })),
  });
  await prisma.thesisParameter.createMany({
    data: parameters.map((p) => ({ ...p, snapshotId: snapshot.snapshotId })),
  });

  console.log(`Thesis snapshot seeded: ${cards.length} cards, ${products.length} products, ${gradeGaps.length} grade gap rows.`);
}

seedThesis()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Add to `package.json` scripts:

```json
"seed:thesis": "tsx prisma/seed-thesis.ts"
```

Run manually once: `npm run seed:thesis`. This is not part of the cron schedule — the thesis snapshot is fixed. When a future snapshot is added, commit a new JSON file, flip `isPrimary` appropriately, and re-run.

### 4.4 Query Functions

Create `src/lib/db/thesis-queries.ts`. All queries target the primary snapshot unless a specific `snapshotId` is provided. This keeps the UI decoupled from snapshot identity — it just asks for "the current thesis."

```typescript
import { prisma } from './prisma';

async function getPrimarySnapshotId(): Promise<string> {
  const primary = await prisma.thesisSnapshot.findFirst({
    where: { isPrimary: true },
    select: { snapshotId: true },
  });
  if (!primary) {
    throw new Error('No primary thesis snapshot found. Run `npm run seed:thesis`.');
  }
  return primary.snapshotId;
}

export async function getThesisSnapshot(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisSnapshot.findUnique({ where: { snapshotId: id } });
}

export async function getGradeGapRanking(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisGradeGap.findMany({
    where: { snapshotId: id },
    orderBy: { rank: 'asc' },
    include: { card: true },
  });
}

export async function getGemRates(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisGemRate.findMany({
    where: { snapshotId: id },
    include: { card: true },
  });
}

export async function getSealedHolds(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisSealedHold.findMany({
    where: { snapshotId: id },
    include: { product: true },
    orderBy: { product: { displayOrder: 'asc' } },
  });
}

export async function getSealedRipGrades(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisSealedRipGrade.findMany({
    where: { snapshotId: id },
    include: { product: true },
    orderBy: { product: { displayOrder: 'asc' } },
  });
}

export async function getPackEvs(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisPackEv.findMany({
    where: { snapshotId: id },
    include: { card: true },
  });
}

export async function getThesisParameters(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  return prisma.thesisParameter.findMany({
    where: { snapshotId: id },
    orderBy: { category: 'asc' },
  });
}

/** Single batched fetch for the dashboard page — avoids 7 round-trips. */
export async function getThesisDashboardBundle(snapshotId?: string) {
  const id = snapshotId ?? (await getPrimarySnapshotId());
  const [snapshot, gradeGaps, gemRates, sealedHolds, sealedRipGrades, packEvs, parameters] = await Promise.all([
    getThesisSnapshot(id),
    getGradeGapRanking(id),
    getGemRates(id),
    getSealedHolds(id),
    getSealedRipGrades(id),
    getPackEvs(id),
    getThesisParameters(id),
  ]);
  return { snapshot, gradeGaps, gemRates, sealedHolds, sealedRipGrades, packEvs, parameters };
}
```

The batched `getThesisDashboardBundle` is what the page-level server component uses — single Promise.all, one waterfall, follows the PRD-09 query batching pattern.

---

## 5. Route & Page Shell

### 5.1 Create the Route

```
src/app/thesis/
├── page.tsx              # Server component — fetches bundle, passes to client shell
├── ThesisShell.tsx       # Client component — hero + scrollspy + section containers
└── sections/
    ├── GradeGapSection.tsx        # Placeholder in 10a; PRD-10b builds content
    ├── MarketStructureSection.tsx # Placeholder in 10a; PRD-10c builds content
    ├── SealedSection.tsx          # Placeholder in 10a; PRD-10d builds content
    ├── RecommendationsSection.tsx # Placeholder in 10a; PRD-10e builds content
    └── CaveatsSection.tsx         # Placeholder in 10a; PRD-10e builds content
```

### 5.2 Page Entry Component

```typescript
// src/app/thesis/page.tsx
import { getThesisDashboardBundle } from '@/lib/db/thesis-queries';
import { ThesisShell } from './ThesisShell';

export const metadata = {
  title: 'Investment Thesis — The Vault',
  description:
    'A data-driven analysis of grade-gap and sealed product opportunities in XY Evolutions and Scarlet & Violet 151.',
};

export default async function ThesisPage() {
  const bundle = await getThesisDashboardBundle();
  if (!bundle.snapshot) {
    return (
      <div className="mx-auto max-w-3xl p-16 text-center">
        <h1 className="text-2xl font-[var(--font-display)]">Thesis snapshot not loaded.</h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">
          Run <code className="font-[var(--font-mono)]">npm run seed:thesis</code> to populate.
        </p>
      </div>
    );
  }
  return <ThesisShell bundle={bundle} />;
}
```

### 5.3 Shell Component

```typescript
// src/app/thesis/ThesisShell.tsx
'use client';

import { motion } from 'framer-motion';
import type { getThesisDashboardBundle } from '@/lib/db/thesis-queries';
import { ThesisHero } from '@/components/thesis/ThesisHero';
import { ThesisScrollspy } from '@/components/thesis/ThesisScrollspy';
import { GradeGapSection } from './sections/GradeGapSection';
import { MarketStructureSection } from './sections/MarketStructureSection';
import { SealedSection } from './sections/SealedSection';
import { RecommendationsSection } from './sections/RecommendationsSection';
import { CaveatsSection } from './sections/CaveatsSection';

type Bundle = Awaited<ReturnType<typeof getThesisDashboardBundle>>;

export function ThesisShell({ bundle }: { bundle: Bundle }) {
  return (
    <div
      className="thesis-page min-h-screen"
      style={
        {
          // Thesis uses its own accent — deep amber, echoing vault gold but analytical, not ornamental.
          '--color-accent': 'var(--color-thesis-accent)',
          '--color-accent-dim': 'var(--color-thesis-accent-dim)',
          '--color-accent-glow': 'var(--color-thesis-accent-glow)',
        } as React.CSSProperties
      }
    >
      <ThesisHero bundle={bundle} />

      <div className="mx-auto flex max-w-[1280px] gap-12 px-6 pb-32 pt-16 lg:px-10">
        <ThesisScrollspy />

        <motion.div
          className="flex-1 space-y-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <GradeGapSection bundle={bundle} />
          <MarketStructureSection bundle={bundle} />
          <SealedSection bundle={bundle} />
          <RecommendationsSection bundle={bundle} />
          <CaveatsSection bundle={bundle} />
        </motion.div>
      </div>
    </div>
  );
}
```

### 5.4 Placeholder Sections

Each section component in 10a is a minimal scaffold — it reserves the anchor, renders a section header, and notes the PRD that will fill its content:

```typescript
// src/app/thesis/sections/GradeGapSection.tsx
import type { getThesisDashboardBundle } from '@/lib/db/thesis-queries';

type Bundle = Awaited<ReturnType<typeof getThesisDashboardBundle>>;

export function GradeGapSection({ bundle }: { bundle: Bundle }) {
  return (
    <section id="grade-gap" className="scroll-mt-24">
      <header className="mb-8">
        <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
          §1
        </p>
        <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold">
          Grade-Gap Trading
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
          Grading raw Mega EX Full Arts from XY Evolutions produces adjusted margins of 200–260% per
          cycle. Ranked by expected margin with a PSA 9 realization haircut applied.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-[var(--color-border-default)] p-12 text-center text-[var(--color-text-tertiary)]">
        Content to be built in PRD-10b. {bundle.gradeGaps.length} grade-gap rows available in bundle.
      </div>
    </section>
  );
}
```

The other four sections follow the same pattern with section numbers §2–§5 and their respective descriptions. All placeholder sections read their relevant data from the bundle and show a row count, so that review during PRD-10a verifies the full data pipeline is working before any visualization code is written.

---

## 6. Navigation Integration

### 6.1 Add Thesis Link

In `src/components/ui/Navigation.tsx`, extend the `navLinks` array:

```typescript
const navLinks = [
  { href: '/', label: 'The Vault' },
  { href: '/collection', label: 'Collection' },
  { href: '/hunt', label: 'The Hunt' },
  { href: '/thesis', label: 'Thesis' },
];
```

No other changes to navigation styling. The existing active-state underline and hover behavior apply to the new link automatically.

### 6.2 Thesis Accent Token

The thesis dashboard uses its own accent color — deep amber — to signal analytical rigor without competing with any specific card's color. It's adjacent to the default vault gold but slightly warmer and darker.

Add to `src/app/globals.css` in the `:root` block, **after** the existing `--color-accent` declarations:

```css
/* ── Thesis Dashboard Accent (used only under /thesis/*) ── */
--color-thesis-accent: #d97706;       /* Deep amber */
--color-thesis-accent-dim: #d9770633;
--color-thesis-accent-glow: #d9770655;

/* Set badges used in thesis tables and charts */
--color-set-evo: #c9a84c;             /* Evolutions — echoes vault gold (nostalgia era) */
--color-set-sv151: #6366f1;           /* Scarlet & Violet 151 — indigo (modern era) */
```

The `--color-set-evo` and `--color-set-sv151` tokens are used throughout PRDs 10b–10e for set-coded chart fills, row highlights, and pill backgrounds. Defining them here keeps the color logic in the design system, not in component files.

---

## 7. Executive Summary Hero

### 7.1 Component: `src/components/thesis/ThesisHero.tsx`

The hero is the first thing an investor sees on `/thesis`. It has to state the thesis, stamp it with authorship and a snapshot date, and present the three headline numbers that anchor the rest of the page.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  INVESTMENT THESIS                         [small set pills]          │
│                                                                       │
│  Grade-Gap and Sealed Product Opportunities in                        │
│  XY Evolutions & Scarlet & Violet 151                                 │
│                                                                       │
│  Steven Nielsen  ·  Data snapshot: April 22, 2026                     │
│                                                                       │
│  ─────────────────────────────────────────────────────────            │
│                                                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐      │
│  │ ACTIVE TRADING   │ │  SEALED HOLD     │ │  RIP & GRADE     │      │
│  │ (top opportunity)│ │  (5yr CAGR, EVO) │ │  (best recovery) │      │
│  │                  │ │                  │ │                  │      │
│  │     258%         │ │     8.4%         │ │    NEGATIVE      │      │
│  │  adjusted margin │ │  annual CAGR     │ │    every SKU     │      │
│  │                  │ │                  │ │                  │      │
│  │ M Blastoise-EX   │ │ MATCHES_MARKET   │ │ 73% best-case    │      │
│  │ Full Art · EVO   │ │ at 12% appr.     │ │ recovery (EVO)   │      │
│  │                  │ │                  │ │                  │      │
│  │  Jump to §1 →    │ │  Jump to §3 →    │ │  Jump to §3 →    │      │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Hero Layout

**Outer container:** `max-w-[1280px]` centered, padding `pt-24 pb-16 px-6 lg:px-10`. Full-width background subtly tinted with `var(--color-bg-secondary)` and a hairline bottom border.

**Title block:**
- Eyebrow: `INVESTMENT THESIS` in mono, 11px, tracked, `var(--color-accent)`.
- Headline: two-line display in `font-[var(--font-display)]`, 40px on desktop, `text-[var(--color-text-primary)]`, leading-tight.
- Byline: `var(--color-text-secondary)`, 14px, with a middle-dot separator between author and snapshot date.
- Set pills top-right: two small rounded pills showing "XY EVOLUTIONS · 2016" and "SV151 · 2023" with set-coded backgrounds at 15% opacity and set-coded text.

**Stat cards (three):**
- Grid on `≥768px`, stacked on mobile.
- Card: `bg-[var(--color-bg-tertiary)]`, border `1px solid var(--color-border-default)`, rounded `12px`, padding `24px`.
- Label (top): mono, 11px, tracked, `var(--color-text-tertiary)`.
- Value (center): display font, 48px, bold. Use `var(--color-accent)` for the grade-gap number and `var(--color-positive)` for the sealed hold CAGR. The rip-and-grade card uses `var(--color-negative)` for the word "NEGATIVE" — investor-honest, not cheerful.
- Subtitle (below value): body 12px, `var(--color-text-secondary)`.
- Footer link: arrow with section anchor, mono 11px, accent color, underline on hover. Smooth-scrolls to the relevant section using `scrollIntoView({ behavior: 'smooth' })`.

### 7.3 Data Sourcing

The hero numbers are computed from the bundle — no hardcoded strings in the component. The component takes `bundle` as a prop and derives:

```typescript
const topGradeGap = bundle.gradeGaps[0]; // rank 1 — M Blastoise-EX Full Art
const topTradeMarginPct = Math.round(topGradeGap.expectedMarginPctAdjusted * 100);
const topTradeCardName = topGradeGap.card.cardName;
const topTradeSetCode = topGradeGap.card.setCode;

const evoHold = bundle.sealedHolds.find(h => h.product.setCode === 'evolutions');
const evoCagrPct = (evoHold?.impliedCagr ?? 0) * 100; // 8.4
const evoBenchmark = evoHold?.benchmarkComparison; // "MATCHES_MARKET"

const bestRipGrade = bundle.sealedRipGrades.reduce((best, current) =>
  current.productRoiPct > best.productRoiPct ? current : best
);
const bestRecoveryPct = Math.round((1 + bestRipGrade.productRoiPct) * 100); // 73
```

This keeps the hero truthful to whatever snapshot is primary. When a new snapshot is seeded, the hero updates automatically.

### 7.4 Entry Animation

Framer Motion:

```typescript
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
>
  {/* title block */}
</motion.div>

<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
  className="grid gap-4 md:grid-cols-3"
>
  {/* three stat cards, each with individual stagger via transition.delay: 0.25/0.35/0.45 */}
</motion.div>
```

Numbers inside the stat cards use `AnimatedCounter` (from PRD-01's existing component list) for a subtle count-up on mount over 900ms.

---

## 8. Scrollspy Section Navigation

### 8.1 Component: `src/components/thesis/ThesisScrollspy.tsx`

A sticky sidebar on the left of the content area. Shows the five section labels, highlights the one currently in view, and supports click-to-scroll.

```
§1  Grade-Gap         ← current section (accent text, accent bar on left edge)
§2  Market Structure
§3  Sealed Products
§4  Recommendations
§5  Caveats
```

### 8.2 Implementation

Use `IntersectionObserver` in a `useEffect`, tracked by a Zustand slice. Rationale: Zustand is already in the stack (per PRD-01 §2.6), and the scrollspy state may eventually be read by other components (e.g., a future print-view toggle that depends on which section is active).

Add to `src/lib/store/index.ts`:

```typescript
import { create } from 'zustand';

type ThesisSection = 'grade-gap' | 'market-structure' | 'sealed' | 'recommendations' | 'caveats';

interface ThesisStore {
  activeSection: ThesisSection;
  setActiveSection: (section: ThesisSection) => void;
}

export const useThesisStore = create<ThesisStore>((set) => ({
  activeSection: 'grade-gap',
  setActiveSection: (section) => set({ activeSection: section }),
}));
```

Scrollspy component:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useThesisStore } from '@/lib/store';

const sections = [
  { id: 'grade-gap', label: 'Grade-Gap', number: '§1' },
  { id: 'market-structure', label: 'Market Structure', number: '§2' },
  { id: 'sealed', label: 'Sealed Products', number: '§3' },
  { id: 'recommendations', label: 'Recommendations', number: '§4' },
  { id: 'caveats', label: 'Caveats', number: '§5' },
] as const;

export function ThesisScrollspy() {
  const { activeSection, setActiveSection } = useThesisStore();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      // Take the entry with the largest intersectionRatio that is currently intersecting
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        setActiveSection(visible.target.id as typeof sections[number]['id']);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      // Fire when section is in the top 40% of viewport — feels natural for long reads
      rootMargin: '-20% 0px -40% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [setActiveSection]);

  return (
    <nav
      aria-label="Thesis section navigation"
      className="sticky top-24 hidden h-fit w-[220px] shrink-0 lg:block"
    >
      <p className="mb-4 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        Sections
      </p>
      <ul className="space-y-1">
        {sections.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={cn(
                  'group relative flex items-baseline gap-3 rounded-md py-2 pl-4 pr-3 text-sm transition-colors',
                  isActive
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="thesis-scrollspy-bar"
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                  {s.number}
                </span>
                <span className="tracking-wide">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

The `layoutId="thesis-scrollspy-bar"` on the active indicator uses Framer Motion's layout animation to slide the accent bar smoothly between list items as the active section changes — same pattern as the data panel tabs from PRD-03b §2.1.

### 8.3 Mobile Scrollspy Alternative

On `<1024px`, the sidebar is hidden and a horizontal pill bar appears sticky under the nav:

```
┌─────────────────────────────────────────────────────┐
│  §1 Grade-Gap  §2 Structure  §3 Sealed  §4 Recs  §5 │
└─────────────────────────────────────────────────────┘
```

Same IntersectionObserver logic, different layout. Scrollable horizontally when the labels overflow. Active pill has accent-dim background.

---

## 9. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | **MODIFY** | Append 8 new Thesis models at end of file |
| `prisma/thesis-seed/snapshot_2026-04-22.json` | **CREATE** | Snapshot data derived from master workbook |
| `prisma/seed-thesis.ts` | **CREATE** | Seed script — upserts snapshot, cards, products; delete+insert per-snapshot rows |
| `package.json` | **MODIFY** | Add `"seed:thesis": "tsx prisma/seed-thesis.ts"` script |
| `src/lib/db/thesis-queries.ts` | **CREATE** | Query functions + `getThesisDashboardBundle` batched fetcher |
| `src/lib/store/index.ts` | **MODIFY** | Add `useThesisStore` slice for active section tracking |
| `src/app/globals.css` | **MODIFY** | Add thesis accent and set-coded tokens to `:root` |
| `src/components/ui/Navigation.tsx` | **MODIFY** | Add "Thesis" nav link |
| `src/app/thesis/page.tsx` | **CREATE** | Server component — fetches bundle, renders shell |
| `src/app/thesis/ThesisShell.tsx` | **CREATE** | Client shell — hero + scrollspy + section wrappers |
| `src/app/thesis/sections/GradeGapSection.tsx` | **CREATE** | Placeholder section (filled in PRD-10b) |
| `src/app/thesis/sections/MarketStructureSection.tsx` | **CREATE** | Placeholder section (filled in PRD-10c) |
| `src/app/thesis/sections/SealedSection.tsx` | **CREATE** | Placeholder section (filled in PRD-10d) |
| `src/app/thesis/sections/RecommendationsSection.tsx` | **CREATE** | Placeholder section (filled in PRD-10e) |
| `src/app/thesis/sections/CaveatsSection.tsx` | **CREATE** | Placeholder section (filled in PRD-10e) |
| `src/components/thesis/ThesisHero.tsx` | **CREATE** | Executive summary hero with 3 headline stat cards |
| `src/components/thesis/ThesisScrollspy.tsx` | **CREATE** | Sticky section navigation with IntersectionObserver |

---

## 10. Verification

```
□ prisma/schema.prisma contains 8 new Thesis* models
□ npx prisma generate succeeds with no errors
□ npx prisma db push creates all 8 tables in the database
□ prisma/thesis-seed/snapshot_2026-04-22.json exists and validates against the JSON structure in §4.2
□ Snapshot JSON contains 13 cards (10 EVO + 3 SV151)
□ Snapshot JSON contains 17 products (8 EVO + 9 SV151)
□ Snapshot JSON contains 13 gradeGaps, 17 sealedHolds, 17 sealedRipGrades, 8+ parameters
□ npm run seed:thesis completes successfully
□ Prisma Studio shows ThesisSnapshot with isPrimary=true
□ Prisma Studio shows 13 ThesisCard rows
□ Prisma Studio shows 17 ThesisSealedProduct rows
□ Prisma Studio shows 13 ThesisGradeGap rows with rank 1 = M Blastoise-EX Full Art
□ Prisma Studio shows 17 ThesisSealedHold rows, 8 with MATCHES_MARKET, 9 with UNDERPERFORMS
□ Prisma Studio shows 17 ThesisSealedRipGrade rows, all with arbitrageFlag = UNATTRACTIVE
□ Re-running npm run seed:thesis is idempotent (row counts unchanged)
□ Navigating to /thesis renders the page without errors
□ "Thesis" link appears in main nav and routes to /thesis
□ Nav link shows active state underline when on /thesis
□ Hero renders title, byline, set pills, and three stat cards
□ Stat card 1 shows 258% adj. margin and "M Blastoise-EX Full Art · EVO"
□ Stat card 2 shows 8.4% CAGR and "MATCHES_MARKET at 12% appr."
□ Stat card 3 shows "NEGATIVE every SKU" and "73% best-case recovery (EVO)"
□ Stat cards animate in with staggered fade+slide on mount
□ Numbers in stat cards count up smoothly via AnimatedCounter
□ Clicking "Jump to §1 →" smooth-scrolls to the Grade-Gap section
□ Scrollspy sidebar is visible on ≥1024px viewports
□ Scrollspy hidden on <1024px; horizontal pill bar appears instead
□ Scrolling through sections updates the active scrollspy item
□ Accent bar slides between scrollspy items with layoutId animation
□ Clicking a scrollspy item scrolls to the corresponding section
□ All 5 placeholder sections render with section number, title, and bundle row-count confirmation
□ Page uses thesis amber accent, not vault gold; main portfolio pages still use gold
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 11. Notes for Downstream PRDs

PRD-10b through 10e will build into the five placeholder sections. The bundle fetched in `page.tsx` contains everything those downstream PRDs need — no section-level data fetching required. If a downstream PRD discovers a missing field, the fix goes here in the seed JSON and the query bundle, not in an ad-hoc fetch inside the section component.

The thesis universe is deliberately walled off from the main portfolio. Do not add cross-references from the `Card` model to `ThesisCard`, even if it seems tempting (e.g., "the Charizard in thesis data could link to a `Card` row"). The two models describe different things — the main portfolio is personal holdings; the thesis is analytical universe. Coupling them creates ambiguity about which dataset drives which UI and makes future snapshot updates riskier.

The `psa9_realization_factor` parameter is the one value designed to become interactive in PRD-10b. Keep it stored normally; the interactivity is client-side math on the grade-gap rows, not a re-seed.

---

**→ Continue to PRD-10b for Grade-Gap Trading Analysis (ranking table, scatter plot, play-type matrix, capital-at-scale bars, interactive PSA 9 haircut slider).**
