# PRD-01: Project Foundation & Architecture

## Project: The Vault — A Pokémon Card Investment Portfolio

**Version:** 1.0  
**Author:** Hoodie (via Claude architectural session)  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 01 of ~10 (Foundation)

---

## 1. Project Overview

### 1.1 What This Is

The Vault is a personal interactive website for tracking, visualizing, and analyzing a curated portfolio of 15 Pokémon TCG cards from the Sword & Shield VMAX/V era. It serves as both a collector's tool and a portfolio-grade UI showcase. The site combines financial analytics (price history, pop reports, grading data, predictive pricing) with premium interactive design (3D effects, holographic card rendering, vault-themed animations, scroll-driven storytelling).

### 1.2 What This Is Not

- Not a marketplace or e-commerce site
- Not a social platform or multi-user app
- Not a generic Pokémon database or fan wiki
- Not a card identification or scanning tool
- Does not require authentication or user accounts

### 1.3 Design Philosophy

The site exists at the intersection of **luxury vault aesthetic** and **playful Pokémon collector energy**. Think: a high-end art gallery where the art happens to be holographic Pokémon cards. The design should feel expensive, intentional, and restrained — but with moments of delight and playfulness (a vault door opening animation, cards that shimmer and tilt, data that animates as you interact with it). The cards themselves provide all the color and life. Everything else is dark, typographic, and editorial.

### 1.4 The 15 Cards

These are the only cards tracked by this system. They are all English-language, Sword & Shield era alternate art / trainer gallery cards. This list is hardcoded and will not change.

| # | Card Name | Set | Card Number | Art Type |
|---|-----------|-----|-------------|----------|
| 1 | Umbreon VMAX | Evolving Skies | 215/203 | Alternate Art Secret |
| 2 | Rayquaza VMAX | Evolving Skies | 218/203 | Alternate Art Secret |
| 3 | Deoxys VMAX | Crown Zenith: Galarian Gallery | GG45/GG70 | Ultra Rare |
| 4 | Gengar VMAX | Fusion Strike | 271/264 | Alternate Art Secret |
| 5 | Giratina V | Lost Origin | 186/196 | Alternate Full Art |
| 6 | Aerodactyl V | Lost Origin | 180/196 | Alternate Full Art |
| 7 | Dragonite V | Evolving Skies | 192/203 | Ultra Rare |
| 8 | Espeon V | Evolving Skies | 180/203 | Ultra Rare |
| 9 | Machamp V | Astral Radiance | 172/189 | Ultra Rare |
| 10 | Tyranitar V | Battle Styles | 155/163 | Ultra Rare |
| 11 | Charizard V | Brilliant Stars | 154/172 | Alternate Full Art |
| 12 | Starmie V | Astral Radiance | TG13/TG30 | Trainer Gallery |
| 13 | Celebi V | Fusion Strike | 245/264 | Alternate Full Art |
| 14 | Galarian Slowking V | Chilling Reign | 179/198 | Alternate Full Art |
| 15 | Beedrill V | Astral Radiance | 161/189 | Alternate Full Art |

---

## 2. Tech Stack — Exact Versions & Rationale

### 2.1 Framework & Core

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 15 (App Router) | Framework — SSR, file-based routing, API routes, server components |
| React | 19 | UI library |
| TypeScript | 5.x (latest) | Type safety |
| Tailwind CSS | v4 | Utility-first styling |
| Vercel | — | Hosting, edge functions, cron jobs |

### 2.2 Database

| Package | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 16+ | Primary database (Neon free tier or Supabase) |
| Prisma | latest | ORM, migrations, type-safe queries |
| @prisma/client | latest | Generated client |

### 2.3 3D & Visual Effects

| Package | Version | Purpose |
|---------|---------|---------|
| three | ^0.170.0 | 3D rendering engine |
| @react-three/fiber | ^9.0.0 | React renderer for Three.js |
| @react-three/drei | ^9.0.0 | Helper components (Float, Environment, Text3D, etc.) |
| @react-three/postprocessing | ^3.0.0 | Bloom, vignette, chromatic aberration |

### 2.4 Animation & Motion

| Package | Version | Purpose |
|---------|---------|---------|
| framer-motion | ^12.0.0 | Page transitions, layout animations, scroll-triggered reveals, spring physics |
| gsap | ^3.12.0 | Timeline-based animation sequences, ScrollTrigger for scroll-driven effects |

### 2.5 Data Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| d3 | ^7.0.0 | Custom SVG visualizations (rarity aurora, constellation map) |
| recharts | ^2.0.0 | Standard charts (price history lines, bar charts) |

### 2.6 State & Data Fetching

| Package | Version | Purpose |
|---------|---------|---------|
| zustand | ^5.0.0 | Lightweight global state (UI state, active card, filter selections) |
| @tanstack/react-query | ^5.0.0 | Data fetching, caching, background refresh for API-sourced data |

### 2.7 Utility

| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | ^4.0.0 | Date formatting for price history timestamps |
| clsx | latest | Conditional class name merging |
| tailwind-merge | latest | Intelligent Tailwind class conflict resolution |

---

## 3. Project Initialization

### 3.1 Create the Project

```bash
npx create-next-app@latest the-vault --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd the-vault
```

When prompted:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like your code inside a `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to use Turbopack for `next dev`? **Yes**
- Would you like to customize the import alias? **Yes → @/***

### 3.2 Install All Dependencies

Run these in sequence. Do not skip any.

```bash
# Database
npm install prisma @prisma/client

# 3D Engine
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing

# Animation
npm install framer-motion gsap

# Data Visualization
npm install d3 recharts

# State & Data Fetching
npm install zustand @tanstack/react-query

# Utilities
npm install date-fns clsx tailwind-merge

# Type definitions for libraries that need them
npm install -D @types/three @types/d3
```

### 3.3 Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and a `.env` file with a `DATABASE_URL` placeholder.

### 3.4 Verification Checklist

After completing 3.1–3.3, verify:

```
□ `npm run dev` starts without errors
□ `prisma/schema.prisma` exists
□ `.env` file exists with DATABASE_URL placeholder
□ `node_modules/three` exists
□ `node_modules/framer-motion` exists
□ `node_modules/gsap` exists
□ `node_modules/@react-three/fiber` exists
□ `node_modules/zustand` exists
□ `node_modules/@tanstack/react-query` exists
□ `node_modules/recharts` exists
□ `node_modules/d3` exists
```

---

## 4. Project Folder Structure

Create this exact structure inside `src/`. Every folder listed here must exist even if empty (create a `.gitkeep` file in empty folders). This structure is intentional and should not be reorganized.

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — providers, fonts, global nav
│   ├── page.tsx                      # Home — vault door intro → portfolio overview
│   ├── loading.tsx                   # Global loading state (vault door animation)
│   ├── not-found.tsx                 # 404 page
│   ├── globals.css                   # Tailwind imports + CSS custom properties
│   ├── collection/
│   │   └── page.tsx                  # The 15-card grid with tilt/shimmer
│   ├── card/
│   │   └── [slug]/
│   │       └── page.tsx              # Individual card deep dive
│   ├── hunt/
│   │   └── page.tsx                  # Black Label quest tracker
│   └── api/
│       └── cron/
│           ├── prices/
│           │   └── route.ts          # Scheduled price data fetch
│           └── pop/
│               └── route.ts          # Scheduled PSA pop data fetch
│
├── components/
│   ├── three/                        # All Three.js/R3F components
│   │   ├── VaultDoor.tsx             # Vault door opening animation
│   │   ├── CardScene.tsx             # 3D card presentation scene
│   │   └── Environment.tsx           # Lighting, background, fog
│   ├── cards/                        # Card-specific UI components
│   │   ├── CardTilt.tsx              # 2D card with mouse-tracking tilt + holographic shimmer
│   │   ├── CardGrid.tsx              # Grid layout for the collection page
│   │   ├── SlabViewer.tsx            # Slab image viewer with grader tab switching
│   │   └── CardDetail.tsx            # Full card detail layout
│   ├── charts/                       # Data visualization components
│   │   ├── PriceHistory.tsx          # Line chart for price over time
│   │   ├── PopReport.tsx             # Pop data visualization
│   │   ├── RarityAurora.tsx          # Concentric ring scarcity visualization
│   │   └── PortfolioValue.tsx        # Total portfolio value over time
│   ├── hunt/                         # Hunt tracker components
│   │   ├── HuntProgress.tsx          # Overall progress visualization
│   │   └── HuntCard.tsx              # Individual card hunt status
│   └── ui/                           # Generic reusable UI components
│       ├── Navigation.tsx            # Site-wide navigation bar
│       ├── PageTransition.tsx        # Framer Motion page transition wrapper
│       ├── AnimatedCounter.tsx       # Number count-up animation
│       ├── GlowText.tsx             # Text with subtle glow effect
│       ├── TabSwitcher.tsx           # Animated tab component (used for grader switching)
│       └── Tooltip.tsx               # Hover tooltip
│
├── lib/
│   ├── db/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   └── queries.ts                # Typed database query functions
│   ├── api/
│   │   ├── pokemontcg.ts             # pokemontcg.io API client
│   │   ├── pricetracker.ts           # PokemonPriceTracker API client
│   │   ├── soldcomps.ts              # SoldComps.com eBay sold data client
│   │   └── types.ts                  # Shared API response types
│   ├── store/
│   │   └── index.ts                  # Zustand store definitions
│   └── utils/
│       ├── formatters.ts             # Currency, date, number formatting
│       ├── calculations.ts           # Portfolio math, price predictions, ROI
│       ├── cardData.ts               # Static card metadata (the 15 cards)
│       └── cn.ts                     # clsx + tailwind-merge utility
│
├── hooks/
│   ├── useCardTilt.ts                # Mouse position → tilt transform hook
│   ├── useAnimatedValue.ts           # Animate a number from → to
│   └── useScrollProgress.ts          # Scroll position as 0→1 progress
│
├── types/
│   └── index.ts                      # Global TypeScript type definitions
│
└── assets/
    ├── fonts/                        # Self-hosted font files
    ├── cards/                        # High-res card images (from pokemontcg.io)
    ├── slabs/                        # Slab frame images (PSA, BGS, CGC, SGC)
    └── textures/                     # Metal textures, noise maps for effects
```

### 4.1 Create the Structure

```bash
# Create all directories
mkdir -p src/app/collection
mkdir -p src/app/card/\[slug\]
mkdir -p src/app/hunt
mkdir -p src/app/api/cron/prices
mkdir -p src/app/api/cron/pop
mkdir -p src/components/three
mkdir -p src/components/cards
mkdir -p src/components/charts
mkdir -p src/components/hunt
mkdir -p src/components/ui
mkdir -p src/lib/db
mkdir -p src/lib/api
mkdir -p src/lib/store
mkdir -p src/lib/utils
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/assets/fonts
mkdir -p src/assets/cards
mkdir -p src/assets/slabs
mkdir -p src/assets/textures
```

---

## 5. Database Schema

### 5.1 Prisma Schema

Replace the contents of `prisma/schema.prisma` with the following. This schema is designed to store all data for 15 cards across multiple grading companies with full time-series price and population tracking.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// CARD IDENTITY
// ─────────────────────────────────────────────

model Card {
  id              String    @id @default(cuid())
  slug            String    @unique          // URL-friendly identifier: "umbreon-vmax-215"
  name            String                      // "Umbreon VMAX"
  pokemon         String                      // "Umbreon"
  set             String                      // "Evolving Skies"
  setCode         String                      // "swsh7" (pokemontcg.io set ID)
  cardNumber      String                      // "215/203"
  artType         String                      // "Alternate Art Secret"
  illustrator     String                      // "Keiichiro Ito"
  hp              Int                         // 310
  typing          String                      // "Dark"
  stage           String                      // "VMAX"
  era             String    @default("SWSH")  // Always "SWSH" for this collection
  imageUrl        String                      // High-res card art URL
  imageUrlSmall   String                      // Thumbnail URL
  tcgplayerId     String?                     // TCGPlayer product ID for API lookups
  displayOrder    Int                         // 1-15, controls sort order in UI

  // Relationships
  prices          PriceSnapshot[]
  popSnapshots    PopSnapshot[]
  gradedSales     GradedSale[]
  ownership       Ownership[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ─────────────────────────────────────────────
// PRICE TRACKING (time series)
// ─────────────────────────────────────────────

model PriceSnapshot {
  id              String    @id @default(cuid())
  cardId          String
  card            Card      @relation(fields: [cardId], references: [id])

  date            DateTime  @default(now())   // Snapshot date
  source          String                      // "tcgplayer" | "cardmarket" | "ebay"

  // Raw (ungraded) prices
  rawLow          Float?                      // Lowest NM listing
  rawMid          Float?                      // Mid-market price
  rawHigh         Float?                      // Highest listing
  rawMarket       Float?                      // TCGPlayer market price

  // Graded prices (nullable — not all sources have all grades)
  psa10           Float?
  psa9            Float?
  bgs10Pristine   Float?                      // BGS 10 Gold Label (Pristine)
  bgs10BlackLabel Float?                      // BGS 10 Black Label
  bgs95           Float?                      // BGS 9.5 Gem Mint
  cgc10Perfect    Float?                      // CGC 10 Perfect
  cgc10Pristine   Float?                      // CGC 10 Pristine
  cgc95           Float?                      // CGC 9.5

  createdAt       DateTime  @default(now())

  @@index([cardId, date])
  @@index([cardId, source, date])
}

// ─────────────────────────────────────────────
// POPULATION REPORTS (time series)
// ─────────────────────────────────────────────

model PopSnapshot {
  id              String    @id @default(cuid())
  cardId          String
  card            Card      @relation(fields: [cardId], references: [id])

  date            DateTime  @default(now())   // Snapshot date
  grader          String                      // "PSA" | "BGS" | "CGC" | "SGC"
  language        String    @default("English")

  // Full grade distribution
  total           Int       @default(0)       // Total graded by this company
  grade10         Int       @default(0)       // Top grade (PSA 10 / BGS 10 Pristine / CGC 10)
  blackLabel      Int       @default(0)       // BGS Black Label ONLY (all four subgrades = 10)
  grade95         Int       @default(0)       // 9.5
  grade9          Int       @default(0)       // 9
  grade85         Int       @default(0)       // 8.5
  grade8          Int       @default(0)       // 8
  grade7AndBelow  Int       @default(0)       // 7 and below (combined)
  authentic       Int       @default(0)       // Authentic/Altered (no numeric grade)

  createdAt       DateTime  @default(now())

  @@index([cardId, grader, date])
  @@unique([cardId, grader, date, language])
}

// ─────────────────────────────────────────────
// GRADED SALES (individual transactions)
// ─────────────────────────────────────────────

model GradedSale {
  id              String    @id @default(cuid())
  cardId          String
  card            Card      @relation(fields: [cardId], references: [id])

  date            DateTime                    // Date of sale
  platform        String                      // "ebay" | "fanatics" | "whatnot" | "pwcc"
  grader          String                      // "PSA" | "BGS" | "CGC" | "SGC" | "RAW"
  grade           String                      // "10" | "Black Label" | "9.5" | "9" | "Pristine" etc.
  price           Float                       // Sale price in USD
  shippingCost    Float?                      // Shipping if known
  listingUrl      String?                     // Link to the sold listing
  notes           String?                     // Any manual notes

  createdAt       DateTime  @default(now())

  @@index([cardId, date])
  @@index([cardId, grader, grade])
}

// ─────────────────────────────────────────────
// OWNERSHIP / HUNT TRACKER
// ─────────────────────────────────────────────

model Ownership {
  id              String    @id @default(cuid())
  cardId          String
  card            Card      @relation(fields: [cardId], references: [id])

  condition       String                      // "RAW" | "PSA" | "BGS" | "CGC" | "SGC"
  grade           String?                     // "10" | "Black Label" | "9.5" etc. (null if RAW)
  labelType       String?                     // "Gold" | "Black" | "Silver" (BGS only)
  certNumber      String?                     // Grading company cert number
  purchasePrice   Float?                      // What you paid
  purchaseDate    DateTime?                   // When you bought it
  purchaseSource  String?                     // Where you bought it
  isTarget        Boolean   @default(false)   // Is this the Black Label you're hunting?
  acquired        Boolean   @default(false)   // Do you physically have this?
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([cardId])
}
```

### 5.2 After Writing the Schema

```bash
# Generate the Prisma client
npx prisma generate

# Once you have a DATABASE_URL configured in .env, create the tables:
npx prisma db push
```

Do NOT run `db push` until the DATABASE_URL is set to a real PostgreSQL connection string (Neon or Supabase).

---

## 6. Design System Tokens

### 6.1 Color Palette

The site uses a dark base with card-specific accent colors that adapt per card detail page. Define these as CSS custom properties in `globals.css`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Base (Dark Vault) ── */
    --color-bg-primary: #06060b;          /* Near-black with blue shift */
    --color-bg-secondary: #0c0c14;        /* Slightly lighter panels */
    --color-bg-tertiary: #12121e;          /* Card backgrounds, elevated surfaces */
    --color-bg-hover: #1a1a2e;            /* Hover states */

    /* ── Text ── */
    --color-text-primary: #e8e6e3;        /* Primary text — warm white */
    --color-text-secondary: #8a8a9a;      /* Secondary text — muted */
    --color-text-tertiary: #4a4a5a;       /* Tertiary — very muted labels */

    /* ── Borders ── */
    --color-border-default: #1e1e2e;      /* Subtle panel borders */
    --color-border-hover: #2e2e42;        /* Hover border */
    --color-border-active: #3e3e56;       /* Active/focus border */

    /* ── Accent (default — overridden per card) ── */
    --color-accent: #c9a84c;              /* Default gold — vault / luxury */
    --color-accent-dim: #c9a84c33;        /* Accent at 20% opacity */
    --color-accent-glow: #c9a84c55;       /* Accent glow for shadows */

    /* ── Semantic ── */
    --color-positive: #34d399;            /* Price up / acquired */
    --color-negative: #f87171;            /* Price down / not acquired */
    --color-warning: #fbbf24;             /* Caution / approaching target */

    /* ── Grader Brand Colors ── */
    --color-psa: #d32f2f;                 /* PSA red */
    --color-bgs-gold: #c9a84c;           /* BGS gold label */
    --color-bgs-black: #1a1a1a;          /* BGS black label */
    --color-bgs-silver: #8a8a8a;         /* BGS silver label */
    --color-cgc: #1565c0;                /* CGC blue */
    --color-sgc: #2e7d32;                /* SGC green */

    /* ── Card-Specific Accents (applied via data attribute on body/page) ── */
    --card-umbreon: #8b5cf6;             /* Purple/gold */
    --card-rayquaza: #22c55e;            /* Green */
    --card-charizard: #f97316;           /* Orange/flame */
    --card-gengar: #7c3aed;             /* Deep purple */
    --card-giratina: #6366f1;           /* Indigo/shadow */
    --card-espeon: #ec4899;             /* Pink/psychic */
    --card-dragonite: #f59e0b;          /* Amber */
    --card-deoxys: #06b6d4;             /* Cyan */
    --card-aerodactyl: #78716c;         /* Stone/brown */
    --card-machamp: #a3a3a3;            /* Steel */
    --card-tyranitar: #65a30d;          /* Dark green */
    --card-starmie: #a855f7;            /* Lavender */
    --card-celebi: #4ade80;             /* Light green */
    --card-slowking: #f472b6;           /* Pink */
    --card-beedrill: #eab308;           /* Yellow */

    /* ── Spacing Scale ── */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    --space-3xl: 64px;
    --space-4xl: 96px;

    /* ── Animation Timing ── */
    --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --duration-slow: 500ms;
    --duration-page: 700ms;

    /* ── Typography Scale ── */
    --font-display: 'Space Grotesk', sans-serif;   /* Headlines, card names, big numbers */
    --font-body: 'Inter', sans-serif;                /* Body text, descriptions */
    --font-mono: 'JetBrains Mono', monospace;        /* Data, prices, grades, cert numbers */
  }
}
```

### 6.2 Typography

Install three fonts. These are chosen for specific roles:

**Space Grotesk** — Display / Headlines. Geometric sans with personality. The rounded terminals feel modern and slightly playful without being casual. Used for card names, section headers, big portfolio value numbers.

**Inter** — Body text. The industry standard for UI text. Clean, highly legible at all sizes. Used for descriptions, labels, navigation, body copy.

**JetBrains Mono** — Data / Monospace. Used for prices, grades, cert numbers, percentages, pop counts — anywhere precision and alignment matters. The monospace helps numbers feel authoritative and scannable.

```bash
# Install via next/font (recommended for Next.js — auto-optimizes, self-hosts)
# These are configured in the root layout, not installed as packages
```

In `src/app/layout.tsx`, import them:

```typescript
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

### 6.3 The `cn()` Utility

Create `src/lib/utils/cn.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This is used everywhere for conditional + merged Tailwind classes.

---

## 7. Core Layout Shell

### 7.1 Root Layout (`src/app/layout.tsx`)

The root layout wraps every page. It provides:
- Font variables on `<html>`
- Dark background on `<body>`
- Global providers (React Query, Zustand — though Zustand doesn't technically need a provider)
- The `<Navigation />` component
- A `<PageTransition />` wrapper for Framer Motion animated page transitions

```typescript
import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { Navigation } from '@/components/ui/Navigation';
import { Providers } from './providers';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Vault — Pokémon Card Portfolio',
  description: 'A curated collection of 15 SWSH-era alternate art Pokémon cards, tracked and visualized.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-[var(--font-body)] antialiased"
      >
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

### 7.2 Providers (`src/app/providers.tsx`)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes before refetch
            gcTime: 30 * 60 * 1000,         // 30 minutes cache
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 7.3 Navigation Component (`src/components/ui/Navigation.tsx`)

The navigation is minimal and should not compete with the content. It sits at the top of every page with a subtle frosted-glass effect.

Four links:
1. **The Vault** (logo/home) — left side
2. **Collection** — the 15-card grid
3. **The Hunt** — Black Label progress tracker
4. Portfolio value counter — right side, live-updating total value in monospace font

The nav should:
- Be fixed/sticky at top
- Have a frosted glass background (`backdrop-blur`)
- Show the current page with a subtle accent underline
- Collapse to a minimal state on scroll (reduce height, increase blur)

Create a stub for now:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const navLinks = [
  { href: '/', label: 'The Vault' },
  { href: '/collection', label: 'Collection' },
  { href: '/hunt', label: 'The Hunt' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm tracking-wide transition-colors duration-200',
                pathname === link.href
                  ? 'text-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                link.href === '/' && 'font-[var(--font-display)] text-base font-bold tracking-wider uppercase'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Portfolio Value */}
        <div className="font-[var(--font-mono)] text-sm text-[var(--color-text-secondary)]">
          {/* This will be replaced with a live AnimatedCounter component */}
          <span className="text-[var(--color-text-primary)]">$47,850</span>
          <span className="ml-1 text-[var(--color-text-tertiary)]">.99</span>
        </div>
      </div>
    </nav>
  );
}
```

---

## 8. Page Route Stubs

Create minimal stub files for each page route. These will be built out in subsequent PRDs. Each stub should render a centered page title so we can verify routing works.

### 8.1 Home Page (`src/app/page.tsx`)

```typescript
export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen pt-16">
      <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight">
        The Vault
      </h1>
    </div>
  );
}
```

### 8.2 Collection Page (`src/app/collection/page.tsx`)

```typescript
export default function CollectionPage() {
  return (
    <div className="flex items-center justify-center min-h-screen pt-16">
      <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight">
        Collection
      </h1>
    </div>
  );
}
```

### 8.3 Card Detail Page (`src/app/card/[slug]/page.tsx`)

```typescript
interface CardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;

  return (
    <div className="flex items-center justify-center min-h-screen pt-16">
      <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight">
        Card: {slug}
      </h1>
    </div>
  );
}
```

### 8.4 Hunt Page (`src/app/hunt/page.tsx`)

```typescript
export default function HuntPage() {
  return (
    <div className="flex items-center justify-center min-h-screen pt-16">
      <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight">
        The Hunt
      </h1>
    </div>
  );
}
```

---

## 9. Static Card Data Seed

### 9.1 Card Metadata File (`src/lib/utils/cardData.ts`)

This file contains the static metadata for all 15 cards. It is the source of truth for card identity. Database records will be seeded from this.

```typescript
export interface CardMeta {
  slug: string;
  name: string;
  pokemon: string;
  set: string;
  setCode: string;
  cardNumber: string;
  artType: string;
  illustrator: string;
  hp: number;
  typing: string;
  stage: string;
  displayOrder: number;
  accentColor: string;       // CSS variable name for this card's accent
}

export const CARDS: CardMeta[] = [
  {
    slug: 'umbreon-vmax-215',
    name: 'Umbreon VMAX',
    pokemon: 'Umbreon',
    set: 'Evolving Skies',
    setCode: 'swsh7',
    cardNumber: '215/203',
    artType: 'Alternate Art Secret',
    illustrator: 'Keiichiro Ito',
    hp: 310,
    typing: 'Dark',
    stage: 'VMAX',
    displayOrder: 1,
    accentColor: 'var(--card-umbreon)',
  },
  {
    slug: 'rayquaza-vmax-218',
    name: 'Rayquaza VMAX',
    pokemon: 'Rayquaza',
    set: 'Evolving Skies',
    setCode: 'swsh7',
    cardNumber: '218/203',
    artType: 'Alternate Art Secret',
    illustrator: 'Ryuta Fuse',
    hp: 320,
    typing: 'Dragon',
    stage: 'VMAX',
    displayOrder: 2,
    accentColor: 'var(--card-rayquaza)',
  },
  {
    slug: 'deoxys-vmax-gg45',
    name: 'Deoxys VMAX',
    pokemon: 'Deoxys',
    set: 'Crown Zenith: Galarian Gallery',
    setCode: 'swsh12pt5gg',
    cardNumber: 'GG45/GG70',
    artType: 'Ultra Rare',
    illustrator: 'Akira Komayama',
    hp: 330,
    typing: 'Psychic',
    stage: 'VMAX',
    displayOrder: 3,
    accentColor: 'var(--card-deoxys)',
  },
  {
    slug: 'gengar-vmax-271',
    name: 'Gengar VMAX',
    pokemon: 'Gengar',
    set: 'Fusion Strike',
    setCode: 'swsh8',
    cardNumber: '271/264',
    artType: 'Alternate Art Secret',
    illustrator: 'Sowsow',
    hp: 320,
    typing: 'Dark',
    stage: 'VMAX',
    displayOrder: 4,
    accentColor: 'var(--card-gengar)',
  },
  {
    slug: 'giratina-v-186',
    name: 'Giratina V',
    pokemon: 'Giratina',
    set: 'Lost Origin',
    setCode: 'swsh11',
    cardNumber: '186/196',
    artType: 'Alternate Full Art',
    illustrator: 'Shinji Kanda',
    hp: 220,
    typing: 'Dragon',
    stage: 'V',
    displayOrder: 5,
    accentColor: 'var(--card-giratina)',
  },
  {
    slug: 'aerodactyl-v-180',
    name: 'Aerodactyl V',
    pokemon: 'Aerodactyl',
    set: 'Lost Origin',
    setCode: 'swsh11',
    cardNumber: '180/196',
    artType: 'Alternate Full Art',
    illustrator: 'Nurikabe',
    hp: 210,
    typing: 'Fighting',
    stage: 'V',
    displayOrder: 6,
    accentColor: 'var(--card-aerodactyl)',
  },
  {
    slug: 'dragonite-v-192',
    name: 'Dragonite V',
    pokemon: 'Dragonite',
    set: 'Evolving Skies',
    setCode: 'swsh7',
    cardNumber: '192/203',
    artType: 'Ultra Rare',
    illustrator: 'Atsushi Furusawa',
    hp: 230,
    typing: 'Dragon',
    stage: 'V',
    displayOrder: 7,
    accentColor: 'var(--card-dragonite)',
  },
  {
    slug: 'espeon-v-180',
    name: 'Espeon V',
    pokemon: 'Espeon',
    set: 'Evolving Skies',
    setCode: 'swsh7',
    cardNumber: '180/203',
    artType: 'Ultra Rare',
    illustrator: 'Shibuzoh',
    hp: 200,
    typing: 'Psychic',
    stage: 'V',
    displayOrder: 8,
    accentColor: 'var(--card-espeon)',
  },
  {
    slug: 'machamp-v-172',
    name: 'Machamp V',
    pokemon: 'Machamp',
    set: 'Astral Radiance',
    setCode: 'swsh10',
    cardNumber: '172/189',
    artType: 'Ultra Rare',
    illustrator: 'Mitsuhiro Arita',
    hp: 220,
    typing: 'Fighting',
    stage: 'V',
    displayOrder: 9,
    accentColor: 'var(--card-machamp)',
  },
  {
    slug: 'tyranitar-v-155',
    name: 'Tyranitar V',
    pokemon: 'Tyranitar',
    set: 'Battle Styles',
    setCode: 'swsh5',
    cardNumber: '155/163',
    artType: 'Ultra Rare',
    illustrator: 'Mitsuhiro Arita',
    hp: 230,
    typing: 'Dark',
    stage: 'V',
    displayOrder: 10,
    accentColor: 'var(--card-tyranitar)',
  },
  {
    slug: 'charizard-v-154',
    name: 'Charizard V',
    pokemon: 'Charizard',
    set: 'Brilliant Stars',
    setCode: 'swsh9',
    cardNumber: '154/172',
    artType: 'Alternate Full Art',
    illustrator: 'Ryota Murayama',
    hp: 220,
    typing: 'Fire',
    stage: 'V',
    displayOrder: 11,
    accentColor: 'var(--card-charizard)',
  },
  {
    slug: 'starmie-v-tg13',
    name: 'Starmie V',
    pokemon: 'Starmie',
    set: 'Astral Radiance',
    setCode: 'swsh10tg',
    cardNumber: 'TG13/TG30',
    artType: 'Trainer Gallery',
    illustrator: 'Yuu Nishida',
    hp: 190,
    typing: 'Water',
    stage: 'V',
    displayOrder: 12,
    accentColor: 'var(--card-starmie)',
  },
  {
    slug: 'celebi-v-245',
    name: 'Celebi V',
    pokemon: 'Celebi',
    set: 'Fusion Strike',
    setCode: 'swsh8',
    cardNumber: '245/264',
    artType: 'Alternate Full Art',
    illustrator: 'Shibuzoh',
    hp: 190,
    typing: 'Grass',
    stage: 'V',
    displayOrder: 13,
    accentColor: 'var(--card-celebi)',
  },
  {
    slug: 'galarian-slowking-v-179',
    name: 'Galarian Slowking V',
    pokemon: 'Galarian Slowking',
    set: 'Chilling Reign',
    setCode: 'swsh6',
    cardNumber: '179/198',
    artType: 'Alternate Full Art',
    illustrator: 'Atsushi Furusawa',
    hp: 220,
    typing: 'Dark',
    stage: 'V',
    displayOrder: 14,
    accentColor: 'var(--card-slowking)',
  },
  {
    slug: 'beedrill-v-161',
    name: 'Beedrill V',
    pokemon: 'Beedrill',
    set: 'Astral Radiance',
    setCode: 'swsh10',
    cardNumber: '161/189',
    artType: 'Alternate Full Art',
    illustrator: 'Nurikabe',
    hp: 210,
    typing: 'Grass',
    stage: 'V',
    displayOrder: 15,
    accentColor: 'var(--card-beedrill)',
  },
];
```

---

## 10. Environment Configuration

### 10.1 `.env.local` Template

Create `.env.local` in the project root (this file is gitignored):

```env
# ── Database ──
DATABASE_URL="postgresql://user:password@host:5432/the-vault?sslmode=require"

# ── External APIs ──
POKEMONTCG_API_KEY=""           # Get from https://dev.pokemontcg.io
PRICETRACKER_API_KEY=""         # Get from https://pokemonpricetracker.com/api
SOLDCOMPS_API_KEY=""            # Get from https://sold-comps.com

# ── Cron Secret (protects API routes from unauthorized calls) ──
CRON_SECRET=""                  # Generate a random string
```

### 10.2 `.env.example`

Create `.env.example` (this file IS committed to git as a template):

```env
DATABASE_URL="postgresql://user:password@host:5432/the-vault?sslmode=require"
POKEMONTCG_API_KEY=""
PRICETRACKER_API_KEY=""
SOLDCOMPS_API_KEY=""
CRON_SECRET=""
```

### 10.3 `.gitignore` Additions

Ensure these are in `.gitignore` (Next.js creates a default one, but verify these are present):

```gitignore
# env
.env
.env.local
.env.production.local

# prisma
prisma/dev.db
prisma/dev.db-journal

# assets that may be large
src/assets/cards/*.png
src/assets/slabs/*.png
src/assets/textures/*.png
```

---

## 11. Prisma Client Singleton

### 11.1 `src/lib/db/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 12. Next.js Configuration

### 12.1 `next.config.ts`

Three.js requires specific webpack configuration to work with Next.js. Update the config:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Allow images from pokemontcg.io CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
    ],
  },

  // Transpile Three.js packages for proper module resolution
  transpilePackages: ['three'],

  // Webpack config for Three.js GLSL shader support
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader'],
    });
    return config;
  },
};

export default nextConfig;
```

---

## 13. Final Verification

After completing all steps in this PRD, run the following checks:

```bash
# 1. Development server starts cleanly
npm run dev
# → Should start on localhost:3000 with no errors

# 2. All four routes resolve
# → http://localhost:3000          → "The Vault"
# → http://localhost:3000/collection → "Collection"
# → http://localhost:3000/card/umbreon-vmax-215 → "Card: umbreon-vmax-215"
# → http://localhost:3000/hunt      → "The Hunt"

# 3. Navigation is visible and links work on all pages

# 4. Prisma client generates without errors
npx prisma generate

# 5. TypeScript compiles without errors
npx tsc --noEmit

# 6. Build completes successfully
npm run build
```

If all six checks pass, PRD-01 is complete. The foundation is laid.

---

## 14. What Comes Next

This PRD establishes the skeleton. The next PRDs in sequence will be:

| PRD | Focus | Description |
|-----|-------|-------------|
| **02** | Vault Door & Home Page | Three.js vault door opening animation, portfolio overview with animated value counter, card preview grid |
| **03** | Card Tilt & Collection Grid | The holographic card tilt component, the 15-card collection grid with filtering and hover effects |
| **04** | Card Detail Page | Slab viewer with grader switching, price history charts, pop report visualization, card-specific accent colors |
| **05** | Data Pipeline & API Integration | Connect pokemontcg.io, PriceTracker, SoldComps APIs, build cron jobs, seed database |
| **06** | The Hunt Tracker | Black Label quest progress, ownership management, acquisition targets |
| **07** | Charts & Advanced Visualization | Rarity aurora rings, portfolio constellation, price prediction models |
| **08** | Scroll Animations & Page Transitions | GSAP ScrollTrigger sequences, Framer Motion page morphs, micro-interactions |
| **09** | Polish & Performance | Lazy loading, bundle optimization, lighthouse audit, mobile responsiveness |
| **10** | Deployment & Data Seeding | Vercel production config, Neon/Supabase setup, initial data population, cron scheduling |
