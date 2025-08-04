import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { RISKON_ADDRESS } from '@/lib/wagmi'
import {
  useReadRiskonGetCurrentRoundInfo,
  useReadRiskonGetUserBet,
  useReadRiskonCalculateWinnings,
  useWriteRiskonPlaceBet,
  useWriteRiskonClaimWinnings,
  useWatchRiskonBetPlacedEvent,
  useWatchRiskonRoundResolvedEvent,
  // useReadRiskonGetMarkets, // TODO: Add this to contract generation
} from '@/lib/contracts-generated'
import { addNotification } from '@/store/slices/uiSlice'
import { useAppDispatch } from './useRedux'

/**
 * Multi-market prediction market hook
 */
export function useMultiMarketPrediction() {
  const dispatch = useAppDispatch()
  const {
    writeContract: placeBetWrite,
    isPending: isPlacingBet,
    error: placeBetError,
  } = useWriteRiskonPlaceBet()
  const {
    writeContract: claimWinningsWrite,
    isPending: isClaimingWinnings,
    error: claimWinningsError,
  } = useWriteRiskonClaimWinnings()

  // Watch for contract events
  useWatchRiskonBetPlacedEvent({
    address: RISKON_ADDRESS,
    onLogs(logs) {
      logs.forEach((log) => {
        toast.success(
          `Bet placed: ${log.args.amount} SOM on ${
            log.args.prediction ? 'YES' : 'NO'
          } (Market ${log.args.marketId})`,
        )
      })
    },
  })

  useWatchRiskonRoundResolvedEvent({
    address: RISKON_ADDRESS,
    onLogs(logs) {
      logs.forEach((log) => {
        toast.info(
          `Round ${log.args.roundId} resolved: ${
            log.args.outcome ? 'YES' : 'NO'
          } won (Market ${log.args.marketId})`,
        )
      })
    },
  })

  // Error handling
  useEffect(() => {
    if (placeBetError) {
      dispatch(
        addNotification({
          type: 'error',
          message: `Failed to place bet: ${placeBetError.message}`,
        }),
      )
    }
  }, [placeBetError, dispatch])

  useEffect(() => {
    if (claimWinningsError) {
      dispatch(
        addNotification({
          type: 'error',
          message: `Failed to claim winnings: ${claimWinningsError.message}`,
        }),
      )
    }
  }, [claimWinningsError, dispatch])

  const placeBet = async (
    marketId: bigint,
    prediction: boolean,
    amount: bigint,
  ) => {
    try {
      await placeBetWrite({
        address: RISKON_ADDRESS,
        args: [marketId, prediction],
        value: amount,
      })
    } catch (err) {
      console.error('Failed to place bet:', err)
    }
  }

  const claimWinnings = async (marketId: bigint, roundId: bigint) => {
    try {
      await claimWinningsWrite({
        address: RISKON_ADDRESS,
        args: [marketId, roundId],
      })
    } catch (err) {
      console.error('Failed to claim winnings:', err)
    }
  }

  return {
    placeBet,
    claimWinnings,
    isPending: isPlacingBet || isClaimingWinnings,
    error: placeBetError || claimWinningsError,
  }
}

/**
 * Hook for current round of a specific market
 */
export function useCurrentRound(marketId: bigint) {
  const { data, isLoading, error, refetch } = useReadRiskonGetCurrentRoundInfo({
    address: RISKON_ADDRESS,
    args: [marketId],
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds
      enabled: !!marketId,
    },
  })

  return {
    round: data
      ? {
          marketId: Number(marketId),
          id: Number(data[0]),
          startTime: Number(data[1]),
          endTime: Number(data[2]),
          priceTarget: data[3].toString(),
          totalYes: data[4].toString(),
          totalNo: data[5].toString(),
          resolved: data[6],
          isActive: !data[6] && Date.now() / 1000 < Number(data[2]),
          timeRemaining: Math.max(
            0,
            Number(data[2]) - Math.floor(Date.now() / 1000),
          ),
        }
      : null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for user bet in a specific market round
 */
export function useUserBet(
  marketId: bigint,
  roundId: bigint,
  userAddress?: `0x${string}`,
) {
  const { data, isLoading, error, refetch } = useReadRiskonGetUserBet({
    address: RISKON_ADDRESS,
    args: [marketId, roundId, userAddress!],
    query: {
      enabled: !!userAddress && !!marketId && !!roundId,
      refetchInterval: 10000,
    },
  })

  return {
    bet: data
      ? {
          roundId: Number(roundId),
          amount: data[0].toString(),
          prediction: data[1],
          claimed: data[2],
        }
      : null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to calculate potential winnings for a market
 */
export function useCalculateWinnings(
  marketId: bigint,
  roundId: bigint,
  userAddress?: `0x${string}`,
) {
  const { data, isLoading, error } = useReadRiskonCalculateWinnings({
    address: RISKON_ADDRESS,
    args: [marketId, roundId, userAddress!],
    query: {
      enabled: !!userAddress && !!marketId && !!roundId,
      refetchInterval: 10000,
    },
  })

  return {
    winnings: data?.toString() || '0',
    isLoading,
    error,
  }
}

/**
 * Hook to get all markets from the contract
 * TODO: Add getMarkets function to contract generation
 */
export function useContractMarkets() {
  // Placeholder implementation until getMarkets is added to contract generation
  return {
    markets: null,
    isLoading: false,
    error: null,
    refetch: () => {},
  }
}

/**
 * Hook for combined user data across all markets
 */
export function useUserMultiMarketData() {
  const { address } = useAccount()
  const { markets } = useContractMarkets()

  // This would need to be expanded to fetch user bets across all markets
  // For now, returning a placeholder structure
  return {
    totalBets: 0,
    totalWinnings: '0',
    activeBets: 0,
    availableClaims: 0,
    isLoading: false,
  }
}
