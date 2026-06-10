import { create } from 'zustand'

interface SearchState {
  query: string
  isOpen: boolean
  setQuery: (q: string) => void
  open: () => void
  close: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  isOpen: false,
  setQuery: (query) => set({ query, isOpen: query.length > 0 }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
