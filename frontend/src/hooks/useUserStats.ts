'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

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

export function useUserStats(limit: number = 50) {
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
  const [error, setError] = useState<string | null>(null)

  const fetchUserStats = useCallback(async () => {
    if (!address) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ address, limit: String(limit) })
      const res = await fetch(`/api/user/dashboard?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.success)
        throw new Error(data.message || 'Failed to fetch dashboard')

      setStats(data.stats as UserStats)
      setUserBets(data.userBets as UserBet[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      console.error('Error fetching user dashboard:', e)
    } finally {
      setIsLoading(false)
    }
  }, [address, limit])

  useEffect(() => {
    fetchUserStats()
  }, [fetchUserStats])

  return {
    stats,
    userBets,
    isLoading,
    error,
    refetch: fetchUserStats,
  }
}
