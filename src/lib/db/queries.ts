import { prisma } from './prisma';

// ── Card Queries ──

export async function getAllCards() {
  return prisma.card.findMany({
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getCardBySlug(slug: string) {
  return prisma.card.findUnique({
    where: { slug },
    include: {
      ownership: true,
    },
  });
}

// ── Price Queries ──

export async function getLatestPrices(cardId: string) {
  // Grab the most recent snapshots and merge non-null values across them.
  // This ensures a manual Black Label entry doesn't wipe out the raw price
  // from a pokemontcg.io fetch (or vice versa).
  const recent = await prisma.priceSnapshot.findMany({
    where: { cardId },
    orderBy: { date: 'desc' },
    take: 10,
  });

  if (recent.length === 0) return null;

  const merged = { ...recent[0] };
  const fields = [
    'rawLow', 'rawMid', 'rawHigh', 'rawMarket',
    'psa10', 'psa9',
    'bgs10Pristine', 'bgs10BlackLabel', 'bgs95',
    'cgc10Perfect', 'cgc10Pristine', 'cgc95',
  ] as const;

  for (const field of fields) {
    if (merged[field] == null) {
      for (const snapshot of recent) {
        if (snapshot[field] != null) {
          (merged as Record<string, unknown>)[field] = snapshot[field];
          break;
        }
      }
    }
  }

  return merged;
}

export async function getPriceHistory(cardId: string, days: number = 365) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.priceSnapshot.findMany({
    where: {
      cardId,
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  });
}

// ── Pop Report Queries ──

export async function getLatestPop(cardId: string, grader?: string) {
  const where: Record<string, unknown> = { cardId };
  if (grader) where.grader = grader;

  return prisma.popSnapshot.findMany({
    where,
    orderBy: { date: 'desc' },
    distinct: ['grader'],
  });
}

export async function getPopHistory(cardId: string, grader: string) {
  return prisma.popSnapshot.findMany({
    where: { cardId, grader },
    orderBy: { date: 'asc' },
  });
}

// ── Sales Queries ──

export async function getRecentSales(cardId: string, limit: number = 20) {
  return prisma.gradedSale.findMany({
    where: { cardId },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

export async function getSalesByGrader(
  cardId: string,
  grader: string,
  grade?: string
) {
  const where: Record<string, unknown> = { cardId, grader };
  if (grade) where.grade = grade;

  return prisma.gradedSale.findMany({
    where,
    orderBy: { date: 'desc' },
  });
}

// ── Market Intelligence Queries ──

export async function getLatestPricesForAllCards(): Promise<Map<string, Record<string, unknown>>> {
  const cards = await prisma.card.findMany({ select: { id: true } });
  const map = new Map<string, Record<string, unknown>>();

  for (const card of cards) {
    const snapshot = await prisma.priceSnapshot.findFirst({
      where: { cardId: card.id },
      orderBy: { date: 'desc' },
    });
    if (snapshot) map.set(card.id, snapshot as unknown as Record<string, unknown>);
  }

  return map;
}

export async function getPricesAtDaysAgo(daysAgo: number): Promise<Map<string, Record<string, unknown>>> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  const windowStart = new Date(targetDate);
  windowStart.setDate(windowStart.getDate() - 3);
  const windowEnd = new Date(targetDate);
  windowEnd.setDate(windowEnd.getDate() + 3);

  const cards = await prisma.card.findMany({ select: { id: true } });
  const map = new Map<string, Record<string, unknown>>();

  for (const card of cards) {
    let snapshot = await prisma.priceSnapshot.findFirst({
      where: { cardId: card.id, date: { gte: windowStart, lte: windowEnd } },
      orderBy: { date: 'desc' },
    });

    if (!snapshot) {
      snapshot = await prisma.priceSnapshot.findFirst({
        where: { cardId: card.id },
        orderBy: { date: 'asc' },
      });
    }

    if (snapshot) map.set(card.id, snapshot as unknown as Record<string, unknown>);
  }

  return map;
}

export async function getRecentSalesForAllCards(days: number = 30): Promise<Map<string, Record<string, unknown>[]>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.gradedSale.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
  });

  const map = new Map<string, Record<string, unknown>[]>();
  for (const sale of sales) {
    if (!map.has(sale.cardId)) map.set(sale.cardId, []);
    map.get(sale.cardId)!.push(sale as unknown as Record<string, unknown>);
  }

  return map;
}

// ── Visualization Data Queries ──

export async function getBlackLabelPops(): Promise<Map<string, number>> {
  const cards = await prisma.card.findMany({ select: { id: true } });
  const map = new Map<string, number>();
  for (const card of cards) {
    const bgsPop = await prisma.popSnapshot.findFirst({
      where: { cardId: card.id, grader: 'BGS' },
      orderBy: { date: 'desc' },
    });
    map.set(card.id, bgsPop?.blackLabel ?? 0);
  }
  return map;
}

export async function getAllPriceSnapshots() {
  return prisma.priceSnapshot.findMany({
    select: { cardId: true, date: true, psa10: true, rawMarket: true, rawMid: true },
    orderBy: { date: 'asc' },
  });
}

export async function getRadarChartData() {
  const cards = await prisma.card.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { displayOrder: 'asc' },
  });
  const blPops = new Map<string, number>();
  const prices = new Map<string, number>();
  const priceChanges = new Map<string, number>();
  const salesCounts = new Map<string, number>();
  const gradeRates = new Map<string, number>();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const card of cards) {
    const bgsPop = await prisma.popSnapshot.findFirst({ where: { cardId: card.id, grader: 'BGS' }, orderBy: { date: 'desc' } });
    blPops.set(card.id, bgsPop?.blackLabel ?? 0);

    const latestPrice = await prisma.priceSnapshot.findFirst({ where: { cardId: card.id }, orderBy: { date: 'desc' } });
    prices.set(card.id, latestPrice?.psa10 ?? latestPrice?.rawMarket ?? 0);

    const oldPrice = await prisma.priceSnapshot.findFirst({ where: { cardId: card.id, date: { lte: thirtyDaysAgo } }, orderBy: { date: 'desc' } });
    if (latestPrice && oldPrice) {
      const curr = latestPrice.psa10 ?? latestPrice.rawMarket ?? 0;
      const prev = oldPrice.psa10 ?? oldPrice.rawMarket ?? 0;
      if (prev > 0) priceChanges.set(card.id, ((curr - prev) / prev) * 100);
    }

    const sc = await prisma.gradedSale.count({ where: { cardId: card.id, date: { gte: thirtyDaysAgo } } });
    salesCounts.set(card.id, sc);

    const psaPop = await prisma.popSnapshot.findFirst({ where: { cardId: card.id, grader: 'PSA' }, orderBy: { date: 'desc' } });
    if (psaPop && psaPop.total > 0) gradeRates.set(card.id, (psaPop.grade10 / psaPop.total) * 100);
  }

  return { cards, blPops, prices, priceChanges, salesCounts, gradeRates };
}

// ── Portfolio History ──

export async function getPortfolioHistory(days: number = 365) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await prisma.priceSnapshot.findMany({
    where: { date: { gte: since } },
    select: { date: true, rawMarket: true },
    orderBy: { date: 'asc' },
  });

  const byDate = new Map<string, number>();
  for (const s of snapshots) {
    if (!s.rawMarket) continue;
    const key = s.date.toISOString().split('T')[0];
    byDate.set(key, (byDate.get(key) || 0) + s.rawMarket);
  }

  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

// ── Ownership Queries ──

export async function getOwnership(cardId: string) {
  return prisma.ownership.findFirst({
    where: { cardId },
  });
}

export async function getAllOwnership() {
  return prisma.ownership.findMany({
    include: { card: true },
  });
}

// ── Portfolio Aggregate Queries ──

export async function getPortfolioValue() {
  const cards = await prisma.card.findMany({
    include: {
      prices: {
        orderBy: { date: 'desc' },
        take: 10, // Take multiple to find the first non-null rawMarket
      },
    },
  });

  let total = 0;
  for (const card of cards) {
    // Find the first snapshot that has rawMarket (may not be the latest if manual BL entries are newer)
    const withRawMarket = card.prices.find((p) => p.rawMarket != null);
    if (withRawMarket?.rawMarket) total += withRawMarket.rawMarket;
  }

  return total;
}

export async function getHuntProgress() {
  const ownership = await prisma.ownership.findMany();

  const total = 15;
  const acquired = ownership.filter((o) => o.acquired).length;
  const blackLabels = ownership.filter(
    (o) => o.acquired && o.labelType === 'Black'
  ).length;

  return { total, acquired, blackLabels };
}
