import type { PokemonTcgCard, TcgPriceData } from './types';
import { checkRateLimit, logApiCall } from './rateLimiter';

const API_BASE = 'https://api.pokemontcg.io/v2';

export async function fetchCardData(
  setCode: string,
  cardNumber: string
): Promise<PokemonTcgCard | null> {
  const num = cardNumber.split('/')[0];
  const cardId = `${setCode}-${num}`;

  const rateCheck = await checkRateLimit('pokemontcg');
  if (!rateCheck.allowed) {
    console.warn(`pokemontcg rate limit reached: ${rateCheck.used}/${rateCheck.limit} per ${rateCheck.period}`);
    return null;
  }

  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      headers: {
        'X-Api-Key': process.env.POKEMONTCG_API_KEY || '',
      },
    });

    await logApiCall('pokemontcg', `cards/${cardId}`, res.ok, Date.now() - start);

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    await logApiCall('pokemontcg', `cards/${cardId}`, false, Date.now() - start);
    console.error(`Failed to fetch card ${cardId}:`, error);
    return null;
  }
}

export function extractPriceData(card: PokemonTcgCard): TcgPriceData {
  const prices = card.tcgplayer?.prices?.holofoil || card.tcgplayer?.prices?.reverseHolofoil;
  if (!prices) return {};

  return {
    rawLow: prices.low,
    rawMid: prices.mid,
    rawHigh: prices.high,
    rawMarket: prices.market,
  };
}

export async function fetchAllCardPrices(
  cards: { setCode: string; cardNumber: string; slug: string }[]
): Promise<Map<string, TcgPriceData>> {
  const results = new Map<string, TcgPriceData>();

  for (const card of cards) {
    const data = await fetchCardData(card.setCode, card.cardNumber);
    if (data) {
      results.set(card.slug, extractPriceData(data));
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
