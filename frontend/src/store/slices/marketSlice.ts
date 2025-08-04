import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Market, MarketPrice, MarketSymbol } from '@/types/market'

interface MarketState {
  selectedMarketId: number | null
  selectedMarketSymbol: MarketSymbol | null
  markets: Market[]
  prices: Record<string, MarketPrice>
  isLoadingMarkets: boolean
  isLoadingPrices: boolean
  marketError: string | null
  priceError: string | null
  lastPriceUpdate: number | null
}

const initialState: MarketState = {
  selectedMarketId: 1, // Default to BTC/USD
  selectedMarketSymbol: 'BTC/USD' as MarketSymbol,
  markets: [],
  prices: {},
  isLoadingMarkets: false,
  isLoadingPrices: false,
  marketError: null,
  priceError: null,
  lastPriceUpdate: null,
}

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setSelectedMarket: (
      state,
      action: PayloadAction<{ id: number; symbol: MarketSymbol }>,
    ) => {
      state.selectedMarketId = action.payload.id
      state.selectedMarketSymbol = action.payload.symbol
    },
    setMarkets: (state, action: PayloadAction<Market[]>) => {
      state.markets = action.payload
      state.isLoadingMarkets = false
      state.marketError = null
    },
    setMarketsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMarkets = action.payload
      if (action.payload) {
        state.marketError = null
      }
    },
    setMarketError: (state, action: PayloadAction<string | null>) => {
      state.marketError = action.payload
      state.isLoadingMarkets = false
    },
    updateMarketRound: (
      state,
      action: PayloadAction<{
        marketId: number
        round: Market['currentRound']
      }>,
    ) => {
      const market = state.markets.find((m) => m.id === action.payload.marketId)
      if (market) {
        market.currentRound = action.payload.round
      }
    },
    setPrices: (state, action: PayloadAction<MarketPrice[]>) => {
      action.payload.forEach((price) => {
        state.prices[price.symbol] = price
      })
      state.isLoadingPrices = false
      state.priceError = null
      state.lastPriceUpdate = Date.now()
    },
    updatePrice: (state, action: PayloadAction<MarketPrice>) => {
      state.prices[action.payload.symbol] = action.payload
      state.lastPriceUpdate = Date.now()
    },
    setPricesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingPrices = action.payload
      if (action.payload) {
        state.priceError = null
      }
    },
    setPriceError: (state, action: PayloadAction<string | null>) => {
      state.priceError = action.payload
      state.isLoadingPrices = false
    },
    clearMarketData: (state) => {
      state.markets = []
      state.prices = {}
      state.marketError = null
      state.priceError = null
      state.lastPriceUpdate = null
    },
  },
})

export const {
  setSelectedMarket,
  setMarkets,
  setMarketsLoading,
  setMarketError,
  updateMarketRound,
  setPrices,
  updatePrice,
  setPricesLoading,
  setPriceError,
  clearMarketData,
} = marketSlice.actions

export const marketReducer = marketSlice.reducer
