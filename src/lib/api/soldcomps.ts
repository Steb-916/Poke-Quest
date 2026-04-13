import type { SoldListing } from './types';
import { checkRateLimit, logApiCall } from './rateLimiter';

const API_BASE = 'https://sold-comps.com/api/v1';

export async function fetchSoldListings(keyword: string): Promise<SoldListing[]> {
  const rateCheck = await checkRateLimit('soldcomps');
  if (!rateCheck.allowed) {
    console.warn(`soldcomps rate limit reached: ${rateCheck.used}/${rateCheck.limit} per ${rateCheck.period}`);
    return [];
  }

  const start = Date.now();
  try {
    const res = await fetch(
      `${API_BASE}/scrape?keyword=${encodeURIComponent(keyword)}&site=EBAY-US`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SOLDCOMPS_API_KEY || ''}`,
        },
      }
    );

    await logApiCall('soldcomps', `scrape/${keyword}`, res.ok, Date.now() - start);

    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: Record<string, unknown>) => ({
      date: new Date(item.soldDate as string),
      platform: 'ebay',
      grader: 'RAW',
      grade: 'NM',
      price: item.soldPrice as number,
      shippingCost: item.shippingCost as number | undefined,
      listingUrl: item.url as string | undefined,
    }));
  } catch (error) {
    await logApiCall('soldcomps', `scrape/${keyword}`, false, Date.now() - start);
    console.error(`Failed to fetch sold listings for "${keyword}":`, error);
    return [];
  }
}

export async function fetchCardSoldData(
  cardName: string,
  cardNumber: string,
  grader?: string,
  grade?: string
): Promise<SoldListing[]> {
  let keyword = `${cardName} ${cardNumber}`;
  if (grader) keyword += ` ${grader}`;
  if (grade) keyword += ` ${grade}`;

  const results = await fetchSoldListings(keyword);

  return results.map((item) => ({
    ...item,
    grader: grader || 'RAW',
    grade: grade || 'NM',
  }));
}
