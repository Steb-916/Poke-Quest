import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { SlabViewer } from '@/components/cards/SlabViewer';
import { CardIdentity } from '@/components/cards/CardIdentity';
import { DataPanels } from '@/components/cards/DataPanels';

interface CardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const card = CARDS.find((c) => c.slug === slug);

  if (!card) {
    notFound();
  }

  // Derive the CSS variable name for this card's pokemon
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <SlabViewer card={card} />
          <CardIdentity card={card} />
        </div>
      </div>

      {/* Data Panels */}
      <div className="mx-auto max-w-[1200px] px-8 pb-16">
        <DataPanels card={card} />
      </div>
    </div>
  );
}
