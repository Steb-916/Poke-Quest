// Market intelligence calculations

type SupplyStatus = 'tight' | 'stable' | 'surplus';

export interface MarketMover {
  cardId: string;
  slug: string;
  name: string;
  pokemon: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  changeAbsolute: number;
  direction: 'up' | 'down' | 'flat';
  priceField: string;
}

export interface SupplySignal {
  cardId: string;
  slug: string;
  name: string;
  pokemon: string;
  status: SupplyStatus;
  recentSalesCount: number;
  previousSalesCount: number;
  velocityChange: number;
  avgDaysBetweenSales: number;
  lastSaleDate: Date | null;
  daysSinceLastSale: number;
}

export interface VelocityResult {
  recentCount: number;
  previousCount: number;
  velocityPercent: number;
  avgGapDays: number;
  daysSinceLastSale: number;
  status: SupplyStatus;
}

interface CardRef {
  id: string;
  slug: string;
  name: string;
  pokemon: string;
}

interface PriceSnapshotLike {
  psa10?: number | null;
  rawMarket?: number | null;
  rawMid?: number | null;
  rawLow?: number | null;
  [key: string]: unknown;
}

interface SaleLike {
  date: Date;
  [key: string]: unknown;
}

const PRICE_FIELDS = ['psa10', 'rawMarket', 'rawMid', 'rawLow'] as const;

export function calculateMarketMovers(
  cards: CardRef[],
  currentSnapshots: Map<string, PriceSnapshotLike>,
  previousSnapshots: Map<string, PriceSnapshotLike>,
  options: { topN?: number } = {}
): { gainers: MarketMover[]; losers: MarketMover[]; flat: MarketMover[] } {
  const { topN = 5 } = options;
  const movers: MarketMover[] = [];

  for (const card of cards) {
    const current = currentSnapshots.get(card.id);
    const previous = previousSnapshots.get(card.id);
    if (!current || !previous) continue;

    let usedField: string | null = null;
    let currentPrice = 0;
    let previousPrice = 0;

    for (const field of PRICE_FIELDS) {
      const c = current[field];
      const p = previous[field];
      if (c != null && (c as number) > 0 && p != null && (p as number) > 0) {
        usedField = field;
        currentPrice = c as number;
        previousPrice = p as number;
        break;
      }
    }

    if (!usedField) continue;

    const changeAbsolute = currentPrice - previousPrice;
    const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

    movers.push({
      cardId: card.id,
      slug: card.slug,
      name: card.name,
      pokemon: card.pokemon,
      currentPrice,
      previousPrice,
      changePercent,
      changeAbsolute,
      direction: changePercent > 0.5 ? 'up' : changePercent < -0.5 ? 'down' : 'flat',
      priceField: usedField,
    });
  }

  movers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return {
    gainers: movers.filter((m) => m.direction === 'up').slice(0, topN),
    losers: movers.filter((m) => m.direction === 'down').slice(0, topN),
    flat: movers.filter((m) => m.direction === 'flat'),
  };
}

export function calculateSingleCardVelocity(
  sales: SaleLike[],
  now: Date = new Date()
): VelocityResult {
  const WINDOW_DAYS = 14;

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - WINDOW_DAYS);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - WINDOW_DAYS);

  const currentWindowSales = sales.filter((s) => s.date >= currentStart && s.date <= now);
  const previousWindowSales = sales.filter((s) => s.date >= previousStart && s.date < currentStart);

  const recentCount = currentWindowSales.length;
  const prevCount = previousWindowSales.length;
  const velocityPercent = ((recentCount - prevCount) / Math.max(prevCount, 1)) * 100;

  let avgGapDays = 0;
  if (currentWindowSales.length >= 2) {
    const sorted = [...currentWindowSales].sort((a, b) => a.date.getTime() - b.date.getTime());
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
    }
    avgGapDays = totalGap / (sorted.length - 1);
  } else if (currentWindowSales.length === 1) {
    avgGapDays = WINDOW_DAYS;
  } else {
    avgGapDays = WINDOW_DAYS * 2;
  }

  const allSorted = [...sales].sort((a, b) => b.date.getTime() - a.date.getTime());
  const lastSaleDate = allSorted.length > 0 ? allSorted[0].date : null;
  const daysSinceLastSale = lastSaleDate
    ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let status: SupplyStatus;
  if (daysSinceLastSale >= 14) {
    status = 'tight';
  } else if (velocityPercent > 20 && avgGapDays < 5) {
    status = 'tight';
  } else if (velocityPercent < -30 && avgGapDays > 7) {
    status = 'surplus';
  } else {
    status = 'stable';
  }

  return {
    recentCount,
    previousCount: prevCount,
    velocityPercent,
    avgGapDays: Math.round(avgGapDays * 10) / 10,
    daysSinceLastSale,
    status,
  };
}

export function calculateSupplySignals(
  cards: CardRef[],
  salesByCard: Map<string, SaleLike[]>,
  now: Date = new Date()
): SupplySignal[] {
  const signals: SupplySignal[] = [];

  for (const card of cards) {
    const sales = salesByCard.get(card.id) || [];
    const velocity = calculateSingleCardVelocity(sales, now);

    signals.push({
      cardId: card.id,
      slug: card.slug,
      name: card.name,
      pokemon: card.pokemon,
      status: velocity.status,
      recentSalesCount: velocity.recentCount,
      previousSalesCount: velocity.previousCount,
      velocityChange: velocity.velocityPercent,
      avgDaysBetweenSales: velocity.avgGapDays,
      lastSaleDate: sales.length > 0 ? [...sales].sort((a, b) => b.date.getTime() - a.date.getTime())[0].date : null,
      daysSinceLastSale: velocity.daysSinceLastSale,
    });
  }

  const ORDER: Record<SupplyStatus, number> = { tight: 0, stable: 1, surplus: 2 };
  signals.sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return signals;
}

// ── Scarcity Spectrum ──

export interface ScarcityEntry {
  cardId: string;
  slug: string;
  name: string;
  pokemon: string;
  blPop: number;
  tier: 'mythic' | 'ultra' | 'rare' | 'uncommon';
  position: number;
}

export function buildScarcitySpectrum(
  cards: { id: string; slug: string; name: string; pokemon: string }[],
  blPops: Map<string, number>
): ScarcityEntry[] {
  const entries: ScarcityEntry[] = cards.map((card) => {
    const pop = blPops.get(card.id) ?? 0;
    const tier: ScarcityEntry['tier'] = pop === 0 ? 'mythic' : pop <= 5 ? 'ultra' : pop <= 50 ? 'rare' : 'uncommon';
    return { cardId: card.id, slug: card.slug, name: card.name, pokemon: card.pokemon, blPop: pop, tier, position: 0 };
  });

  entries.sort((a, b) => a.blPop - b.blPop);
  entries.forEach((e, i) => { e.position = entries.length > 1 ? (i / (entries.length - 1)) * 100 : 50; });

  return entries;
}

// ── Radar Chart Scores ──

export interface RadarScore {
  axis: string;
  value: number;
  rawValue: string;
}

export function calculateRadarScores(
  cardId: string,
  allCardsData: {
    cards: { id: string }[];
    blPops: Map<string, number>;
    prices: Map<string, number>;
    priceChanges: Map<string, number>;
    salesCounts: Map<string, number>;
    gradeRates: Map<string, number>;
  }
): RadarScore[] {
  const { cards, blPops, prices, priceChanges, salesCounts, gradeRates } = allCardsData;

  function normalize(cId: string, dataMap: Map<string, number>, invert = false): { value: number; raw: number } {
    const values = cards.map((c) => dataMap.get(c.id) ?? 0).filter((v) => v !== 0);
    if (values.length === 0) return { value: 50, raw: 0 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const raw = dataMap.get(cId) ?? 0;
    if (max === min) return { value: 50, raw };
    let n = ((raw - min) / (max - min)) * 100;
    if (invert) n = 100 - n;
    return { value: Math.round(Math.max(0, Math.min(100, n))), raw };
  }

  const scarcity = normalize(cardId, blPops, true);
  const value = normalize(cardId, prices);
  const momentum = normalize(cardId, priceChanges);
  const demand = normalize(cardId, salesCounts);
  const gradeRate = normalize(cardId, gradeRates);

  return [
    { axis: 'Scarcity', value: scarcity.value, rawValue: `BL Pop: ${scarcity.raw}` },
    { axis: 'Value', value: value.value, rawValue: `$${Math.round(value.raw).toLocaleString()}` },
    { axis: 'Momentum', value: momentum.value, rawValue: `${momentum.raw > 0 ? '+' : ''}${momentum.raw.toFixed(1)}%` },
    { axis: 'Demand', value: demand.value, rawValue: `${demand.raw} sales / 30d` },
    { axis: 'Grade Rate', value: gradeRate.value, rawValue: `${gradeRate.raw.toFixed(1)}% PSA 10` },
  ];
}

// ── Portfolio Time Series ──

export interface PortfolioDataPoint {
  date: string;
  totalValue: number;
  cardCount: number;
}

export function buildPortfolioTimeSeries(
  snapshots: { cardId: string; date: Date; psa10: number | null; rawMarket: number | null; rawMid: number | null }[],
  cardIds: string[]
): PortfolioDataPoint[] {
  if (snapshots.length === 0) return [];

  const getPrice = (s: typeof snapshots[0]) => s.psa10 ?? s.rawMarket ?? s.rawMid ?? 0;
  const lastKnown = new Map<string, number>();
  const byDate = new Map<string, Map<string, number>>();
  const sorted = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const snap of sorted) {
    const dateKey = snap.date.toISOString().split('T')[0];
    const price = getPrice(snap);
    if (price > 0) lastKnown.set(snap.cardId, price);

    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, new Map(lastKnown));
    } else if (price > 0) {
      byDate.get(dateKey)!.set(snap.cardId, price);
    }
  }

  const series: PortfolioDataPoint[] = [];
  for (const [dateKey, cardPrices] of byDate) {
    let total = 0, count = 0;
    for (const cId of cardIds) {
      const p = cardPrices.get(cId);
      if (p && p > 0) { total += p; count++; }
    }
    series.push({ date: dateKey, totalValue: Math.round(total * 100) / 100, cardCount: count });
  }

  return series;
}
