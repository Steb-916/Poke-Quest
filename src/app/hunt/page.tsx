import { CARDS } from '@/lib/utils/cardData';
import { MOCK_HUNT_STATUS } from '@/lib/utils/mockHuntData';
import { HuntPageClient } from '@/components/hunt/HuntPageClient';

export default function HuntPage() {
  // Sort cards by hunt priority:
  // 1. Black Label acquired (trophies)
  // 2. Owned, not BL (progress)
  // 3. Not owned, sorted by BL pop ascending (rarest first), then displayOrder
  const sortedCards = [...CARDS].sort((a, b) => {
    const statusA = MOCK_HUNT_STATUS.find((s) => s.slug === a.slug);
    const statusB = MOCK_HUNT_STATUS.find((s) => s.slug === b.slug);
    if (!statusA || !statusB) return 0;

    const priorityA = statusA.isBlackLabel ? 0 : statusA.acquired ? 1 : 2;
    const priorityB = statusB.isBlackLabel ? 0 : statusB.acquired ? 1 : 2;

    if (priorityA !== priorityB) return priorityA - priorityB;
    if (priorityA === 2) {
      if (statusA.blPop !== statusB.blPop) return statusA.blPop - statusB.blPop;
    }
    return a.displayOrder - b.displayOrder;
  });

  const blAcquired = MOCK_HUNT_STATUS.filter((s) => s.isBlackLabel).length;

  // Find next target: lowest BL pop among unowned BLs
  const hunting = MOCK_HUNT_STATUS.filter((s) => !s.isBlackLabel);
  const nextTargetStatus = hunting.sort((a, b) => a.blPop - b.blPop)[0];
  const nextTarget = nextTargetStatus
    ? CARDS.find((c) => c.slug === nextTargetStatus.slug)?.name || 'Unknown'
    : 'All acquired!';

  return (
    <HuntPageClient
      sortedCards={sortedCards}
      huntStatus={MOCK_HUNT_STATUS}
      blAcquired={blAcquired}
      nextTarget={nextTarget}
    />
  );
}
