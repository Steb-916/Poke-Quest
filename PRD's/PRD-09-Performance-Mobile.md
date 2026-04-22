# PRD-09: Performance & Mobile

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 09 (Optimization)  
**Depends on:** PRD-08 complete, all pages functional with animations

---

## 1. Overview

The site currently works on desktop. It does not work well on phones. The navigation has no mobile state. The Portfolio Header strip crams three items onto a line that doesn't fit below 768px. The card tilt responds to mouse events only — touch does nothing. The Three.js vault door, Recharts, and D3 all ship in the main bundle whether or not they're needed on the current page. This PRD fixes all of it.

Four workstreams:

| Workstream | Goal |
|------------|------|
| Bundle optimization | Cut initial JS payload by 40%+ |
| Image optimization | Every image uses correct sizes, priority, and format |
| Mobile responsiveness | Every page usable and polished at 375px width |
| Touch interactions | Card tilt works on touch devices |

### 1.1 Performance Budget

Target Lighthouse scores after this PRD (measured on mobile, simulated 4G):

| Metric | Target |
|--------|--------|
| Performance | ≥85 |
| Accessibility | ≥95 |
| Best Practices | ≥95 |
| SEO | ≥90 |
| LCP | <2.5s |
| FID/INP | <200ms |
| CLS | <0.1 |

---

## 2. Bundle Optimization

### 2.1 Current Problem

Three heavy dependency clusters ship together:

| Cluster | Approx. Size (gzipped) | Used On |
|---------|----------------------|---------|
| three + @react-three/* + postprocessing | ~180kb | Home page only (vault door) |
| recharts | ~50kb | Card detail page, home page |
| d3 | ~35kb | Card detail page (Aurora) |
| gsap + ScrollTrigger | ~25kb | Home page only (parallax) |

A visitor landing on the Hunt page downloads all four clusters even though the Hunt page uses none of them.

### 2.2 Strategy: Dynamic Imports

Every heavy visualization component gets wrapped in `next/dynamic` with `ssr: false`. The component only downloads when the page that uses it mounts.

**Vault Door (already dynamic — verify):**

PRD-02a specifies `next/dynamic` with `ssr: false` for VaultOverlay. Verify this is implemented. If the import is a regular `import` instead of `dynamic()`, fix it:

```typescript
// src/app/page.tsx
import dynamic from 'next/dynamic';

const VaultOverlay = dynamic(
  () => import('@/components/three/VaultOverlay').then((m) => m.VaultOverlay),
  { ssr: false }
);
```

**Recharts components:**

Wrap all Recharts-dependent components in dynamic imports at the page level:

```typescript
// src/app/card/[slug]/page.tsx
const PriceHistory = dynamic(
  () => import('@/components/charts/PriceHistory').then((m) => m.PriceHistory),
  { ssr: false, loading: () => <DataPanelsSkeleton /> }
);

// src/app/page.tsx
const PortfolioValueChart = dynamic(
  () => import('@/components/charts/PortfolioValueChart').then((m) => m.PortfolioValueChart),
  { ssr: false, loading: () => <PortfolioValueSkeleton /> }
);

const MarketMovers = dynamic(
  () => import('@/components/charts/MarketMovers').then((m) => m.MarketMovers),
  { ssr: false, loading: () => <Skeleton variant="rect" className="h-[400px]" /> }
);
```

**D3 components (RarityAurora):**

```typescript
const RarityAurora = dynamic(
  () => import('@/components/charts/RarityAurora').then((m) => m.RarityAurora),
  { ssr: false, loading: () => <Skeleton variant="rect" className="h-[240px] rounded-full" /> }
);
```

**GSAP (HomeParallax):**

```typescript
const HomeParallax = dynamic(
  () => import('@/components/sections/HomeParallax').then((m) => m.HomeParallax),
  { ssr: false }
);
```

### 2.3 Verification: Bundle Analysis

After implementing dynamic imports, run the Next.js bundle analyzer to confirm the chunks split correctly:

```bash
# Install if not present
npm install -D @next/bundle-analyzer

# Add to next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# });
# export default withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

Confirm that:
- `three` and `@react-three/*` are in their own chunk, only loaded on home page
- `recharts` is in its own chunk, only loaded on pages with charts
- `d3` is in its own chunk, only loaded on card detail page
- `gsap` is in its own chunk, only loaded on home page

### 2.4 Tree-Shaking: D3

D3 is modular. If only `d3-shape` and `d3-arc` are used (for the Aurora rings), replace the full `d3` import:

```typescript
// BEFORE (imports entire d3 library):
import * as d3 from 'd3';

// AFTER (imports only what's needed):
import { arc, pie } from 'd3-shape';
import { scaleLinear } from 'd3-scale';
```

Check every file that imports from `d3` and narrow to specific sub-modules. This can cut 20kb+ from the D3 chunk.

### 2.5 Tree-Shaking: Recharts

Recharts doesn't tree-shake well from the barrel export. Use direct component imports:

```typescript
// BEFORE:
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// AFTER (same, but verify no unused imports):
// Recharts doesn't support deep imports per-component,
// so the barrel import is unavoidable. But ensure no unused
// components are imported (e.g., don't import BarChart if only using LineChart).
```

Remove any Recharts component imports that aren't actually rendered.

---

## 3. Image Optimization

### 3.1 Audit: Card Images

All 15 card images come from pokemontcg.io CDN. Each is ~734×1024px. The Next.js `<Image>` component handles format conversion (WebP) and resizing, but only if `sizes` is set correctly.

**Home page card grid:**

```typescript
// Cards are displayed at roughly:
// Desktop (3-col): ~350px wide
// Tablet (2-col): ~450px wide
// Mobile (1-col): ~100% viewport width, max ~375px

<Image
  src={card.imageUrl}
  alt={card.name}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority={index < 6}  // First 2 rows above the fold
/>
```

Verify every card `<Image>` in `CardTilt.tsx` has:
- `sizes` set to the responsive breakpoints above
- `priority={true}` for `index < 6` (first 6 cards)
- `priority={false}` for `index >= 6` (lazy loaded)

**Card detail page slab viewer:**

```typescript
// Slab image is displayed at roughly:
// Desktop: ~400px wide (left column of 2-col grid)
// Mobile: ~100% viewport width

<Image
  src={card.imageUrl}
  alt={card.name}
  fill
  sizes="(max-width: 1024px) 100vw, 400px"
  priority  // Always above the fold on the detail page
/>
```

**Hunt page cards:**

```typescript
// Similar to home page but smaller cards
<Image
  src={card.imageUrl}
  alt={card.name}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority={index < 3}  // First row only
/>
```

### 3.2 Remote Image Configuration

Verify `next.config.ts` has the correct remote pattern for pokemontcg.io:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.pokemontcg.io',
      pathname: '/**',
    },
  ],
},
```

### 3.3 Placeholder Blur

For cards below the fold, add a low-quality blur placeholder. Since the images are remote, use `placeholder="blur"` with a `blurDataURL` generated at build time. For simplicity, use a shared tiny base64 placeholder that matches the dark site theme:

```typescript
// A 1×1 dark pixel as base64
const DARK_BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

<Image
  src={card.imageUrl}
  alt={card.name}
  fill
  sizes="..."
  placeholder="blur"
  blurDataURL={DARK_BLUR}
/>
```

This prevents layout shift (CLS) by reserving space with a dark placeholder before the image loads.

---

## 4. Mobile Navigation

### 4.1 Current Problem

The desktop navigation shows "THE VAULT" on the left and "The Hunt" on the right. On mobile, these still fit, but the Portfolio Header strip below the nav crams three items (portfolio value, card count, hunt progress bar) onto a single line that overflows below ~480px.

### 4.2 Mobile Nav: No Hamburger

The site has only 2 navigation links (The Vault, The Hunt). A hamburger menu for 2 links is overkill and hides the navigation unnecessarily. Keep the nav visible on all screen sizes. Adjustments for mobile:

**Navigation (`<768px`):**
- Reduce horizontal padding: `px-4` instead of `px-6`
- "THE VAULT" logo text: reduce to `text-sm` from `text-base`
- "The Hunt" link: stays as-is, already `text-sm`
- Remove portfolio value from the nav (it lives in PortfolioHeader anyway)

```typescript
// In Navigation.tsx, hide the portfolio value on mobile:
<div className="hidden md:block font-[var(--font-mono)] text-sm ...">
  ${dollars}<span>{cents}</span>
</div>
```

### 4.3 Portfolio Header Strip: Mobile Layout

The 3-item horizontal strip needs to stack or simplify on mobile.

**≥768px (current behavior):** All three items on one line — portfolio value (left), card count (center), hunt progress (right).

**<768px:** Two-row compact layout:

```
┌──────────────────────────────┐
│  $47,850.99       4/15 BL ██ │
└──────────────────────────────┘
```

- Remove "15 Cards" (obvious from the grid below)
- Portfolio value on the left, hunt progress on the right
- Same 48px height, tighter padding

```typescript
// In PortfolioHeader.tsx:
<div className="flex items-center justify-between h-12 px-4 md:px-8">
  {/* Portfolio Value — always visible */}
  <div className="font-[var(--font-mono)] text-base md:text-lg">
    <span className="text-[var(--color-text-primary)]">${dollars}</span>
    <span className="text-[var(--color-text-tertiary)]">{cents}</span>
  </div>

  {/* Card Count — hidden on mobile */}
  <div className="hidden md:block text-sm text-[var(--color-text-secondary)]">
    {cardCount} Cards
  </div>

  {/* Hunt Progress — always visible, compact on mobile */}
  <div className="flex items-center gap-2 md:gap-3">
    <span className="text-xs md:text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
      {blackLabelsAcquired}/{blackLabelsTotal}
    </span>
    <div className="w-16 md:w-24 h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--color-accent)] rounded-full"
        style={{ width: `${(blackLabelsAcquired / blackLabelsTotal) * 100}%` }}
      />
    </div>
    <span className="hidden md:inline text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
      Black Labels
    </span>
  </div>
</div>
```

---

## 5. Page-by-Page Mobile Responsiveness

### 5.1 Home Page

**Already responsive:** Card grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. ✅

**Needs fixing:**

**EraContext badge (`<768px`):**
- The pill + text currently sit on one line. On narrow screens, wrap the text below the pill:

```typescript
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs">
```

**Portfolio Value chart (`<768px`):**
- Chart header: stack value above change line instead of inline
- Chart height: reduce from 220px to 160px
- Time range pills: ensure they don't overflow — use `flex-wrap` and smaller pills on mobile

```typescript
<div className="flex flex-wrap gap-1.5 md:gap-2">
  {timeRanges.map((range) => (
    <button className="press-scale px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs ...">
      {range}
    </button>
  ))}
</div>
```

**Market Pulse section (`<768px`):**
- Already stacks panels vertically per PRD-07a. ✅
- Market Movers and Supply Signals: reduce row padding, font sizes
- Supply Signals: remove the `max-h-[480px]` internal scroll on mobile — show all 15 cards full-height since the panel is full-width

**Scarcity Spectrum (`<768px`):**
- The horizontal bar with 15 positioned markers doesn't work on a 375px screen.
- Mobile alternative: switch to a vertical list layout on `<768px`:

```
┌──────────────────────────────┐
│  SCARCITY SPECTRUM            │
│                               │
│  ◆ Tyranitar V        Pop: 0  │  MYTHIC
│  ◆ Machamp V          Pop: 2  │  ULTRA
│  ◆ Aerodactyl V       Pop: 3  │  ULTRA
│  ○ Espeon V           Pop: 8  │  RARE
│  ...                          │
└──────────────────────────────┘
```

```typescript
{/* Desktop: horizontal spectrum bar */}
<div className="hidden md:block">
  <SpectrumBar entries={entries} />
</div>

{/* Mobile: vertical list */}
<div className="md:hidden">
  <SpectrumList entries={entries} />
</div>
```

### 5.2 Card Detail Page

**Already responsive:** Two-column hero stacks to single column at `<1024px` per PRD-03c. ✅

**Needs fixing:**

**Slab viewer (`<768px`):**
- Slab max-width: cap at `min(100%, 360px)` and center. The slab shouldn't stretch full-width on mobile — it looks distorted.

```typescript
<div className="w-full max-w-[360px] mx-auto lg:max-w-none lg:mx-0">
  <SlabViewer card={card} />
</div>
```

**Grader tabs (`<768px`):**
- 5 tabs (RAW/PSA/BGS/CGC/SGC) may overflow on narrow screens.
- Use horizontal scroll with hidden scrollbar:

```typescript
<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2">
  {GRADERS.map((grader) => (
    <button key={grader} className="flex-shrink-0 press-scale ...">
      {grader}
    </button>
  ))}
</div>
```

Add to `globals.css`:

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

**Data panel tab bar (`<768px`):**
- Same horizontal scroll treatment if tabs overflow:

```typescript
<div className="flex gap-4 overflow-x-auto scrollbar-hide">
```

**CardIdentity market snapshot (`<768px`):**
- The price grid can stay as-is (label + price per row). Just ensure padding is reduced: `px-4` instead of `px-6`.

**Card Radar chart (`<768px`):**
- Reduce size from 200×200 to 160×160
- Move from beside CardIdentity to below it (already happens naturally in single-column layout)

### 5.3 Hunt Page

**Already responsive:** Grid uses 3/2/1 columns at breakpoints per PRD-04a. ✅

**Needs fixing:**

**Progress ring + stats (`<768px`):**
- Already stacks (ring above stats) per PRD-04a. ✅
- Center the ring on mobile: `mx-auto`
- Stats summary: reduce to 2-column grid instead of 4 items in a row

```typescript
<div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:gap-3">
```

**Hunt card edit button (`<768px`):**
- Currently appears on hover. On mobile (no hover), it needs to always be visible:

```typescript
<button className={cn(
  'absolute top-2 left-2 w-7 h-7 rounded-full ...',
  'opacity-0 group-hover:opacity-100', // Desktop: show on hover
  'md:opacity-0 md:group-hover:opacity-100', // Desktop: hide then show
  'opacity-70' // Mobile: always visible at reduced opacity
)}>
```

Wait — this conflicts. Use a cleaner approach:

```typescript
<button className="absolute top-2 left-2 w-7 h-7 rounded-full opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity ...">
```

Mobile: always visible at 70% opacity. Desktop: hidden, 100% on hover.

**Ownership drawer (`<768px`):**
- Already specified as full-width on mobile in PRD-04b. ✅ Verify.

### 5.4 Admin Page

No mobile optimization needed. The admin page is for you only, used on desktop. Skip.

---

## 6. Touch Interactions for Card Tilt

### 6.1 Current Problem

The `useCardTilt` hook in `src/hooks/useCardTilt.ts` responds to `mouseenter`, `mousemove`, and `mouseleave` events. On touch devices, these don't fire (or fire unreliably). The card tilt simply doesn't work on phones.

### 6.2 Strategy

Add touch event handling alongside mouse events. On touch:
- `touchstart` → equivalent to `mouseenter` (begin tracking)
- `touchmove` → equivalent to `mousemove` (update tilt based on touch position)
- `touchend` → equivalent to `mouseleave` (reset tilt)

The key difference: on mobile, a single-finger touch-and-drag on a card should tilt it, but a tap (touch without significant movement) should still navigate to the card detail page. So we need to distinguish between a "tilt gesture" and a "tap to navigate."

### 6.3 Implementation

Update `src/hooks/useCardTilt.ts`:

```typescript
// Add touch handlers alongside existing mouse handlers

const touchStartRef = useRef<{ x: number; y: number } | null>(null);
const isTiltingRef = useRef(false);

const onTouchStart = useCallback((e: TouchEvent) => {
  const touch = e.touches[0];
  touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  isTiltingRef.current = false;
  setIsHovering(true);
}, []);

const onTouchMove = useCallback((e: TouchEvent) => {
  if (!cardRef.current || !touchStartRef.current) return;

  const touch = e.touches[0];
  const rect = cardRef.current.getBoundingClientRect();

  // Check if touch has moved enough to be a "tilt" vs a "tap"
  const dx = touch.clientX - touchStartRef.current.x;
  const dy = touch.clientY - touchStartRef.current.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 5) {
    isTiltingRef.current = true;
    e.preventDefault(); // Prevent scroll while tilting
  }

  if (!isTiltingRef.current) return;

  // Same position calculation as mouse handler
  const x = (touch.clientX - rect.left) / rect.width;
  const y = (touch.clientY - rect.top) / rect.height;

  const centerX = x - 0.5;
  const centerY = y - 0.5;

  setTiltX(-centerY * maxTilt);
  setTiltY(centerX * maxTilt);
  setMouseXPercent(x * 100);
  setMouseYPercent(y * 100);
}, [cardRef, maxTilt]);

const onTouchEnd = useCallback(() => {
  setIsHovering(false);
  setTiltX(0);
  setTiltY(0);
  setMouseXPercent(50);
  setMouseYPercent(50);
  touchStartRef.current = null;
  isTiltingRef.current = false;
}, []);
```

### 6.4 Gesture vs Navigation

The `CardTilt` component wraps content in a `<Link>`. The touch interaction needs to:
- Allow taps (short touch, minimal movement) to navigate via the `<Link>`
- Prevent navigation when the user is doing a tilt gesture (touch with drag)

This is handled by the `isTiltingRef` flag. If the user moves more than 5px during touch, we set `isTiltingRef = true` and call `e.preventDefault()` to stop scroll. On `touchend`, if `isTiltingRef` is true, we can prevent the click event from firing:

```typescript
const onTouchEnd = useCallback((e: TouchEvent) => {
  if (isTiltingRef.current) {
    // User was tilting, not tapping — prevent the Link navigation
    e.preventDefault();
  }
  // ... reset state
}, []);
```

### 6.5 Attach Touch Listeners

In the hook's `useEffect`, attach touch listeners alongside mouse listeners. Use `{ passive: false }` for `touchmove` so `preventDefault()` works:

```typescript
useEffect(() => {
  const el = cardRef.current;
  if (!el) return;

  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  };
}, [onTouchStart, onTouchMove, onTouchEnd]);
```

### 6.6 Reduced Tilt on Mobile

Mobile screens are small. The full 8° tilt that looks subtle on a 1400px desktop monitor looks dramatic on a 375px phone. Reduce max tilt on mobile:

```typescript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const effectiveMaxTilt = isMobile ? 5 : (config?.maxTilt ?? 8);
```

### 6.7 Slab Viewer Touch

The slab viewer on the card detail page also uses `useCardTilt`. The same touch handlers apply automatically since they're in the shared hook. The slab's `maxTilt: 6` becomes `4` on mobile via the same reduction logic.

---

## 7. Lighthouse Audit Checklist

### 7.1 Performance Fixes

Run after bundle optimization and image fixes:

```bash
npx next build
npx next start
# Open Chrome DevTools → Lighthouse → Mobile → Performance
```

**Common issues to check and fix:**

| Issue | Fix |
|-------|-----|
| Render-blocking CSS | Tailwind is already utility-first. Verify no external CSS blocking render. |
| Unused JavaScript | Dynamic imports (Section 2) should fix this. Verify with Coverage tab. |
| Large LCP element | If LCP is the first card image, ensure `priority={true}` is set. |
| CLS from images | The `blurDataURL` placeholder (Section 3.3) reserves space. Verify all images have `fill` + parent has `aspect-ratio`. |
| Long tasks | The vault door Three.js init is a long task. Since it's dynamic-imported and only runs once, this is acceptable. Verify it doesn't block LCP. |
| Font loading | Google Fonts with `display: swap` (already set in PRD-01). Verify with `font-display: swap` in the loaded fonts. |

### 7.2 Accessibility Fixes

| Issue | Fix |
|-------|-----|
| Color contrast | Verify `var(--color-text-secondary)` (#8a8a9a) against `var(--color-bg-primary)` (#06060b). WCAG AA requires 4.5:1. `#8a8a9a` on `#06060b` = ~6.2:1 ✅ |
| Color contrast | Verify `var(--color-text-tertiary)` (#4a4a5a) against `var(--color-bg-primary)` (#06060b). `#4a4a5a` on `#06060b` = ~3.0:1 ❌ — this fails AA for normal text. For tertiary labels, this is acceptable only if they're ≥14px bold or ≥18px. Audit and increase any tertiary text that's below these sizes to `var(--color-text-secondary)` instead. |
| Alt text | Every card `<Image>` must have `alt={card.name}`. Verify. |
| Focus indicators | Verify focus-visible rings on all interactive elements (links, buttons, tabs). The ring should be `var(--color-accent)`. |
| Skip navigation | Add a visually-hidden "Skip to content" link as the first focusable element. |
| ARIA labels | Tab bars should have `role="tablist"`, individual tabs `role="tab"`, active tab `aria-selected="true"`. |
| Landmark regions | Verify `<nav>`, `<main>`, and `<footer>` (if footer exists) are present. |

### 7.3 Skip Navigation Link

Add to `src/app/layout.tsx`, as the first child inside `<body>`:

```typescript
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-black focus:rounded focus:text-sm focus:font-medium"
>
  Skip to content
</a>
```

Add `id="main-content"` to the `<main>` element (or the `PageTransition` wrapper).

### 7.4 SEO Fixes

| Issue | Fix |
|-------|-----|
| Meta description | Already set in PRD-01 root layout. ✅ |
| Page titles | Each page should have a unique `<title>`. Add `metadata` exports to each page. |
| OG tags | Covered in PRD-10 (deployment). Skip for now. |
| Robots | Allow all by default. No `robots.txt` changes needed. |

**Page-specific titles:**

```typescript
// src/app/page.tsx
export const metadata = {
  title: 'The Vault — Pokémon Card Portfolio',
};

// src/app/card/[slug]/page.tsx
export async function generateMetadata({ params }: Props) {
  const card = await getCardBySlug(params.slug);
  return {
    title: `${card?.name} — The Vault`,
    description: `${card?.name} from ${card?.set}. Price history, pop reports, and graded sales.`,
  };
}

// src/app/hunt/page.tsx
export const metadata = {
  title: 'The Hunt — Black Label Quest',
  description: 'Tracking progress toward BGS Black Label 10 of all 15 SWSH alt art cards.',
};
```

---

## 8. Database Query Performance

### 8.1 Problem

Several queries in `queries.ts` loop over all 15 cards and make individual queries per card (e.g., `getRadarChartData`, `getLatestPricesForAllCards`, `getBlackLabelPops`). On Neon's free tier with cold starts, each query adds ~50-100ms of latency. 15 sequential queries = 750ms-1.5s.

### 8.2 Fix: Batch Queries

Replace the per-card loop pattern with batched Prisma queries:

```typescript
// BEFORE (15 sequential queries):
export async function getLatestPricesForAllCards() {
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

// AFTER (2 queries total):
export async function getLatestPricesForAllCards() {
  // Get the most recent snapshot date per card in one query
  const latestDates = await prisma.$queryRaw`
    SELECT DISTINCT ON ("cardId") "cardId", "id", "date",
           "rawLow", "rawMid", "rawHigh", "rawMarket",
           "psa10", "psa9", "bgs10Pristine", "bgs10BlackLabel",
           "bgs95", "cgc10Perfect", "cgc10Pristine", "cgc95"
    FROM "PriceSnapshot"
    ORDER BY "cardId", "date" DESC
  `;

  const map = new Map();
  for (const row of latestDates as any[]) {
    map.set(row.cardId, row);
  }
  return map;
}
```

Apply the same pattern to:
- `getPricesAtDaysAgo()` — use `DISTINCT ON` with a date filter
- `getBlackLabelPops()` — use `DISTINCT ON` filtered to grader = 'BGS'
- `getRadarChartData()` — combine into fewer raw queries instead of 5 loops × 15 cards

### 8.3 Connection Pooling

Neon's serverless driver handles connection pooling automatically via their HTTP adapter. Verify that `prisma.ts` uses the Neon adapter if deployed to Vercel serverless:

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Note:** This is optional for now — the standard Prisma client works fine for development and even for Vercel deployment. The Neon adapter becomes important under higher load. Add it during PRD-10 deployment if cold start latency is an issue.

---

## 9. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCardTilt.ts` | **MODIFY** | Add touch event handlers, mobile tilt reduction |
| `src/components/ui/Navigation.tsx` | **MODIFY** | Hide portfolio value on mobile, tighten padding |
| `src/components/ui/PortfolioHeader.tsx` | **MODIFY** | Two-item mobile layout, hide card count |
| `src/components/charts/ScarcitySpectrum.tsx` | **MODIFY** | Add mobile vertical list alternative |
| `src/app/page.tsx` | **MODIFY** | Dynamic imports for heavy components, Suspense wrappers |
| `src/app/card/[slug]/page.tsx` | **MODIFY** | Dynamic imports, generateMetadata, slab max-width |
| `src/app/hunt/page.tsx` | **MODIFY** | Mobile hunt card edit visibility, metadata |
| `src/app/layout.tsx` | **MODIFY** | Skip navigation link, main-content id |
| `src/app/globals.css` | **MODIFY** | Add scrollbar-hide utility |
| `src/components/cards/CardTilt.tsx` | **MODIFY** | Verify image sizes/priority, touch gesture guard |
| `src/components/cards/SlabViewer.tsx` | **MODIFY** | Mobile max-width, horizontal scroll for grader tabs |
| `src/components/cards/DataPanels.tsx` | **MODIFY** | Horizontal scroll for tab bar on mobile |
| `src/components/hunt/HuntCard.tsx` | **MODIFY** | Always-visible edit button on mobile |
| `src/components/charts/PriceHistory.tsx` | **MODIFY** | Flex-wrap on time range pills |
| `src/components/charts/PortfolioValueChart.tsx` | **MODIFY** | Reduced chart height on mobile |
| `src/components/charts/MarketMovers.tsx` | **MODIFY** | Tighter padding on mobile rows |
| `src/components/charts/SupplySignals.tsx` | **MODIFY** | Remove internal scroll on mobile |
| `src/lib/db/queries.ts` | **MODIFY** | Batch queries with DISTINCT ON |
| `src/components/ui/EraContext.tsx` | **MODIFY** | Flex-wrap on mobile |
| `next.config.ts` | **MODIFY** | Add bundle analyzer config (dev only) |

---

## 10. Verification

```
□ Bundle: three.js chunk loads only on home page (verify with Network tab)
□ Bundle: recharts chunk loads only on pages with charts
□ Bundle: d3 chunk loads only on card detail page
□ Bundle: ANALYZE=true build shows separated chunks
□ Images: First 6 cards on home page load eagerly (priority)
□ Images: Cards 7-15 lazy load as user scrolls
□ Images: Card detail slab image loads eagerly (priority)
□ Images: blurDataURL placeholder visible before image loads
□ Mobile nav: Portfolio value hidden below 768px
□ Mobile nav: Nav links visible and tappable on 375px screen
□ Mobile: Portfolio Header shows value + hunt progress only (no card count)
□ Mobile: EraContext badge wraps text below pill on narrow screens
□ Mobile: Portfolio Value chart reduced height, pills wrap
□ Mobile: Card grid shows 1 column on phone, 2 on tablet
□ Mobile: Market Movers/Supply Signals stack vertically
□ Mobile: Scarcity Spectrum shows vertical list below 768px
□ Mobile: Card detail slab viewer max-width 360px, centered
□ Mobile: Grader tabs horizontally scroll if overflow
□ Mobile: Data panel tabs horizontally scroll if overflow
□ Mobile: Hunt card edit button always visible (70% opacity)
□ Mobile: Ownership drawer is full-width
□ Touch: Card tilt responds to touch-and-drag on mobile
□ Touch: Tap (no drag) still navigates to card detail
□ Touch: Tilt gesture prevents scroll while active
□ Touch: Max tilt reduced to 5° on mobile (from 8° desktop)
□ Touch: Slab viewer tilt works on touch
□ Accessibility: Skip navigation link visible on focus
□ Accessibility: All images have alt text
□ Accessibility: Tertiary text at small sizes upgraded to secondary
□ Accessibility: Tab bars have proper ARIA roles
□ SEO: Each page has unique <title>
□ SEO: Card detail pages have dynamic metadata
□ DB: Batch queries replace per-card loops (verify query count in logs)
□ Lighthouse mobile: Performance ≥85
□ Lighthouse mobile: Accessibility ≥95
□ Lighthouse mobile: Best Practices ≥95
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 11. What Comes Next

| PRD | Focus |
|-----|-------|
| **10** | Deployment — Vercel production config, environment variables, cron activation, custom domain, OG images, error monitoring, README, initial production data seeding |
