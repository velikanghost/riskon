import { useEffect } from 'react'
import { toast } from 'sonner'
import { RISKON_ADDRESS } from '@/lib/wagmi'
import {
  useReadRiskonGetCurrentRoundInfo,
  useReadRiskonGetUserBet,
  useReadRiskonCalculateWinnings,
  useWriteRiskonPlaceBet,
  useWriteRiskonClaimWinnings,
  useWatchRiskonBetPlacedEvent,
  useWatchRiskonRoundResolvedEvent,
} from '@/lib/contracts-generated'
import { useMarketPrice } from './useMarkets'
import { addNotification } from '@/store/slices/uiSlice'
import { useAppDispatch } from './useRedux'

export function usePredictionMarket() {
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
          }`,
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
          } won`,
        )
      })
    },
  })

  // Handle transaction errors
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

  const placeBet = async (prediction: boolean, amount: bigint) => {
    try {
      await placeBetWrite({
        address: RISKON_ADDRESS,
        args: [BigInt(1), prediction],
        value: amount,
      })
    } catch (err) {
      console.error('Failed to place bet:', err)
    }
  }

  const claimWinnings = async (roundId: bigint) => {
    try {
      await claimWinningsWrite({
        address: RISKON_ADDRESS,
        args: [BigInt(1), roundId],
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

export function useCurrentRound() {
  const { data, isLoading, error, refetch } = useReadRiskonGetCurrentRoundInfo({
    address: RISKON_ADDRESS,
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  })

  return {
    round: data
      ? {
          id: Number(data[0]),
          startTime: Number(data[1]),
          endTime: Number(data[2]),
          priceTarget: data[3].toString(),
          totalYes: data[4].toString(),
          totalNo: data[5].toString(),
          resolved: data[6],
        }
      : null,
    isLoading,
    error,
    refetch,
  }
}

export function useUserBet(roundId: bigint, userAddress?: `0x${string}`) {
  const { data, isLoading, error } = useReadRiskonGetUserBet({
    address: RISKON_ADDRESS,
    args: [BigInt(1), roundId, userAddress!],
    query: {
      enabled: !!userAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })

  return {
    bet: data
      ? {
          amount: data[0].toString(),
          prediction: data[1],
          claimed: data[2],
        }
      : null,
    isLoading,
    error,
  }
}

export function useCalculateWinnings(
  roundId: bigint,
  userAddress?: `0x${string}`,
) {
  const { data, isLoading, error } = useReadRiskonCalculateWinnings({
    address: RISKON_ADDRESS,
    args: [BigInt(1), roundId, userAddress!],
    query: {
      enabled: !!userAddress,
    },
  })

  return {
    winnings: data?.toString() || '0',
    isLoading,
    error,
  }
}

export function usePriceFeed(symbol: string) {
  return useMarketPrice(symbol)
}
