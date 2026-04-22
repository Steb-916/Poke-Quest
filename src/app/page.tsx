import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { CardTilt } from '@/components/cards/CardTilt';
import { PortfolioHeader } from '@/components/ui/PortfolioHeader';
import { VaultOverlayLoader } from '@/components/three/VaultOverlayLoader';
import { VaultZoomWrapper } from '@/components/three/VaultZoomWrapper';
import { LazyPortfolioValueChart, LazyMarketMovers, LazySupplySignals, LazyScarcitySpectrum } from '@/components/charts/DynamicCharts';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { MarketPulseDivider } from '@/components/ui/MarketPulseDivider';
import { EraContext } from '@/components/ui/EraContext';
import { calculateMarketMovers, calculateSupplySignals, buildScarcitySpectrum, buildPortfolioTimeSeries } from '@/lib/utils/calculations';
import type { MarketMover, ScarcityEntry, PortfolioDataPoint } from '@/lib/utils/calculations';

type TimeWindow = '7D' | '30D' | '90D';
interface MoversData { gainers: MarketMover[]; losers: MarketMover[]; flat: MarketMover[] }

async function getPageData() {
  try {
    const { getPortfolioValue, getHuntProgress, getAllCards, getLatestPricesForAllCards, getPricesAtDaysAgo, getRecentSalesForAllCards, getBlackLabelPops, getAllPriceSnapshots } = await import('@/lib/db/queries');

    const [portfolioValue, huntProgress, cards, currentPrices, prices7d, prices30d, prices90d, recentSales, blPops, allSnapshots] = await Promise.all([
      getPortfolioValue(),
      getHuntProgress(),
      getAllCards(),
      getLatestPricesForAllCards(),
      getPricesAtDaysAgo(7),
      getPricesAtDaysAgo(30),
      getPricesAtDaysAgo(90),
      getRecentSalesForAllCards(30),
      getBlackLabelPops(),
      getAllPriceSnapshots(),
    ]);

    const cardMeta = cards.map((c) => ({ id: c.id, slug: c.slug, name: c.name, pokemon: c.pokemon }));

    // Wrap calculations in individual try/catches so one failure doesn't kill everything
    let moversByWindow: Record<TimeWindow, MoversData> | undefined;
    let supplySignals;
    let scarcityEntries;
    let portfolioTimeSeries;
    const trendMap: Record<string, { changePercent: number; direction: string }> = {};

    try {
      moversByWindow = {
        '7D': calculateMarketMovers(cardMeta, currentPrices, prices7d),
        '30D': calculateMarketMovers(cardMeta, currentPrices, prices30d),
        '90D': calculateMarketMovers(cardMeta, currentPrices, prices90d),
      };
      const movers30d = moversByWindow['30D'];
      for (const m of [...movers30d.gainers, ...movers30d.losers, ...movers30d.flat]) {
        trendMap[m.slug] = { changePercent: m.changePercent, direction: m.direction };
      }
    } catch (e) { console.error('Market movers calc failed:', e); }

    try {
      supplySignals = calculateSupplySignals(
        cardMeta,
        recentSales as unknown as Map<string, { date: Date }[]>,
      );
    } catch (e) { console.error('Supply signals calc failed:', e); }

    try {
      scarcityEntries = buildScarcitySpectrum(cardMeta, blPops);
    } catch (e) { console.error('Scarcity spectrum calc failed:', e); }

    try {
      portfolioTimeSeries = buildPortfolioTimeSeries(
        allSnapshots as unknown as { cardId: string; date: Date; psa10: number | null; rawMarket: number | null; rawMid: number | null }[],
        cards.map((c) => c.id)
      );
    } catch (e) { console.error('Portfolio time series calc failed:', e); }

    return { portfolioValue, huntProgress, moversByWindow, supplySignals, scarcityEntries, portfolioTimeSeries, trendMap };
  } catch (err) {
    console.error('getPageData failed:', err);
    return {
      portfolioValue: 0,
      huntProgress: { total: 15, acquired: 0, blackLabels: 0 },
      moversByWindow: undefined,
      supplySignals: undefined,
      scarcityEntries: undefined,
      portfolioTimeSeries: undefined,
      trendMap: {} as Record<string, { changePercent: number; direction: string }>,
    };
  }
}

export default async function HomePage() {
  const { portfolioValue, huntProgress, moversByWindow, supplySignals, scarcityEntries, portfolioTimeSeries, trendMap } = await getPageData();

  return (
    <>
      <VaultOverlayLoader />

      <VaultZoomWrapper>
        <div className="pt-16">
          <PortfolioHeader
            value={portfolioValue}
            cardCount={CARDS.length}
            blackLabels={huntProgress.blackLabels}
            totalCards={huntProgress.total}
          />

          {/* Era Context Badge */}
          <EraContext />

          {/* Card Grid */}
          <div className="mx-auto max-w-[1200px] px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CARDS.map((card, index) => (
                <Link
                  key={card.slug}
                  href={`/card/${card.slug}`}
                  className="block rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] outline-none"
                >
                  <CardTilt card={card} index={index} trend={trendMap[card.slug]} />
                </Link>
              ))}
            </div>
          </div>

          {/* Portfolio Performance */}
          <div className="mx-auto max-w-[1200px] px-8">
            <SectionDivider title="Portfolio Performance" />
            <LazyPortfolioValueChart dbData={portfolioTimeSeries?.map(p => ({ date: p.date, value: p.totalValue }))} />
          </div>

          {/* Market Pulse */}
          <div className="mx-auto max-w-[1200px] px-8 pt-20">
            <MarketPulseDivider />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
              <LazyMarketMovers moversByWindow={moversByWindow} />
              <LazySupplySignals data={supplySignals} />
            </div>
          </div>

          {/* Collection Overview */}
          <div className="mx-auto max-w-[1200px] px-8 pt-12 pb-16">
            <SectionDivider title="Collection Overview" />
            <LazyScarcitySpectrum entries={scarcityEntries} />
          </div>
        </div>
      </VaultZoomWrapper>
    </>
  );
}
