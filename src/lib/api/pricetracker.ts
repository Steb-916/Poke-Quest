import type { GradedPriceData } from './types';
import { checkRateLimit, logApiCall } from './rateLimiter';

const API_BASE = 'https://www.pokemonpricetracker.com/api/v2';

export async function fetchGradedPrices(
  tcgplayerId: string
): Promise<GradedPriceData | null> {
  const rateCheck = await checkRateLimit('pricetracker');
  if (!rateCheck.allowed) {
    console.warn(`pricetracker rate limit reached: ${rateCheck.used}/${rateCheck.limit} per ${rateCheck.period}`);
    return null;
  }

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
    return mapToGradedPrices(data.data);
  } catch (error) {
    await logApiCall('pricetracker', `cards/${tcgplayerId}`, false, Date.now() - start);
    console.error(`Failed to fetch graded prices for ${tcgplayerId}:`, error);
    return null;
  }
}

function mapToGradedPrices(apiData: Record<string, unknown>): GradedPriceData {
  const prices = (apiData as Record<string, Record<string, number>>)?.gradedPrices || {};
  return {
    psa10: prices.psa10,
    psa9: prices.psa9,
    bgs10Pristine: prices.bgs10,
    bgs10BlackLabel: prices.bgsBlackLabel,
    bgs95: prices.bgs95,
    cgc10Perfect: prices.cgc10Perfect,
    cgc10Pristine: prices.cgc10,
    cgc95: prices.cgc95,
  };
}

export function mapToPriceSnapshot(
  gradedPrices: GradedPriceData,
  rawPrices: { rawLow?: number; rawMid?: number; rawHigh?: number; rawMarket?: number },
  cardId: string
) {
  return {
    cardId,
    source: 'pricetracker' as const,
    ...rawPrices,
    ...gradedPrices,
  };
}
