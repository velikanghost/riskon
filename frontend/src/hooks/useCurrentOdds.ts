import { useReadRiskonGetCurrentOdds } from '@/lib/contracts-generated'
import { RISKON_ADDRESS } from '@/lib/wagmi'

/**
 * Hook to get current odds for a market
 */
export function useCurrentOdds(marketId: bigint) {
  const { data, isLoading, error, refetch } = useReadRiskonGetCurrentOdds({
    address: RISKON_ADDRESS,
    args: [marketId],
    query: {
      refetchInterval: 5000, // Update every 5 seconds
      enabled: !!marketId,
    },
  })

  return {
    yesOdds: data ? Number(data[0]) / 1e18 : 2.0,
    noOdds: data ? Number(data[1]) / 1e18 : 2.0,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Utility function to format odds for display
 */
export function formatOdds(odds: number): string {
  return odds.toFixed(2)
}

/**
 * Utility function to calculate potential winnings
 */
export function calculatePotentialWinnings(
  betAmount: number,
  odds: number,
): number {
  return betAmount * odds
}
