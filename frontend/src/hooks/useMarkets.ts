import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './useRedux'
import {
  setMarkets,
  setMarketsLoading,
  setMarketError,
  setPrices,
  setPricesLoading,
  setPriceError,
  updatePrice,
  setSelectedMarket,
} from '@/store/slices/marketSlice'
import {
  Market,
  MarketPrice,
  MarketSymbol,
  SUPPORTED_MARKETS,
} from '@/types/market'

/**
 * Hook to fetch and manage markets data
 */
export function useMarkets() {
  const dispatch = useAppDispatch()
  const {
    markets,
    isLoadingMarkets,
    marketError,
    selectedMarketId,
    selectedMarketSymbol,
  } = useAppSelector((state) => state.market)

  // Fetch markets from the API
  const fetchMarkets = async (includeRounds = true) => {
    try {
      dispatch(setMarketsLoading(true))

      const response = await fetch(
        `/api/markets?includeRounds=${includeRounds}`,
      )
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.markets) {
        dispatch(setMarkets(data.markets as Market[]))
      } else {
        throw new Error(data.message || 'Failed to fetch markets')
      }
    } catch (error) {
      console.error('Error fetching markets:', error)
      dispatch(
        setMarketError(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      )
    }
  }

  // Get selected market
  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || null

  // Select a market
  const selectMarket = (symbol: MarketSymbol) => {
    const marketInfo = SUPPORTED_MARKETS[symbol]
    if (marketInfo) {
      dispatch(setSelectedMarket({ id: marketInfo.id, symbol }))
    }
  }

  return {
    markets,
    selectedMarket,
    selectedMarketId,
    selectedMarketSymbol,
    isLoadingMarkets,
    marketError,
    fetchMarkets,
    selectMarket,
  }
}

/**
 * Hook to fetch and manage prices data
 */
export function usePrices() {
  const dispatch = useAppDispatch()
  const { prices, isLoadingPrices, priceError, lastPriceUpdate } =
    useAppSelector((state) => state.market)

  // Fetch all prices
  const fetchPrices = async (symbols?: string[]) => {
    try {
      dispatch(setPricesLoading(true))

      const url =
        symbols && symbols.length > 0
          ? `/api/prices?symbols=${symbols.join(',')}`
          : '/api/prices'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.prices) {
        dispatch(setPrices(data.prices as MarketPrice[]))
      } else {
        throw new Error(data.message || 'Failed to fetch prices')
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
      dispatch(
        setPriceError(error instanceof Error ? error.message : 'Unknown error'),
      )
    }
  }

  // Fetch single price
  const fetchPrice = async (symbol: string) => {
    try {
      const response = await fetch(`/api/prices?symbol=${symbol}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log({ data })
      if (data.success) {
        dispatch(updatePrice(data as MarketPrice))
      } else {
        throw new Error(data.message || 'Failed to fetch price')
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
    }
  }

  // Auto-refresh prices
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrices()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    prices,
    isLoadingPrices,
    priceError,
    lastPriceUpdate,
    fetchPrices,
    fetchPrice,
  }
}

/**
 * Hook to get price for a specific market
 */
export function useMarketPrice(symbol: string) {
  const { prices, fetchPrice } = usePrices()
  const price = prices[symbol]

  useEffect(() => {
    if (!price || Date.now() - price.timestamp * 1000 > 60000) {
      fetchPrice(symbol)
    }
  }, [symbol, price, fetchPrice])

  return {
    price: price?.price || 0,
    isLoading: !price,
    error: price?.error,
    timestamp: price?.timestamp,
    success: price?.success || false,
  }
}
