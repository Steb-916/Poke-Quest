import { create } from 'zustand';

interface HuntStore {
  editingCardSlug: string | null;
  openDrawer: (slug: string) => void;
  closeDrawer: () => void;
}

export const useHuntStore = create<HuntStore>((set) => ({
  editingCardSlug: null,
  openDrawer: (slug) => set({ editingCardSlug: slug }),
  closeDrawer: () => set({ editingCardSlug: null }),
}));
