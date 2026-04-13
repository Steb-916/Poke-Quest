# PRD-03c: Card Detail Page — Layout Fixes

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 03c (Patch — two targeted fixes)  
**Depends on:** PRD-03a and PRD-03b complete

---

## Fix 1: Two-Column Hero Layout

### Problem
The card detail page currently stacks everything vertically: card image → grader tabs → card name → details → market data → charts. The PRD specified a side-by-side layout at desktop widths so the slab viewer and card identity are visible simultaneously without scrolling.

### Required Change
In `src/app/card/[slug]/page.tsx` (or wherever the hero section is composed), the slab viewer and card identity panel must sit in a two-column CSS grid at `lg` breakpoint and above.

```
Desktop (≥1024px):
┌──────────────────────┬─────────────────────────┐
│   SlabViewer          │   CardIdentity           │
│   (card image +       │   (name, set, illustrator│
│    grader tabs)       │    attributes, market,   │
│                       │    hunt status)           │
└──────────────────────┴─────────────────────────┘

Mobile (<1024px):
┌────────────────────────────────────────────────┐
│   SlabViewer (full width)                       │
├────────────────────────────────────────────────┤
│   CardIdentity (full width)                     │
└────────────────────────────────────────────────┘
```

Implementation:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
  <SlabViewer card={card} />
  <CardIdentity card={card} />
</div>
```

The `items-start` is important — it top-aligns both columns so the card identity doesn't vertically center against a tall slab viewer.

Make sure the SlabViewer component (card image + grader tabs beneath it) stays together as one unit in the left column, and all identity/market/hunt content stays together in the right column.

---

## Fix 2: Back Link

### Problem
There is no "← Back to Vault" link on the card detail page. The only way to return to the home grid is clicking "THE VAULT" in the navigation bar.

### Required Change
Add a back link above the hero section, inside the max-width container, with top padding.

```tsx
<div className="mx-auto max-w-[1200px] px-8 pt-6 pb-2">
  <Link
    href="/"
    className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
  >
    <span className="text-lg leading-none">←</span>
    <span className="tracking-wide">Back to Vault</span>
  </Link>
</div>
```

This goes between the nav spacer (`pt-16`) and the hero grid.

---

## Verification

```
□ At desktop width (≥1024px): slab viewer and card identity are side by side
□ At mobile width (<1024px): slab viewer stacks above card identity
□ Back link is visible above the hero section
□ Back link navigates to /
□ Back link hover state brightens text
□ npm run build succeeds
```
