import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistState {
  tickers: string[]
  add: (ticker: string) => void
  remove: (ticker: string) => void
  toggle: (ticker: string) => void
  has: (ticker: string) => boolean
  clear: () => void
}

const MAX_TICKERS = 50

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],
      add: (ticker) =>
        set((s) => {
          if (s.tickers.includes(ticker) || s.tickers.length >= MAX_TICKERS) return s
          return { tickers: [ticker, ...s.tickers] }
        }),
      remove: (ticker) =>
        set((s) => ({ tickers: s.tickers.filter((t) => t !== ticker) })),
      toggle: (ticker) => {
        const { tickers } = get()
        if (tickers.includes(ticker)) get().remove(ticker)
        else get().add(ticker)
      },
      has: (ticker) => get().tickers.includes(ticker),
      clear: () => set({ tickers: [] }),
    }),
    {
      name: 'stock-app:watchlist',
      version: 1,
    },
  ),
)
