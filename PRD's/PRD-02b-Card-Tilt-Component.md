# PRD-02b: Card Tilt Component & Holographic Shimmer

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 02b of 2 (Card Interaction)  
**Depends on:** PRD-02a structure in place

---

## 1. Overview

This PRD details the `CardTilt` component — the interactive card element used on the home page grid. Each card displays the raw (ungraded) card image with a subtle 3D tilt effect on hover, a slight scale-up, and a holographic light shimmer that follows the mouse. This is a CSS + JS solution (no Three.js) for performance since 15 cards render simultaneously.

---

## 2. CardTilt Component (`src/components/cards/CardTilt.tsx`)

### 2.1 Behavior Specification

**Idle State:**
- Card is flat (no rotation), scale 1.0
- Subtle drop shadow: `0 4px 20px rgba(0, 0, 0, 0.3)`
- Border: 1px solid `var(--color-border-default)`
- Border radius: 12px (matches Pokemon card rounded corners)

**Hover State (mouse enters card area):**
- Scale smoothly to 1.04 over 300ms
- Shadow deepens: `0 12px 40px rgba(0, 0, 0, 0.5)`
- Border brightens slightly to `var(--color-border-hover)`
- Card name and set info fade in at the bottom of the card (overlay)

**Active Tilt (mouse moves within card):**
- Card rotates in 3D space based on mouse position relative to card center
- Maximum tilt: **8 degrees** on both X and Y axes (subtle, not dramatic)
- Tilt is inverted so the card surface faces toward the cursor (natural "paper in hand" feel)
- Holographic shimmer overlay moves with the mouse (see Section 3)
- All movement uses spring easing for organic, non-robotic feel

**Mouse Leave:**
- Card smoothly returns to flat (0° rotation) over 500ms with spring easing
- Scale returns to 1.0 over 300ms
- Shadow returns to idle state
- Shimmer overlay fades out
- Card info overlay fades out

### 2.2 Component Structure

```typescript
'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCardTilt } from '@/hooks/useCardTilt';
import type { CardMeta } from '@/lib/utils/cardData';
import { cn } from '@/lib/utils/cn';

interface CardTiltProps {
  card: CardMeta;
  index: number;  // For stagger animation on scroll entrance
}

export function CardTilt({ card, index }: CardTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { tiltStyle, shimmerStyle, isHovering, handlers } = useCardTilt(cardRef);

  // Stagger delay: cards in same row share a base, offset by column position
  const row = Math.floor(index / 3);
  const col = index % 3;
  const staggerDelay = row * 0.15 + col * 0.1;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl cursor-pointer',
          'transition-shadow duration-300',
          'border border-[var(--color-border-default)]',
          isHovering
            ? 'shadow-[0_12px_40px_rgba(0,0,0,0.5)] border-[var(--color-border-hover)]'
            : 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        )}
        style={{
          ...tiltStyle,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        {...handlers}
      >
        {/* Card Image */}
        <div className="aspect-[5/7] relative">
          <Image
            src={card.imageUrl || `/cards/${card.slug}.png`}
            alt={card.name}
            fill
            className="object-cover rounded-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 6}  // Prioritize first two rows
          />

          {/* Holographic Shimmer Overlay */}
          <div
            className={cn(
              'absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
            style={shimmerStyle}
          />

          {/* Card Info Overlay (bottom) */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-4 rounded-b-xl',
              'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
              'transition-opacity duration-300',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          >
            <h3 className="font-[var(--font-display)] text-base font-semibold text-white tracking-tight">
              {card.name}
            </h3>
            <p className="font-[var(--font-mono)] text-xs text-white/60 mt-0.5">
              {card.set} · {card.cardNumber}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 3. The Holographic Shimmer Effect

### 3.1 What It Looks Like

The shimmer is a radial gradient overlay that follows the mouse cursor position. It simulates light catching the surface of a holographic card. The gradient is a soft, semi-transparent rainbow/iridescent wash — not a solid color, but a blend that shifts between warm and cool tones depending on the cursor position.

### 3.2 Implementation

The shimmer is a CSS `background` applied to an absolutely-positioned overlay div. The `useCardTilt` hook calculates the gradient center position based on the mouse coordinates.

```css
/* The shimmer gradient — moves with mouse position */
background: radial-gradient(
  circle at {mouseX}% {mouseY}%,
  rgba(255, 255, 255, 0.15) 0%,
  rgba(200, 170, 255, 0.08) 20%,
  rgba(100, 200, 255, 0.06) 40%,
  rgba(255, 200, 100, 0.04) 60%,
  transparent 80%
);
```

The gradient values create a subtle iridescent look: white hotspot at center (the "light source"), transitioning through violet → cyan → gold → transparent. It's intentionally low-opacity so it enhances the card art without washing it out.

Additionally, apply a `mix-blend-mode: overlay` to the shimmer div so it interacts naturally with the card art underneath.

### 3.3 Shimmer Style Object

The `shimmerStyle` returned by `useCardTilt` looks like:

```typescript
const shimmerStyle = {
  background: `radial-gradient(
    circle at ${mouseXPercent}% ${mouseYPercent}%,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(200, 170, 255, 0.08) 20%,
    rgba(100, 200, 255, 0.06) 40%,
    rgba(255, 200, 100, 0.04) 60%,
    transparent 80%
  )`,
  mixBlendMode: 'overlay' as const,
};
```

---

## 4. useCardTilt Hook (`src/hooks/useCardTilt.ts`)

### 4.1 Specification

This hook encapsulates all the mouse-tracking math. It takes a ref to the card element and returns:
- `tiltStyle`: CSS transform object with `perspective`, `rotateX`, `rotateY`, and `scale`
- `shimmerStyle`: CSS background object for the holographic overlay
- `isHovering`: boolean for conditional styling
- `handlers`: `onMouseEnter`, `onMouseMove`, `onMouseLeave` event handlers

### 4.2 Implementation

```typescript
'use client';

import { useState, useCallback, useRef, type RefObject, type CSSProperties } from 'react';

interface CardTiltReturn {
  tiltStyle: CSSProperties;
  shimmerStyle: CSSProperties;
  isHovering: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
  };
}

const MAX_TILT = 8;             // Maximum degrees of rotation
const SCALE_HOVER = 1.04;       // Scale factor on hover
const TRANSITION_IN = 'transform 0.15s ease-out';   // Quick response to mouse
const TRANSITION_OUT = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';  // Smooth spring back

export function useCardTilt(cardRef: RefObject<HTMLDivElement | null>): CardTiltReturn {
  const [isHovering, setIsHovering] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [mouseXPercent, setMouseXPercent] = useState(50);
  const [mouseYPercent, setMouseYPercent] = useState(50);

  // Use RAF ref to throttle mouse move updates
  const rafRef = useRef<number | null>(null);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;

    // Cancel any pending RAF to avoid stacking
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current!.getBoundingClientRect();

      // Mouse position as 0→1 relative to card bounds
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Center-relative: -0.5 to 0.5
      const centerX = x - 0.5;
      const centerY = y - 0.5;

      // Tilt: inverted so card faces toward cursor
      // rotateX is vertical tilt (controlled by Y position)
      // rotateY is horizontal tilt (controlled by X position)
      setTiltX(-centerY * MAX_TILT);  // Negative: top of card tilts away when cursor is at top
      setTiltY(centerX * MAX_TILT);   // Positive: right side tilts toward when cursor is at right

      // Shimmer position as percentage
      setMouseXPercent(x * 100);
      setMouseYPercent(y * 100);
    });
  }, [cardRef]);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTiltX(0);
    setTiltY(0);
    setMouseXPercent(50);
    setMouseYPercent(50);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tiltStyle: CSSProperties = {
    transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovering ? SCALE_HOVER : 1})`,
    transition: isHovering ? TRANSITION_IN : TRANSITION_OUT,
  };

  const shimmerStyle: CSSProperties = {
    background: `radial-gradient(
      circle at ${mouseXPercent}% ${mouseYPercent}%,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(200, 170, 255, 0.08) 20%,
      rgba(100, 200, 255, 0.06) 40%,
      rgba(255, 200, 100, 0.04) 60%,
      transparent 80%
    )`,
    mixBlendMode: 'overlay' as const,
  };

  return {
    tiltStyle,
    shimmerStyle,
    isHovering,
    handlers: {
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
    },
  };
}
```

### 4.3 Key Design Decisions

**Why `perspective(800px)`?** — 800px gives a subtle 3D depth without extreme distortion. Lower values (400–500) would make the tilt look dramatic and gamey. Higher values (1200+) would make it barely perceptible. 800 is the sweet spot for "oh that's nice" without "why is this card flying at me."

**Why max 8 degrees?** — You specifically asked for "just barely tilt." 8° is perceptible but restrained. For reference, most card tilt demos online use 15–25° which feels like a tech demo. 8° feels like you're holding a real card and shifting your wrist.

**Why RAF throttling?** — `mousemove` fires at 60+ Hz. Without throttling, you'd update state on every pixel movement, causing unnecessary re-renders. RAF caps it to once per frame.

**Why not Framer Motion for the tilt?** — Framer Motion's spring animations add overhead that's unnecessary for 15 simultaneous instances. Raw CSS transitions with `cubic-bezier` springs are lighter and just as smooth for this specific interaction. Framer Motion is used for the scroll entrance animation (one-time, not continuous).

---

## 5. Card Images

### 5.1 Source

Card images come from pokemontcg.io's CDN. The URLs follow the pattern:

```
https://images.pokemontcg.io/{setCode}/{cardNumber}_hires.png
```

For example, Umbreon VMAX:
```
https://images.pokemontcg.io/swsh7/215_hires.png
```

These are already configured as allowed remote patterns in `next.config.ts` (PRD-01).

### 5.2 Fallback

If pokemontcg.io URLs don't resolve for certain cards (trainer gallery cards sometimes use different URL patterns), fall back to local images stored in `src/assets/cards/{slug}.png`. The `CardTilt` component tries the remote URL first via Next.js `<Image>` which handles errors gracefully.

### 5.3 Image Optimization

- Use Next.js `<Image>` component for automatic optimization, WebP conversion, and lazy loading
- `priority={true}` on the first 6 cards (first two rows above the fold)
- `sizes` attribute set to responsive breakpoints so the browser loads appropriate resolution
- Card images are approximately 734×1024px from pokemontcg.io — plenty of resolution for the grid

---

## 6. Accessibility Considerations

- Each card link has the card name as accessible text via the `alt` attribute on the image
- The tilt effect is visual-only and does not affect keyboard navigation
- Cards are focusable via `<Link>` — add a visible focus ring: `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]`
- The vault door animation respects `prefers-reduced-motion` — if the user has reduced motion enabled, skip the animation entirely (same as session-already-played behavior)

```typescript
// In VaultOverlay.tsx
const prefersReducedMotion = typeof window !== 'undefined' 
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) return null;  // Skip animation entirely
```

---

## 7. Files Summary

| File | Action |
|------|--------|
| `src/components/cards/CardTilt.tsx` | **CREATE** |
| `src/hooks/useCardTilt.ts` | **CREATE** |
| `src/components/ui/PortfolioHeader.tsx` | **CREATE** (detailed in PRD-02a) |
| `src/components/three/VaultOverlay.tsx` | **CREATE** (detailed in PRD-02a) |
| `src/components/three/VaultDoor.tsx` | **CREATE** (detailed in PRD-02a) |
| `src/components/three/VaultDoorModel.tsx` | **CREATE** (detailed in PRD-02a) |
| `src/app/page.tsx` | **REWRITE** |
| `src/components/ui/Navigation.tsx` | **MODIFY** |
| `src/app/collection/page.tsx` | **DELETE** |
| `src/app/collection/route.ts` | **CREATE** (redirect) |

---

## 8. Verification

```
□ All checks from PRD-02a pass
□ Hovering a card triggers scale to 1.04x smoothly
□ Mouse movement within a card causes subtle tilt (max 8°)
□ Holographic shimmer follows mouse position with radial gradient
□ Mouse leave returns card to flat position with spring easing
□ Card info (name + set) fades in on hover, fades out on leave
□ Clicking a card navigates to /card/{slug}
□ First two rows of cards load eagerly, lower rows lazy-load
□ Cards stagger-animate on scroll (row by row, then column within row)
□ Responsive: 3 cols on desktop, 2 on tablet, 1 on mobile
□ prefers-reduced-motion skips vault animation
□ No console errors or warnings
□ Build succeeds: npm run build
```

---

## 9. What Comes Next

**PRD-03** will build the Card Detail Page (`/card/[slug]`):
- Slab viewer with grading company tab switching (PSA, BGS, CGC, SGC, RAW)
- BGS secondary toggle for Silver / Gold / Black label
- Card-specific accent color theming
- Price data display (placeholder layout, real data in PRD-05)
- Pop report display (placeholder layout, real data in PRD-05)
- Navigation back to home
