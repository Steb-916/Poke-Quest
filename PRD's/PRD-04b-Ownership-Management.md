# PRD-04b: Ownership Management & Acquisition Tracking

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 04b of 2 (Ownership Editing)  
**Depends on:** PRD-04a complete

---

## 1. Overview

This PRD adds the ability to manage card ownership data directly from The Hunt page. Since this is a personal site with no authentication, the edit interface is simple and direct — click a card's edit button, fill in acquisition details, save to the database. This is also where we wire up the first real database writes (previous PRDs only read static/mock data).

---

## 2. Edit Trigger

### 2.1 Edit Button on Hunt Cards

Each `HuntCard` gets a small edit icon button in the top-left corner. It appears on hover (desktop) or is always visible (mobile).

- Icon: a small pencil or gear icon (use a simple SVG, no icon library)
- Size: 28px circle
- Background: `var(--color-bg-tertiary)` at 80% opacity with backdrop-blur
- On hover: background brightens, accent border appears
- `onClick`: opens the ownership drawer (stops event propagation so the `<Link>` doesn't navigate)
- `e.preventDefault()` and `e.stopPropagation()` on the button click to prevent the parent Link from firing

### 2.2 Alternative Entry

The Card Detail page (`/card/[slug]`) should also have an "Edit Ownership" button in the CardIdentity panel's hunt status section. This opens the same drawer component. However, for this PRD, we only implement it on The Hunt page. The card detail integration is a follow-up.

---

## 3. Ownership Drawer

### 3.1 Component: `src/components/hunt/OwnershipDrawer.tsx`

A slide-in panel from the right side of the screen. Not a modal — drawers feel more like editing a property panel than interrupting workflow.

### 3.2 Drawer Behavior

- Slides in from the right edge, width 420px (desktop) or full-width (mobile)
- Background overlay: `var(--color-bg-primary)` at 60% opacity, click to close
- Drawer background: `var(--color-bg-secondary)` with left border in `var(--color-border-default)`
- Close button (X) in top-right corner
- ESC key closes the drawer
- Body scroll locked while drawer is open

### 3.3 Drawer Animation

```typescript
// Overlay
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Drawer panel
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
```

### 3.4 Drawer Content

The drawer displays the card at the top (small image + name) and a form below.

```
┌──────────────────────────────┐
│  ✕                    Close  │
├──────────────────────────────┤
│                              │
│  [Card Image]  Umbreon VMAX  │
│  (small)       Evolving Skies│
│                              │
├──────────────────────────────┤
│                              │
│  OWNERSHIP STATUS            │
│                              │
│  Do you own this card?       │
│  ( ) No                      │
│  (●) Yes                     │
│                              │
│  ── If Yes: ──               │
│                              │
│  Grading Company             │
│  [RAW ▾]                     │
│                              │
│  Grade (if graded)           │
│  [10 ▾]                      │
│                              │
│  Label Type (BGS only)       │
│  [Gold ▾]                    │
│                              │
│  Cert Number                 │
│  [____________]              │
│                              │
│  Purchase Price              │
│  [$ _________]               │
│                              │
│  Purchase Date               │
│  [YYYY-MM-DD]                │
│                              │
│  Source                      │
│  [eBay ▾]                    │
│                              │
│  Notes                       │
│  [____________]              │
│  [____________]              │
│                              │
│  ┌──────────────────────────┐│
│  │       Save Changes       ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │    Remove Ownership      ││
│  └──────────────────────────┘│
│                              │
└──────────────────────────────┘
```

### 3.5 Form Fields

| Field | Type | Options | Required | Conditional |
|-------|------|---------|----------|-------------|
| Owned | Radio | Yes / No | Yes | — |
| Grading Company | Select | RAW, PSA, BGS, CGC, SGC | Yes (if owned) | Shows if Owned = Yes |
| Grade | Select | Varies by company | No (null if RAW) | Shows if company ≠ RAW |
| Label Type | Select | Silver, Gold, Black Label | No | Shows if company = BGS |
| Cert Number | Text input | Free text | No | Shows if company ≠ RAW |
| Purchase Price | Number input | USD, two decimals | No | Shows if Owned = Yes |
| Purchase Date | Date input | YYYY-MM-DD | No | Shows if Owned = Yes |
| Source | Select | eBay, Fanatics, Whatnot, PWCC, Local Shop, Private Sale, Other | No | Shows if Owned = Yes |
| Notes | Textarea | Free text, max 500 chars | No | Shows if Owned = Yes |

**Grade options by company:**
- PSA: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, Authentic
- BGS: 10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6
- CGC: 10 (Perfect), 10 (Pristine), 9.5, 9, 8.5, 8, 7.5, 7
- SGC: 10, 9.5, 9, 8.5, 8, 7, 6

### 3.6 Form Styling

- Labels: uppercase, 11px, `var(--color-text-tertiary)`, letter-spacing 0.1em
- Inputs: `bg-[var(--color-bg-tertiary)]`, border `var(--color-border-default)`, rounded-lg, h-10
- Focus: border `var(--color-accent)`, subtle accent glow
- Select dropdowns: same styling as inputs, custom chevron icon
- The "Is Black Label" path (BGS + Grade 10 + Label = Black Label) should trigger a subtle visual celebration — maybe the drawer border shifts to gold briefly

### 3.7 Save Button

- Full-width, accent background, dark text, bold
- On save: call a server action or API route to write to the `Ownership` table
- Show a brief success state (button text changes to "✓ Saved" for 1.5s, then reverts)
- On error: show inline error message below the button in `var(--color-negative)`

### 3.8 Remove Button

- Full-width, ghost style (transparent bg, `var(--color-negative)` text + border)
- Click shows confirmation: "Remove ownership record? This can't be undone."
- On confirm: deletes the ownership record, closes drawer, card reverts to "Not Acquired" state

---

## 4. API Route for Ownership

### 4.1 `src/app/api/ownership/route.ts`

A simple REST endpoint for managing ownership records.

**POST** — Create or update ownership:
```typescript
// Request body matches the form fields
{
  cardSlug: string;
  condition: 'RAW' | 'PSA' | 'BGS' | 'CGC' | 'SGC';
  grade?: string;
  labelType?: string;
  certNumber?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  purchaseSource?: string;
  notes?: string;
}
```

**DELETE** — Remove ownership:
```typescript
// Request body
{
  cardSlug: string;
}
```

### 4.2 Implementation Notes

- Look up the Card record by slug first. If card not found, return 404.
- For POST: upsert the Ownership record (create if doesn't exist, update if it does). Use the `cardId` from the Card lookup. Set `acquired = true`, `isTarget = (labelType === 'Black Label')`.
- For DELETE: find and delete the Ownership record for this card. If none exists, return 404.
- Return the updated ownership record on success.
- No authentication check needed (personal site), but validate input types.

### 4.3 Database First Write

This is the first PRD that actually writes to the database. Before this works:
1. A `DATABASE_URL` must be configured in `.env.local` pointing to a real PostgreSQL database
2. `npx prisma db push` must have been run to create the tables
3. The Card table must be seeded with the 15 card records

**For development without a database:** The API route should gracefully handle the case where the database isn't connected yet. Return a mock success response with a console warning. This allows the UI to be developed and tested independently.

```typescript
try {
  // Attempt database write
  const result = await prisma.ownership.upsert({ ... });
  return NextResponse.json(result);
} catch (error) {
  // Database not connected — return mock response for development
  console.warn('Database not connected. Returning mock response.');
  return NextResponse.json({ success: true, mock: true });
}
```

---

## 5. State Management

### 5.1 Hunt Page State

The Hunt page needs to track which card's drawer is open. Use Zustand:

```typescript
// Add to src/lib/store/index.ts

import { create } from 'zustand';

interface HuntStore {
  editingCardSlug: string | null;
  openDrawer: (slug: string) => void;
  closeDrawer: () => void;
}

export const useHuntStore = create<HuntStore>((set) => ({
  editingCardSlug: null,
  openDrawer: (slug) => set({ editingCardSlug: slug }),
  closeDrawer: () => set({ editingCardSlug: null }),
}));
```

### 5.2 Optimistic Updates

When the user saves ownership changes, update the local state immediately (optimistic) while the API call is in flight. If the API call fails, revert and show an error. Use React Query's `useMutation` with `onMutate` for optimistic updates:

```typescript
const mutation = useMutation({
  mutationFn: saveOwnership,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    // Snapshot previous value
    // Optimistically update
  },
  onError: (err, newData, context) => {
    // Revert to previous value
  },
  onSettled: () => {
    // Refetch to sync with server
  },
});
```

For the initial implementation with mock data (no database), this just means updating local state directly.

---

## 6. Hunt Page Updates

### 6.1 Modified `src/app/hunt/page.tsx`

The hunt page now:
- Imports the `OwnershipDrawer` component
- Renders the drawer conditionally based on Zustand state
- Each `HuntCard` receives an `onEdit` callback that opens the drawer

### 6.2 Modified `src/components/hunt/HuntCard.tsx`

- Add edit button (top-left, hover-visible)
- Accept `onEdit` prop
- Button click calls `onEdit(card.slug)` with event propagation stopped

---

## 7. Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/hunt/OwnershipDrawer.tsx` | **CREATE** | Slide-in editing drawer |
| `src/app/api/ownership/route.ts` | **CREATE** | REST endpoint for ownership CRUD |
| `src/lib/store/index.ts` | **CREATE** | Zustand store with hunt state |
| `src/components/hunt/HuntCard.tsx` | **MODIFY** | Add edit button + onEdit prop |
| `src/app/hunt/page.tsx` | **MODIFY** | Add drawer + Zustand integration |

---

## 8. Verification

```
□ Hovering a hunt card reveals edit icon in top-left
□ Clicking edit icon opens drawer from right (does NOT navigate to card)
□ Drawer shows card image, name, and ownership form
□ Radio toggle (Yes/No) shows/hides conditional fields
□ Selecting BGS reveals Label Type dropdown
□ Selecting RAW hides Grade and Cert Number fields
□ Save button shows success state briefly
□ API route handles POST and DELETE (or mock response if no DB)
□ Close button, ESC key, and overlay click all close the drawer
□ Body scroll is locked while drawer is open
□ Drawer works on mobile (full-width)
□ Remove ownership shows confirmation before deleting
□ npx tsc --noEmit passes
□ npm run build succeeds
```

---

## 9. What Comes Next

| PRD | Focus |
|-----|-------|
| **05** | Data Pipeline — API integration, cron jobs, database seeding, replacing ALL mock data across every page |
| **06** | Advanced Visualizations — Rarity aurora, portfolio constellation, price prediction |
| **07** | Scroll Animations & Micro-interactions — GSAP ScrollTrigger, page transitions, final polish |
| **08** | Performance & Mobile — Lazy loading, bundle splitting, lighthouse, touch |
| **09** | Deployment — Vercel production, Neon setup, cron scheduling, initial data population |
