import { useState, useEffect } from 'react'

export interface MarketRound {
  id: number
  marketId: number
  startTime: number
  endTime: number
  priceTarget: string
  finalPrice: string
  totalYes: string
  totalNo: string
  outcome: boolean
  resolved: boolean
  symbol: string
}

export function useMarketHistory(marketId: number, limit: number = 10) {
  const [rounds, setRounds] = useState<MarketRound[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMarketHistory() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/history?marketId=${marketId}&limit=${limit}`,
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        setRounds(data.rounds)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch market history',
        )
      } finally {
        setLoading(false)
      }
    }

    if (marketId) {
      fetchMarketHistory()
    }
  }, [marketId, limit])

  return { rounds, loading, error }
}
