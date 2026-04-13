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
        take: 1,
      },
    },
  });

  let total = 0;
  for (const card of cards) {
    const latest = card.prices[0];
    if (latest?.rawMarket) total += latest.rawMarket;
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
