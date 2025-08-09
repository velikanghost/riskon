'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useAppSelector } from '@/hooks/useRedux'
import {
  useUserBet,
  useCalculateWinnings,
} from '@/hooks/useMultiMarketPrediction'
import { useUserStats } from '@/hooks/useUserStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'
import { useWriteRiskonClaimWinnings } from '@/lib/contracts-generated'
import { RISKON_ADDRESS } from '@/lib/wagmi'
import { Loader2 } from 'lucide-react'
import { formatUSDUnits } from '@/lib/helpers'

interface UserStatsCardProps {
  title: string
  value: string
  subtitle?: string
  className?: string
}

function UserStatsCard({
  title,
  value,
  subtitle,
  className,
}: UserStatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 text-center">
        <div className="text-sm text-muted-foreground mb-1">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  )
}

interface BetRowProps {
  marketId: bigint
  roundId: number
  userAddress: `0x${string}`
}

function BetRow({ marketId, roundId, userAddress }: BetRowProps) {
  const { bet, isLoading } = useUserBet(marketId, BigInt(roundId), userAddress)

  console.log('bet', bet)
  const { winnings } = useCalculateWinnings(
    marketId,
    BigInt(roundId),
    userAddress,
  )

  const {
    writeContract: claimWinningsWrite,
    isPending: isClaimingWinnings,
    error: claimWinningsError,
  } = useWriteRiskonClaimWinnings()

  const handleClaimWinnings = async () => {
    try {
      await claimWinningsWrite({
        address: RISKON_ADDRESS,
        args: [marketId, BigInt(roundId)],
      })

      toast.success('Winnings claimed successfully!')
    } catch (error) {
      console.error('Failed to claim winnings:', error)
      toast.error('Failed to claim winnings')
    }
  }

  // Handle contract errors
  useEffect(() => {
    if (claimWinningsError) {
      toast.error(`Failed to claim winnings: ${claimWinningsError.message}`)
    }
  }, [claimWinningsError])

  if (isLoading || !bet || BigInt(bet.amount) === 0n) {
    return null
  }

  const hasWinnings = BigInt(winnings) > 0n && !bet.claimed
  const betAmount = parseFloat(formatEther(BigInt(bet.amount)))
  const winningsAmount = parseFloat(formatEther(BigInt(winnings)))

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center space-x-3">
        <Badge variant="outline">Round #{roundId}</Badge>
        <Badge
          variant={bet.prediction ? 'default' : 'secondary'}
          className={bet.prediction ? 'bg-green-600' : 'bg-red-600'}
        >
          {bet.prediction ? 'YES' : 'NO'}
        </Badge>
        <span className="text-sm font-medium">{betAmount.toFixed(4)} STT</span>
      </div>

      <div className="flex items-center space-x-3">
        {hasWinnings && (
          <>
            <span className="text-sm text-green-600 font-medium">
              +{winningsAmount.toFixed(4)} STT
            </span>
            <Button
              size="sm"
              onClick={handleClaimWinnings}
              disabled={isClaimingWinnings}
              className="bg-green-600 hover:bg-green-700"
            >
              {isClaimingWinnings ? 'Claiming...' : 'Claim'}
            </Button>
          </>
        )}
        {bet.claimed && (
          <Badge variant="outline" className="text-green-600">
            Claimed
          </Badge>
        )}
        {BigInt(winnings) === 0n && !bet.claimed && (
          <Badge variant="secondary" className="text-red-600">
            Lost
          </Badge>
        )}
      </div>
    </div>
  )
}

export function UserDashboard() {
  const { address, isConnected } = useAccount()
  const { selectedMarketId } = useAppSelector((state) => state.market)
  const { stats, userBets, isLoading: isLoadingStats } = useUserStats()

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-xl font-medium">Connect Your Wallet</div>
            <div className="text-muted-foreground">
              Connect your wallet to view your betting history and statistics
            </div>
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoadingStats) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin" />
          <div className="text-muted-foreground">Loading your stats...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UserStatsCard
          title="Total Bets"
          value={stats.totalBets.toString()}
          subtitle="All time"
        />
        <UserStatsCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle="Success rate"
          className="bg-green-50 border-green-200"
        />
        <UserStatsCard
          title="Total Winnings"
          value={`${formatEther(BigInt(stats.totalWinnings))} STT`}
          subtitle="Lifetime earnings"
          className="bg-blue-50 border-blue-200"
        />
        <UserStatsCard
          title="Win Streak"
          value={stats.winStreak.toString()}
          subtitle={`Best: ${stats.bestStreak}`}
          className="bg-purple-50 border-purple-200"
        />
      </div>

      {/* Detailed Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Wagered:</span>
              <span className="font-medium">
                {formatEther(BigInt(stats.totalWagered))} STT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Profit:</span>
              <span
                className={`font-medium ${
                  parseFloat(stats.netProfit) > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatEther(BigInt(stats.netProfit))} STT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Bet:</span>
              <span className="font-medium">
                {formatEther(BigInt(stats.averageBet))} STT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best Streak:</span>
              <span className="font-medium">{stats.bestStreak} wins</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {userBets.length > 0 ? (
              <div className="space-y-2">
                {userBets.slice(0, 5).map((bet) => (
                  <div
                    key={`${bet.marketId}-${bet.roundId}`}
                    className="flex justify-between text-sm"
                  >
                    <span>Round #{bet.roundId}</span>
                    <span
                      className={
                        bet.outcome === bet.prediction
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {bet.outcome === bet.prediction ? 'Won' : 'Lost'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-sm">No recent activity</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Bets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Bets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {address && userBets.length > 0 ? (
              userBets.map((bet) => (
                <BetRow
                  key={`${bet.marketId}-${bet.roundId}`}
                  marketId={BigInt(bet.marketId)}
                  roundId={bet.roundId}
                  userAddress={address}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-sm">
                  No active bets found. Place your first prediction to get
                  started!
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className={`text-center p-4 rounded-lg ${stats.winStreak >= 3 ? 'bg-green-50 border-green-200' : 'bg-muted/30 opacity-50'}`}
            >
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-sm font-medium">Hot Streak</div>
              <div className="text-xs text-muted-foreground">
                3+ wins in a row
              </div>
            </div>
            <div
              className={`text-center p-4 rounded-lg ${stats.winRate >= 80 ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 opacity-50'}`}
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-medium">Sharp Shooter</div>
              <div className="text-xs text-muted-foreground">80%+ win rate</div>
            </div>
            <div
              className={`text-center p-4 rounded-lg ${stats.totalBets >= 10 ? 'bg-purple-50 border-purple-200' : 'bg-muted/30 opacity-50'}`}
            >
              <div className="text-2xl mb-2">🎲</div>
              <div className="text-sm font-medium">Regular Player</div>
              <div className="text-xs text-muted-foreground">
                10+ bets placed
              </div>
            </div>
            <div
              className={`text-center p-4 rounded-lg ${parseFloat(stats.totalWinnings) >= 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30 opacity-50'}`}
            >
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">Big Winner</div>
              <div className="text-xs text-muted-foreground">
                1+ STT winnings
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
