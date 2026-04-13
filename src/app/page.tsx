import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { CardTilt } from '@/components/cards/CardTilt';
import { PortfolioHeader } from '@/components/ui/PortfolioHeader';
import { VaultOverlayLoader } from '@/components/three/VaultOverlayLoader';

async function getPageData() {
  try {
    const { getPortfolioValue, getHuntProgress } = await import('@/lib/db/queries');
    const [portfolioValue, huntProgress] = await Promise.all([
      getPortfolioValue(),
      getHuntProgress(),
    ]);
    return { portfolioValue, huntProgress };
  } catch {
    return { portfolioValue: 0, huntProgress: { total: 15, acquired: 0, blackLabels: 0 } };
  }
}

export default async function HomePage() {
  const { portfolioValue, huntProgress } = await getPageData();

  return (
    <>
      <VaultOverlayLoader />

      <div className="pt-16">
        <PortfolioHeader
          value={portfolioValue}
          cardCount={CARDS.length}
          blackLabels={huntProgress.blackLabels}
          totalCards={huntProgress.total}
        />

        <div className="mx-auto max-w-[1200px] px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CARDS.map((card, index) => (
              <Link
                key={card.slug}
                href={`/card/${card.slug}`}
                className="block rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] outline-none"
              >
                <CardTilt card={card} index={index} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
