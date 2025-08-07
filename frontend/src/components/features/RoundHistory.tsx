'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMarketHistory, type MarketRound } from '@/hooks/useMarketHistory'
import { Loader2 } from 'lucide-react'

interface RoundCardProps {
  round: MarketRound
}

function RoundCard({ round }: RoundCardProps) {
  const totalPool = parseFloat(round.totalYes) + parseFloat(round.totalNo)
  const yesPercentage =
    totalPool > 0 ? (parseFloat(round.totalYes) / totalPool) * 100 : 50
  const target = parseFloat(round.priceTarget)
  const final = parseFloat(round.finalPrice)
  const priceDiff = final - target
  const priceDiffPercentage = ((Math.abs(priceDiff) / target) * 100).toFixed(2)

  const timeAgo = Math.floor((Date.now() - round.endTime * 1000) / 60000) // minutes ago

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Round #{round.id}</Badge>
            <Badge variant="secondary" className="text-xs">
              {timeAgo}m ago
            </Badge>
          </div>
          <Badge
            variant={round.outcome ? 'default' : 'secondary'}
            className={round.outcome ? 'bg-green-600' : 'bg-red-600'}
          >
            {round.outcome ? 'YES WON' : 'NO WON'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Target Price</div>
            <div className="font-mono font-medium">
              ${target.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Final Price</div>
            <div
              className={`font-mono font-medium ${
                round.outcome ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ${final.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Price Movement */}
        <div className="text-sm">
          <div className="text-muted-foreground mb-1">Price Movement</div>
          <div
            className={`font-medium ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)} (
            {priceDiffPercentage}%)
          </div>
        </div>

        {/* Pool Information */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Total Pool:</span>
            <span className="font-medium">{totalPool.toFixed(4)} SOM</span>
          </div>

          {/* Pool Visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">YES: {round.totalYes} SOM</span>
              <span className="text-red-600">NO: {round.totalNo} SOM</span>
            </div>
            <div className="relative h-2 bg-red-500 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-green-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{yesPercentage.toFixed(1)}% YES</span>
              <span>{(100 - yesPercentage).toFixed(1)}% NO</span>
            </div>
          </div>
        </div>

        {/* Outcome Summary */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {round.outcome
              ? `Price ended above target. YES bettors won ${(totalPool * 0.98).toFixed(4)} SOM.`
              : `Price ended below target. NO bettors won ${(totalPool * 0.98).toFixed(4)} SOM.`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RoundHistoryProps {
  marketId: number
  symbol?: string
}

export function RoundHistory({ marketId, symbol }: RoundHistoryProps) {
  const [displayCount, setDisplayCount] = useState(5)
  const { rounds, loading, error } = useMarketHistory(marketId, 20) // Fetch up to 20 rounds

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 5, rounds.length))
  }

  const visibleRounds = rounds.slice(0, displayCount)
  const hasMore = displayCount < rounds.length

  // Calculate overall statistics
  const totalRounds = rounds.length
  const yesWins = rounds.filter((r) => r.outcome).length
  const noWins = totalRounds - yesWins
  const yesWinRate =
    totalRounds > 0 ? ((yesWins / totalRounds) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Rounds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading round history...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <div className="text-lg font-medium mb-2">
                Error Loading History
              </div>
              <div className="text-sm">{error}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Total Rounds
            </div>
            <div className="text-2xl font-bold">{totalRounds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">YES Wins</div>
            <div className="text-2xl font-bold text-green-600">{yesWins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">NO Wins</div>
            <div className="text-2xl font-bold text-red-600">{noWins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">
              YES Win Rate
            </div>
            <div className="text-2xl font-bold">{yesWinRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Round History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rounds {symbol && `- ${symbol}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleRounds.length > 0 ? (
            <>
              <div className="space-y-4">
                {visibleRounds.map((round) => (
                  <RoundCard key={round.id} round={round} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full md:w-auto"
                  >
                    Load More Rounds
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-lg font-medium mb-2">
                No History Available
              </div>
              <div className="text-sm">
                Round history will appear here once rounds have been completed
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
