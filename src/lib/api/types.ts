// Shared API response types

export interface PokemonTcgCard {
  id: string;
  name: string;
  images: { small: string; large: string };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: {
      holofoil?: { low: number; mid: number; high: number; market: number };
      reverseHolofoil?: { low: number; mid: number; high: number; market: number };
    };
  };
}

export interface TcgPriceData {
  rawLow?: number;
  rawMid?: number;
  rawHigh?: number;
  rawMarket?: number;
}

export interface GradedPriceData {
  psa10?: number;
  psa9?: number;
  bgs10Pristine?: number;
  bgs10BlackLabel?: number;
  bgs95?: number;
  cgc10Perfect?: number;
  cgc10Pristine?: number;
  cgc95?: number;
}

export interface SoldListing {
  date: Date;
  platform: string;
  grader: string;
  grade: string;
  price: number;
  shippingCost?: number;
  listingUrl?: string;
}

export interface PopData {
  grader: string;
  total: number;
  grade10: number;
  blackLabel?: number;
  grade95?: number;
  grade9?: number;
  grade85?: number;
  grade8?: number;
  grade7AndBelow?: number;
  authentic?: number;
}
