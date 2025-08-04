'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface HistoricalRound {
  id: number
  startTime: number
  endTime: number
  priceTarget: string
  finalPrice: string
  totalYes: string
  totalNo: string
  outcome: boolean
  resolved: true
}

// Mock historical data - in real app this would come from blockchain/backend
const mockHistoricalRounds: HistoricalRound[] = [
  {
    id: 5,
    startTime: Date.now() - 600000, // 10 mins ago
    endTime: Date.now() - 300000, // 5 mins ago
    priceTarget: '3000.00',
    finalPrice: '3025.50',
    totalYes: '2.5',
    totalNo: '1.8',
    outcome: true,
    resolved: true,
  },
  {
    id: 4,
    startTime: Date.now() - 900000, // 15 mins ago
    endTime: Date.now() - 600000, // 10 mins ago
    priceTarget: '3050.00',
    finalPrice: '3020.75',
    totalYes: '3.2',
    totalNo: '2.1',
    outcome: false,
    resolved: true,
  },
  {
    id: 3,
    startTime: Date.now() - 1200000, // 20 mins ago
    endTime: Date.now() - 900000, // 15 mins ago
    priceTarget: '2980.00',
    finalPrice: '3010.25',
    totalYes: '1.9',
    totalNo: '2.7',
    outcome: true,
    resolved: true,
  },
  {
    id: 2,
    startTime: Date.now() - 1500000, // 25 mins ago
    endTime: Date.now() - 1200000, // 20 mins ago
    priceTarget: '3100.00',
    finalPrice: '3085.00',
    totalYes: '4.1',
    totalNo: '1.5',
    outcome: false,
    resolved: true,
  },
  {
    id: 1,
    startTime: Date.now() - 1800000, // 30 mins ago
    endTime: Date.now() - 1500000, // 25 mins ago
    priceTarget: '3000.00',
    finalPrice: '3150.00',
    totalYes: '2.8',
    totalNo: '3.2',
    outcome: true,
    resolved: true,
  },
]

interface RoundCardProps {
  round: HistoricalRound
}

function RoundCard({ round }: RoundCardProps) {
  const totalPool = parseFloat(round.totalYes) + parseFloat(round.totalNo)
  const yesPercentage =
    totalPool > 0 ? (parseFloat(round.totalYes) / totalPool) * 100 : 50
  const target = parseFloat(round.priceTarget)
  const final = parseFloat(round.finalPrice)
  const priceDiff = final - target
  const priceDiffPercentage = ((Math.abs(priceDiff) / target) * 100).toFixed(2)

  const timeAgo = Math.floor((Date.now() - round.endTime) / 60000) // minutes ago

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

export function RoundHistory() {
  const [displayCount, setDisplayCount] = useState(5)
  const [rounds] = useState(mockHistoricalRounds)

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
          <CardTitle>Recent Rounds</CardTitle>
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
