export interface MockOwnership {
  slug: string;
  acquired: boolean;
  isBlackLabel: boolean;
  bestGrade?: string;
  bestGrader?: string;
  purchaseDate?: string;
  blPop: number;
}

// All 15 cards — currently none acquired (matching real state).
// To test all 3 visual states during development, temporarily set
// 1-2 cards to isBlackLabel: true and 2-3 to acquired: true with a grade.
export const MOCK_HUNT_STATUS: MockOwnership[] = [
  { slug: 'umbreon-vmax-215', acquired: true, isBlackLabel: false, bestGrade: 'PSA 10', bestGrader: 'PSA', blPop: 138 },
  { slug: 'rayquaza-vmax-218', acquired: true, isBlackLabel: true, bestGrade: 'Black Label', bestGrader: 'BGS', purchaseDate: 'Jan 15, 2026', blPop: 38 },
  { slug: 'deoxys-vmax-gg45', acquired: false, isBlackLabel: false, blPop: 12 },
  { slug: 'gengar-vmax-271', acquired: true, isBlackLabel: false, bestGrade: 'BGS 9.5', bestGrader: 'BGS', blPop: 10 },
  { slug: 'giratina-v-186', acquired: false, isBlackLabel: false, blPop: 10 },
  { slug: 'aerodactyl-v-180', acquired: false, isBlackLabel: false, blPop: 4 },
  { slug: 'dragonite-v-192', acquired: false, isBlackLabel: false, blPop: 4 },
  { slug: 'espeon-v-180', acquired: false, isBlackLabel: false, blPop: 2 },
  { slug: 'machamp-v-172', acquired: false, isBlackLabel: false, blPop: 2 },
  { slug: 'tyranitar-v-155', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'charizard-v-154', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'starmie-v-tg13', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'celebi-v-245', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'galarian-slowking-v-179', acquired: false, isBlackLabel: false, blPop: 0 },
  { slug: 'beedrill-v-161', acquired: false, isBlackLabel: false, blPop: 0 },
];
