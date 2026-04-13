# PRD-02a: Vault Door Animation & Home Page Structure

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 02a of 2 (Vault Door + Home Page Layout)  
**Depends on:** PRD-01a and PRD-01b fully complete and verified

---

## 1. Overview

This PRD builds the first visual experience: a vault door opening animation that plays once per browser session, followed by the home page which serves as the primary collection view — a 5×3 grid of all 15 raw card images with hover tilt effects. Clicking a card navigates to its detail page.

### 1.1 Route Changes from PRD-01

The original `/collection` route is no longer a separate page. The home page (`/`) IS the collection.

- **DELETE** `src/app/collection/page.tsx`
- **CREATE** `src/app/collection/route.ts` — a redirect from `/collection` to `/` so no dead links exist
- **UPDATE** `src/components/ui/Navigation.tsx` — remove the "Collection" link, keep "The Vault" (home) and "The Hunt"
- The nav now has: **The Vault** (left, logo/home link) | **The Hunt** (right, next to portfolio value)

---

## 2. Vault Door Animation

### 2.1 Concept

A full-screen overlay that plays once when the user first visits in a browser session. It's a front-facing circular bank vault door rendered in Three.js. The animation sequence:

1. **Fade in** (0.0s–0.5s) — Scene fades from pure black to reveal the vault door, centered on screen. Subtle ambient particles (dust motes) float in the dark space.
2. **Wheel spin** (0.5s–2.0s) — The vault handle/wheel rotates 720° (two full turns). Metallic sound cues would go here if we add audio later.
3. **Bolts retract** (2.0s–2.5s) — Two or three locking bolts on the door edge slide inward.
4. **Door swings open** (2.5s–4.0s) — The door swings open toward the camera on its left hinge. As it opens, bright warm light spills out from behind, bloom effect intensifies.
5. **Dissolve to content** (4.0s–4.8s) — The entire Three.js scene fades out, revealing the actual home page content beneath. The overlay div is removed from the DOM after fade completes.

Total duration: **~5 seconds**.

### 2.2 Session Tracking

```typescript
// Check if vault intro has played this session
const hasPlayed = sessionStorage.getItem('vault-intro-played');

// After animation completes
sessionStorage.setItem('vault-intro-played', 'true');
```

If `vault-intro-played` is already set, skip the animation entirely — render the home page immediately with no overlay.

### 2.3 Skip Interaction

During the animation, a small "Skip" text button sits in the bottom-right corner (low opacity, fades in after 1 second). Clicking it immediately jumps to the dissolve phase (step 5). This respects the user's time on repeat visits within a session if sessionStorage gets cleared.

### 2.4 Technical Architecture

The vault door is a **dynamically imported** React Three Fiber component. It must NOT be server-rendered.

```
src/
├── components/
│   └── three/
│       ├── VaultDoor.tsx          # The R3F Canvas + scene (client component)
│       ├── VaultDoorModel.tsx     # The 3D vault door geometry + materials
│       └── VaultOverlay.tsx       # The full-screen overlay wrapper with session logic
```

**VaultOverlay.tsx** — A client component that:
- Checks `sessionStorage` on mount
- If not played: renders a full-screen fixed overlay (`position: fixed, inset: 0, z-index: 100`) containing the `VaultDoor` R3F Canvas
- Manages the animation timeline state
- On animation complete (or skip): fades out the overlay over 800ms, then removes from DOM
- If already played: renders nothing (returns null)

**VaultDoor.tsx** — The R3F `<Canvas>` wrapper:
- Camera positioned directly in front of the door, slight low angle for drama
- `<Environment>` from drei for realistic metallic reflections
- `<EffectComposer>` with Bloom for the light-spill effect when door opens
- Exposes an `onComplete` callback prop

**VaultDoorModel.tsx** — The actual 3D geometry:
- Vault door: a large cylinder (flat disc) with beveled edge and metallic material (`MeshStandardMaterial` with `metalness: 0.9, roughness: 0.3`)
- Handle wheel: a torus with spokes (can be simplified as a torus + crossed cylinders)
- Locking bolts: 3 small cylinders on the right edge of the door
- Door frame: a slightly larger ring around the door
- Color palette: gunmetal gray (`#2a2a30`) for the door, slightly lighter (`#3a3a44`) for the frame, dark gold (`#8a7a50`) for the handle
- All animation driven by `useFrame` with progress tracked via a ref (0 to 1 over 5 seconds)

### 2.5 Animation Implementation Pattern

Use a single progress value (0→1) mapped to the animation phases:

```typescript
// Inside useFrame:
const elapsed = clock.getElapsedTime() - startTime;
const progress = Math.min(elapsed / TOTAL_DURATION, 1);

// Phase mapping:
// 0.00–0.10: fade in (opacity 0→1)
// 0.10–0.40: wheel spin (rotation 0→4π)
// 0.40–0.50: bolts retract (translate X)
// 0.50–0.80: door swing (rotation Y 0→-100°)
// 0.80–1.00: bloom intensity ramp + dissolve

// Use easing functions for each phase:
// Wheel spin: easeInOutCubic
// Door swing: easeInOutQuart (slow start, smooth end)
// Bolt retract: easeOutBack (slight overshoot)
```

### 2.6 Performance Notes

- The Three.js bundle is heavy. Use `next/dynamic` with `ssr: false` for the VaultOverlay component import in the home page
- After animation completes and overlay is removed, dispose of the Three.js scene, renderer, and all geometries/materials to free memory
- The R3F Canvas should have `dpr={[1, 1.5]}` to cap pixel ratio (no need for 2x on a loading animation)
- Use `frameloop="demand"` initially, switch to `"always"` when animation starts, back to `"demand"` at end before disposal

---

## 3. Home Page Layout

### 3.1 Page Structure

```
┌─────────────────────────────────────────────────┐
│  Navigation Bar (fixed, from PRD-01)            │
├─────────────────────────────────────────────────┤
│  Portfolio Header Strip                          │
│  ┌─────────────────────────────────────────────┐│
│  │ Total: $XX,XXX.XX  │  15 Cards  │  Hunt: X/15││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │Card 1│  │Card 2│  │Card 3│    Row 1           │
│  └──────┘  └──────┘  └──────┘                   │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │Card 4│  │Card 5│  │Card 6│    Row 2           │
│  └──────┘  └──────┘  └──────┘                   │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │Card 7│  │Card 8│  │Card 9│    Row 3           │
│  └──────┘  └──────┘  └──────┘                   │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │Card10│  │Card11│  │Card12│    Row 4           │
│  └──────┘  └──────┘  └──────┘                   │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │Card13│  │Card14│  │Card15│    Row 5           │
│  └──────┘  └──────┘  └──────┘                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 3.2 Portfolio Header Strip

A slim bar between the navigation and the card grid. Sits below the fixed nav (add `pt-16` to account for nav height, then the header strip).

Contents (all on one horizontal line):
- **Left:** Portfolio value in large monospace font — `$47,850.99` with the dollars in primary text color and cents in tertiary
- **Center:** Card count — `15 Cards` in secondary text, subtle
- **Right:** Hunt progress — `4 / 15 Black Labels` with a small inline progress bar

Styling: Same frosted-glass feel as the nav but subtler. `bg-[var(--color-bg-secondary)]/60 backdrop-blur-sm`. A single-pixel border bottom in `var(--color-border-default)`. Height: 48px. Sticky below the nav.

### 3.3 Card Grid

- CSS Grid: `grid-template-columns: repeat(3, 1fr)` 
- Gap: `var(--space-xl)` (32px)
- Max width: `1200px`, centered with `mx-auto`
- Padding: `var(--space-2xl)` (48px) on sides, `var(--space-xl)` (32px) top
- Cards maintain their natural aspect ratio (Pokemon cards are 2.5" × 3.5", ratio ≈ 5:7)
- Each card is wrapped in a `<Link href={/card/${slug}}>` so clicking navigates to the detail page

### 3.4 Card Sort Order

Cards render in `displayOrder` (1–15) from the `CARDS` array in `cardData.ts`. No sorting/filtering UI on this page — it's a curated display, not a database browser.

### 3.5 Scroll Entrance Animation

As cards enter the viewport on scroll, they fade in with a slight upward slide. Use Framer Motion's `whileInView`:

- Initial state: `opacity: 0, y: 30`
- Animate to: `opacity: 1, y: 0`
- Transition: `duration: 0.5, ease: [0.22, 1, 0.36, 1]` (matches `--ease-spring`)
- Stagger: each card in a row delays 100ms after the previous (so 0ms, 100ms, 200ms per row)
- `viewport={{ once: true }}` so the animation only plays on first scroll-in, not every time

### 3.6 Responsive Behavior

- **≥1024px:** 3 columns (the primary layout)
- **768px–1023px:** 2 columns (cards get larger, 8 rows)
- **<768px:** 1 column (full-width cards, scrollable list)

Implemented via Tailwind: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## 4. Home Page File (`src/app/page.tsx`)

```typescript
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { CardTilt } from '@/components/cards/CardTilt';
import { PortfolioHeader } from '@/components/ui/PortfolioHeader';

// Dynamically import vault overlay — no SSR (Three.js)
const VaultOverlay = dynamic(
  () => import('@/components/three/VaultOverlay').then(mod => mod.VaultOverlay),
  { ssr: false }
);

export default function HomePage() {
  return (
    <>
      {/* Vault door intro — plays once per session */}
      <VaultOverlay />

      {/* Main content */}
      <div className="pt-16"> {/* Offset for fixed nav */}
        <PortfolioHeader />

        <div className="mx-auto max-w-[1200px] px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CARDS.map((card, index) => (
              <Link
                key={card.slug}
                href={`/card/${card.slug}`}
                className="block"
              >
                <CardTilt
                  card={card}
                  index={index}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

Note: `PortfolioHeader` is a new component created in this PRD. `CardTilt` is the interactive card component detailed in PRD-02b.

---

## 5. Portfolio Header Component (`src/components/ui/PortfolioHeader.tsx`)

```typescript
'use client';

export function PortfolioHeader() {
  // TODO: Replace with real data from database in PRD-05
  const portfolioValue = 47850.99;
  const cardCount = 15;
  const blackLabelsAcquired = 0;
  const blackLabelsTotal = 15;

  const dollars = Math.floor(portfolioValue).toLocaleString();
  const cents = (portfolioValue % 1).toFixed(2).slice(1); // ".99"

  return (
    <div className="sticky top-16 z-40 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/60 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-8 flex items-center justify-between h-12">
        {/* Portfolio Value */}
        <div className="font-[var(--font-mono)] text-lg">
          <span className="text-[var(--color-text-primary)]">${dollars}</span>
          <span className="text-[var(--color-text-tertiary)]">{cents}</span>
        </div>

        {/* Card Count */}
        <div className="text-sm text-[var(--color-text-secondary)] tracking-wide">
          {cardCount} Cards
        </div>

        {/* Hunt Progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-secondary)] font-[var(--font-mono)]">
            {blackLabelsAcquired}
            <span className="text-[var(--color-text-tertiary)]"> / {blackLabelsTotal}</span>
          </span>
          <div className="w-24 h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-700"
              style={{ width: `${(blackLabelsAcquired / blackLabelsTotal) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] tracking-wider uppercase">
            Black Labels
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Navigation Update

Update `src/components/ui/Navigation.tsx` from PRD-01:

### Changes:
- Remove "Collection" from `navLinks` array
- Keep "The Vault" as the home/logo link (href: `/`)
- Keep "The Hunt" (href: `/hunt`)
- Remove the portfolio value from the nav (it now lives in `PortfolioHeader`)
- The nav becomes just: logo left, hunt link right

```typescript
const navLinks = [
  { href: '/', label: 'The Vault', isLogo: true },
  { href: '/hunt', label: 'The Hunt', isLogo: false },
];
```

Style the logo link differently from regular links: `font-[var(--font-display)] text-base font-bold tracking-wider uppercase` with the default accent color. "The Hunt" is a regular nav link on the right side.

---

## 7. Route Cleanup

### 7.1 Delete Collection Page

Delete `src/app/collection/page.tsx`

### 7.2 Create Redirect

Create `src/app/collection/route.ts`:

```typescript
import { redirect } from 'next/navigation';

export async function GET() {
  redirect('/');
}
```

---

## 8. Files Created / Modified in This PRD

| File | Action | Description |
|------|--------|-------------|
| `src/components/three/VaultOverlay.tsx` | **CREATE** | Full-screen overlay with session logic |
| `src/components/three/VaultDoor.tsx` | **CREATE** | R3F Canvas + scene setup |
| `src/components/three/VaultDoorModel.tsx` | **CREATE** | 3D vault door geometry + animation |
| `src/components/cards/CardTilt.tsx` | **CREATE** | Interactive card with tilt + shimmer (see PRD-02b) |
| `src/components/ui/PortfolioHeader.tsx` | **CREATE** | Portfolio value + hunt progress strip |
| `src/hooks/useCardTilt.ts` | **CREATE** | Mouse-tracking tilt hook (see PRD-02b) |
| `src/app/page.tsx` | **REWRITE** | Home page with vault overlay + card grid |
| `src/components/ui/Navigation.tsx` | **MODIFY** | Remove collection link, remove value display |
| `src/app/collection/page.tsx` | **DELETE** | No longer a separate page |
| `src/app/collection/route.ts` | **CREATE** | Redirect /collection → / |

---

## 9. Verification

```
□ npm run dev starts without errors
□ First visit to / shows vault door animation (full ~5 second sequence)
□ Refreshing the page (same session) skips animation, shows grid immediately
□ Opening a new tab to / replays animation (new session)
□ Skip button works during animation
□ After animation, 15 cards are visible in a 5×3 grid
□ Cards fade in with stagger when scrolling
□ Hovering a card triggers tilt + scale effect (see PRD-02b)
□ Clicking a card navigates to /card/[slug]
□ Portfolio header shows value, count, and hunt progress
□ Navigation shows "The Vault" and "The Hunt" only
□ /collection redirects to /
□ npm run build succeeds
□ No TypeScript errors (npx tsc --noEmit)
```

---

**→ Continue to PRD-02b-Card-Tilt-Component.md for the CardTilt component, holographic shimmer effect, and useCardTilt hook**
