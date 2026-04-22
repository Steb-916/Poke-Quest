import type { Metadata } from 'next';
import { CARDS } from '@/lib/utils/cardData';
import { MOCK_HUNT_STATUS, type MockOwnership } from '@/lib/utils/mockHuntData';
import { HuntPageClient } from '@/components/hunt/HuntPageClient';

export const metadata: Metadata = {
  title: 'The Hunt — Black Label Quest',
  description: 'Tracking progress toward BGS Black Label 10 of all 15 SWSH alt art cards.',
};

async function getHuntData(): Promise<{ huntStatus: MockOwnership[]; blAcquired: number }> {
  try {
    const { getAllOwnership } = await import('@/lib/db/queries');
    const ownership = await getAllOwnership();

    if (ownership.length > 0) {
      const huntStatus: MockOwnership[] = CARDS.map((card) => {
        const own = ownership.find((o) => o.card.slug === card.slug);
        return {
          slug: card.slug,
          acquired: own?.acquired ?? false,
          isBlackLabel: own?.labelType === 'Black' && own?.acquired === true,
          bestGrade: own?.grade ?? undefined,
          bestGrader: own?.condition ?? undefined,
          purchaseDate: own?.purchaseDate?.toISOString().split('T')[0] ?? undefined,
          blPop: 0, // Would come from pop snapshots
        };
      });

      const blAcquired = huntStatus.filter((s) => s.isBlackLabel).length;
      return { huntStatus, blAcquired };
    }
  } catch {
    // DB not connected — fall through to mock data
  }

  return {
    huntStatus: MOCK_HUNT_STATUS,
    blAcquired: MOCK_HUNT_STATUS.filter((s) => s.isBlackLabel).length,
  };
}

export default async function HuntPage() {
  const { huntStatus, blAcquired } = await getHuntData();

  const sortedCards = [...CARDS].sort((a, b) => {
    const statusA = huntStatus.find((s) => s.slug === a.slug);
    const statusB = huntStatus.find((s) => s.slug === b.slug);
    if (!statusA || !statusB) return 0;

    const priorityA = statusA.isBlackLabel ? 0 : statusA.acquired ? 1 : 2;
    const priorityB = statusB.isBlackLabel ? 0 : statusB.acquired ? 1 : 2;

    if (priorityA !== priorityB) return priorityA - priorityB;
    if (priorityA === 2) {
      if (statusA.blPop !== statusB.blPop) return statusA.blPop - statusB.blPop;
    }
    return a.displayOrder - b.displayOrder;
  });

  const hunting = huntStatus.filter((s) => !s.isBlackLabel);
  const nextTargetStatus = [...hunting].sort((a, b) => a.blPop - b.blPop)[0];
  const nextTarget = nextTargetStatus
    ? CARDS.find((c) => c.slug === nextTargetStatus.slug)?.name || 'Unknown'
    : 'All acquired!';

  return (
    <HuntPageClient
      sortedCards={sortedCards}
      huntStatus={huntStatus}
      blAcquired={blAcquired}
      nextTarget={nextTarget}
    />
  );
}
