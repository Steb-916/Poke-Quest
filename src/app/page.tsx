import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { CardTilt } from '@/components/cards/CardTilt';
import { PortfolioHeader } from '@/components/ui/PortfolioHeader';
import { VaultOverlayLoader } from '@/components/three/VaultOverlayLoader';

export default function HomePage() {
  return (
    <>
      {/* Vault door intro — plays once per session */}
      <VaultOverlayLoader />

      {/* Main content */}
      <div className="pt-16">
        <PortfolioHeader />

        <div className="mx-auto max-w-[1200px] px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CARDS.map((card, index) => (
              <Link
                key={card.slug}
                href={`/card/${card.slug}`}
                className="block rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] outline-none"
              >
                <CardTilt
                  card={card}
                  index={index}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
