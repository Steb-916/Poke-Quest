import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { SlabViewer } from '@/components/cards/SlabViewer';
import { CardIdentity } from '@/components/cards/CardIdentity';
import { DataPanels } from '@/components/cards/DataPanels';

interface CardPageProps {
  params: Promise<{ slug: string }>;
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
      getRecentSales(dbCard.id),
    ]);

    return {
      prices: latestPrices,
      priceHistory: priceHistory as Record<string, unknown>[],
      popData: popData as Record<string, unknown>[],
      recentSales: recentSales as Record<string, unknown>[],
      ownership: dbCard.ownership?.[0] ?? null,
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
        <div className="hero-grid">
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
        />
      </div>
    </div>
  );
}
