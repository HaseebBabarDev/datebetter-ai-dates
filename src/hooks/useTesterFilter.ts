import { create } from 'zustand';

type TesterFilterType = 'all' | 'internal' | 'external';

interface TesterFilterState {
  filter: TesterFilterType;
  setFilter: (filter: TesterFilterType) => void;
}

// Simple store for tester filter - shared across admin components
export const useTesterFilter = create<TesterFilterState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
