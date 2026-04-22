import type { GradedPriceData } from './types';
import { checkRateLimit, logApiCall } from './rateLimiter';

const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';

// Combined price data returned by fetchCardPrices
interface CardPriceResult {
  rawLow?: number;
  rawMid?: number;
  rawHigh?: number;
  rawMarket?: number;
  psa10?: number;
  psa9?: number;
  bgs10Pristine?: number;
  bgs10BlackLabel?: number;
  bgs95?: number;
  cgc10Perfect?: number;
  cgc10Pristine?: number;
  cgc95?: number;
}

/**
 * Fetch all available prices for a card by name + set + card number.
 * Uses limit=3 to minimize credit usage, then matches by card number.
 */
export async function fetchCardPrices(
  cardName: string,
  setName: string,
  cardNumber?: string
): Promise<CardPriceResult | null> {
  const rateCheck = await checkRateLimit('pricetracker');
  if (!rateCheck.allowed) {
    console.warn(`pricetracker rate limit reached: ${rateCheck.used}/${rateCheck.limit} per ${rateCheck.period}`);
    return null;
  }

  const start = Date.now();
  try {
    // Search by pokemon name + set, limit=2 to minimize credit usage (2 credits per card)
    const searchUrl = `${API_BASE}/cards?search=${encodeURIComponent(cardName)}&set=${encodeURIComponent(setName)}&limit=2`;

    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${process.env.PRICETRACKER_API_KEY || ''}`,
      },
    });

    await logApiCall('pricetracker', `cards/search/${cardName}`, res.ok, Date.now() - start);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.warn(`PriceTracker API error for ${cardName}:`, errBody);
      return null;
    }

    const data = await res.json();
    const results = data.data as Record<string, unknown>[];

    if (!results || results.length === 0) return null;

    // Find the best match by card number if provided
    let match = results[0];
    if (cardNumber) {
      const exactMatch = results.find(
        (r) => (r.cardNumber as string) === cardNumber
      );
      if (exactMatch) match = exactMatch;
    }

    // Extract prices from the matched card
    const prices = match.prices as Record<string, unknown> | undefined;

    return {
      rawMarket: (prices?.market as number) ?? undefined,
      rawLow: (prices?.low as number) ?? undefined,
    };
  } catch (error) {
    await logApiCall('pricetracker', `cards/search/${cardName}`, false, Date.now() - start);
    console.error(`Failed to fetch prices for ${cardName}:`, error);
    return null;
  }
}

/**
 * Legacy function — fetch graded prices by TCGPlayer ID.
 * Kept for backward compatibility but fetchCardPrices is preferred.
 */
export async function fetchGradedPrices(
  tcgplayerId: string
): Promise<GradedPriceData | null> {
  const rateCheck = await checkRateLimit('pricetracker');
  if (!rateCheck.allowed) return null;

  const start = Date.now();
  try {
    const res = await fetch(
      `${API_BASE}/cards?tcgPlayerId=${tcgplayerId}&includeEbay=true`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PRICETRACKER_API_KEY || ''}`,
        },
      }
    );

    await logApiCall('pricetracker', `cards/${tcgplayerId}`, res.ok, Date.now() - start);

    if (!res.ok) return null;
    const data = await res.json();
    const gradedPrices = (data.data as Record<string, Record<string, number>>)?.gradedPrices || {};

    return {
      psa10: gradedPrices.psa10,
      psa9: gradedPrices.psa9,
      bgs10Pristine: gradedPrices.bgs10,
      bgs10BlackLabel: gradedPrices.bgsBlackLabel,
      bgs95: gradedPrices.bgs95,
      cgc10Perfect: gradedPrices.cgc10Perfect,
      cgc10Pristine: gradedPrices.cgc10,
      cgc95: gradedPrices.cgc95,
    };
  } catch (error) {
    await logApiCall('pricetracker', `cards/${tcgplayerId}`, false, Date.now() - start);
    return null;
  }
}
