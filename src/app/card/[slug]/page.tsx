import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { SlabViewer } from '@/components/cards/SlabViewer';
import { CardIdentity } from '@/components/cards/CardIdentity';
import { DataPanels } from '@/components/cards/DataPanels';

interface CardPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CardPageProps) {
  const { slug } = await params;
  const card = CARDS.find((c) => c.slug === slug);
  if (!card) return { title: 'Card Not Found — The Vault' };
  return {
    title: `${card.name} — The Vault`,
    description: `${card.name} from ${card.set}. Price history, pop reports, and graded sales for this ${card.artType}.`,
  };
}

async function getCardData(slug: string) {
  try {
    const { getCardBySlug, getLatestPrices, getLatestPop, getRecentSales, getPriceHistory } = await import('@/lib/db/queries');
    const dbCard = await getCardBySlug(slug);
    if (!dbCard) return null;

    const [latestPrices, priceHistory, popData, recentSales] = await Promise.all([
      getLatestPrices(dbCard.id),
      getPriceHistory(dbCard.id),
      getLatestPop(dbCard.id),
      getRecentSales(dbCard.id, 50),
    ]);

    // Calculate velocity from sales data
    let velocity = null;
    let radarScores = null;
    try {
      const { calculateSingleCardVelocity, calculateRadarScores } = await import('@/lib/utils/calculations');
      const { getRadarChartData } = await import('@/lib/db/queries');

      velocity = calculateSingleCardVelocity(
        (recentSales as unknown as { date: Date }[]) || []
      );

      const radarData = await getRadarChartData();
      radarScores = calculateRadarScores(dbCard.id, radarData);
    } catch { /* no velocity/radar data */ }

    return {
      prices: latestPrices,
      priceHistory: priceHistory as Record<string, unknown>[],
      popData: popData as Record<string, unknown>[],
      recentSales: recentSales as Record<string, unknown>[],
      ownership: dbCard.ownership?.[0] ?? null,
      velocity,
      radarScores,
    };
  } catch {
    return null;
  }
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const card = CARDS.find((c) => c.slug === slug);

  if (!card) {
    notFound();
  }

  const dbData = await getCardData(slug);
  const pokemonKey = card.pokemon.toLowerCase().replace('galarian ', '');

  return (
    <div
      className="min-h-screen pt-16"
      style={{
        '--color-accent': `var(--card-${pokemonKey})`,
        '--color-accent-dim': `var(--card-${pokemonKey})33`,
        '--color-accent-glow': `var(--card-${pokemonKey})55`,
      } as React.CSSProperties}
    >
      {/* Back Link */}
      <div className="mx-auto max-w-[1200px] px-8 pt-6 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <span className="text-lg">&larr;</span>
          <span className="tracking-wide">Back to Vault</span>
        </Link>
      </div>

      {/* Hero: Slab Viewer + Card Identity */}
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        <div className="card-hero-grid">
          <SlabViewer card={card} />
          <CardIdentity
            card={card}
            prices={dbData?.prices}
            ownership={dbData?.ownership ? {
              acquired: dbData.ownership.acquired,
              condition: dbData.ownership.condition,
              grade: dbData.ownership.grade,
              labelType: dbData.ownership.labelType,
            } : null}
          />
        </div>
      </div>

      {/* Data Panels */}
      <div className="mx-auto max-w-[1200px] px-8 pb-16">
        <DataPanels
          card={card}
          priceHistory={dbData?.priceHistory}
          popData={dbData?.popData}
          recentSales={dbData?.recentSales}
          velocity={dbData?.velocity}
          radarScores={dbData?.radarScores}
        />
      </div>

      {/* Inline critical CSS — prevents layout race condition with Turbopack */}
      <style>{`
        .card-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .card-hero-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
