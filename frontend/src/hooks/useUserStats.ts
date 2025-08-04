'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import {
  useReadRiskonGetUserBet,
  useReadRiskonCalculateWinnings,
  useReadRiskonGetRoundOutcome,
} from '@/lib/contracts-generated'
import { RISKON_ADDRESS } from '@/lib/wagmi'
import { SUPPORTED_MARKETS } from '@/types/market'

interface UserStats {
  totalBets: number
  totalWinnings: string
  totalLosses: string
  winRate: number
  winStreak: number
  bestStreak: number
  averageBet: string
  totalWagered: string
  netProfit: string
}

interface UserBet {
  marketId: number
  roundId: number
  amount: string
  prediction: boolean
  claimed: boolean
  outcome?: boolean
  winnings?: string
  resolved?: boolean
}

export function useUserStats() {
  const { address } = useAccount()
  const [stats, setStats] = useState<UserStats>({
    totalBets: 0,
    totalWinnings: '0',
    totalLosses: '0',
    winRate: 0,
    winStreak: 0,
    bestStreak: 0,
    averageBet: '0',
    totalWagered: '0',
    netProfit: '0',
  })
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user statistics from all markets
  const fetchUserStats = useCallback(async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const allBets: UserBet[] = []
      let totalWinnings = 0n
      let totalLosses = 0n
      let totalWagered = 0n
      let wins = 0
      let losses = 0
      let currentStreak = 0
      let bestStreak = 0

      // Check each market for user bets
      for (const [symbol, marketInfo] of Object.entries(SUPPORTED_MARKETS)) {
        const marketId = marketInfo.id

        // Get current round info to know how many rounds to check
        const currentRoundResponse = await fetch(
          `/api/markets/${marketId}/rounds`,
        )
        if (!currentRoundResponse.ok) continue

        const roundsData = await currentRoundResponse.json()
        const maxRounds = roundsData.currentRoundId || 10 // Fallback to 10 rounds

        // Check last 20 rounds for user bets
        for (
          let roundId = Math.max(1, maxRounds - 20);
          roundId <= maxRounds;
          roundId++
        ) {
          try {
            // Get user bet for this round
            const betData = await fetch(
              `/api/user/bet?marketId=${marketId}&roundId=${roundId}&userAddress=${address}`,
            )
            if (!betData.ok) continue

            const bet = await betData.json()
            if (bet.amount === '0') continue

            // Get round outcome
            const outcomeData = await fetch(
              `/api/rounds/${marketId}/${roundId}/outcome`,
            )
            if (!outcomeData.ok) continue

            const outcome = await outcomeData.json()

            const userBet: UserBet = {
              marketId,
              roundId,
              amount: bet.amount,
              prediction: bet.prediction,
              claimed: bet.claimed,
              outcome: outcome.resolved ? outcome.outcome : undefined,
              resolved: outcome.resolved,
            }

            // Calculate winnings if round is resolved
            if (outcome.resolved) {
              const winningsData = await fetch(
                `/api/user/winnings?marketId=${marketId}&roundId=${roundId}&userAddress=${address}`,
              )
              if (winningsData.ok) {
                const winnings = await winningsData.json()
                userBet.winnings = winnings.winnings

                const betAmount = BigInt(bet.amount)
                const winningsAmount = BigInt(winnings.winnings)

                totalWagered += betAmount

                if (winningsAmount > 0n) {
                  totalWinnings += winningsAmount
                  wins++
                  currentStreak++
                  bestStreak = Math.max(bestStreak, currentStreak)
                } else {
                  losses++
                  currentStreak = 0
                }
              }
            }

            allBets.push(userBet)
          } catch (error) {
            console.error(
              `Error fetching bet for market ${marketId}, round ${roundId}:`,
              error,
            )
          }
        }
      }

      // Calculate statistics
      const totalBets = wins + losses
      const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0
      const averageBet =
        totalBets > 0 ? formatEther(totalWagered / BigInt(totalBets)) : '0'
      const netProfit = totalWinnings - totalLosses

      setStats({
        totalBets,
        totalWinnings: formatEther(totalWinnings),
        totalLosses: formatEther(totalLosses),
        winRate,
        winStreak: currentStreak,
        bestStreak,
        averageBet,
        totalWagered: formatEther(totalWagered),
        netProfit: formatEther(netProfit),
      })

      setUserBets(allBets)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchUserStats()
  }, [fetchUserStats])

  return {
    stats,
    userBets,
    isLoading,
    refetch: fetchUserStats,
  }
}
