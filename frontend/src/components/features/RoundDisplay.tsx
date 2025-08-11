'use client'

import { useAccount } from 'wagmi'
import { useCurrentRound, useUserBet } from '@/hooks/useMultiMarketPrediction'
import { useAppSelector } from '@/hooks/useRedux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountdownTimer } from './CountdownTimer'
import { PriceDisplay } from './PriceDisplay'
import { BettingForm } from './BettingForm'
import { formatEther } from 'viem'
import { useAppDispatch } from '@/hooks/useRedux'
import { setSelectedTab } from '@/store/slices/uiSlice'
import { useMarkets } from '@/hooks/useMarkets'
import { formatPriceDecimals, formatUSDUnits } from '@/lib/helpers'
import { useMarketPrice } from '@/hooks/useMarkets'
import { MARKET_USD_INCREMENTS } from '@/lib/pythConfig'

export function RoundDisplay() {
  const dispatch = useAppDispatch()
  const { address } = useAccount()
  const { markets, selectedMarketId, selectedMarketSymbol } = useAppSelector(
    (state) => state.market,
  )
  const { selectMarket } = useMarkets()

  const marketId = BigInt(selectedMarketId || 1)
  const { round, isLoading, error } = useCurrentRound(marketId)
  const { bet: userBet } = useUserBet(marketId, BigInt(round?.id || 0), address)
  const { price: currentPrice } = useMarketPrice(
    selectedMarketSymbol || 'BTC/USD',
  )

  // Calculate prediction question
  const getPredictionQuestion = () => {
    if (!round || !currentPrice) return ''

    const rawTargetPrice = BigInt(round.priceTarget)
    const targetPrice = Number(rawTargetPrice) / 100000000 // Convert from 8-decimal format to USD
    const current = currentPrice

    // Get the USD increment for this market
    const usdIncrement =
      MARKET_USD_INCREMENTS[
        selectedMarketSymbol as keyof typeof MARKET_USD_INCREMENTS
      ] || 10

    // Determine if this is an increment or decrement round
    if (targetPrice > current) {
      // This is an increment round - target is above current price
      return `Will ${selectedMarketSymbol?.split('/')[0]} go above $${targetPrice.toFixed(2)}?`
    } else {
      // This is a decrement round - target is below current price
      return `Will ${selectedMarketSymbol?.split('/')[0]} go below $${targetPrice.toFixed(2)}?`
    }
  }

  // Get target direction indicator
  const getTargetDirection = () => {
    if (!round || !currentPrice) return null

    const rawTargetPrice = BigInt(round.priceTarget)
    const targetPrice = Number(rawTargetPrice) / 100000000 // Convert from 8-decimal format to USD
    const current = currentPrice
    const difference = Math.abs(targetPrice - current)

    // Get the USD increment for this market
    const usdIncrement =
      MARKET_USD_INCREMENTS[
        selectedMarketSymbol as keyof typeof MARKET_USD_INCREMENTS
      ] || 10

    if (targetPrice > current) {
      return {
        direction: 'above',
        difference: usdIncrement, // Show the USD increment, not the full difference
        color: 'text-green-600',
        type: 'increment',
      }
    } else {
      return {
        direction: 'below',
        difference: usdIncrement, // Show the USD increment, not the full difference
        color: 'text-red-600',
        type: 'decrement',
      }
    }
  }

  // Quick market switcher
  const MarketSwitcher = () => (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-muted-foreground">Market:</span>
      <select
        className="border rounded px-3 py-1 text-sm bg-background"
        value={selectedMarketSymbol || ''}
        onChange={(e) => selectMarket(e.target.value as any)}
      >
        <option value="" disabled>
          Select market
        </option>
        {markets.map((m) => (
          <option key={m.id} value={m.symbol as any}>
            {m.symbol}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        onClick={() => dispatch(setSelectedTab('markets'))}
      >
        View All
      </Button>
    </div>
  )

  if (!selectedMarketId || !selectedMarketSymbol) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <MarketSwitcher />
          <div className="text-muted-foreground">
            Choose a prediction market to start betting
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="h-12 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !round) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <MarketSwitcher />
          <div className="text-red-500">⚠️ Error Loading Round</div>
          <p className="text-muted-foreground">
            {error?.message || 'Unable to load current round data'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalPool = BigInt(round.totalYes) + BigInt(round.totalNo)
  const yesAmount = BigInt(round.totalYes)
  const noAmount = BigInt(round.totalNo)

  const yesPercentage =
    totalPool > 0n ? Number((yesAmount * 100n) / totalPool) : 50

  const hasUserBet = userBet && BigInt(userBet.amount) > 0n

  return (
    <div className="space-y-6">
      {/* Round Header */}
      <Card>
        <CardHeader className="text-center pb-3 space-y-3">
          <MarketSwitcher />
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Round #{round.id}
            </Badge>
            {round.resolved ? (
              <Badge variant="secondary">Resolved</Badge>
            ) : (
              <Badge variant="default" className="animate-pulse">
                Live
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{getPredictionQuestion()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer and Price Display */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex justify-center">
              {!round.resolved && (
                <CountdownTimer endTime={round.endTime} className="w-full" />
              )}
              {round.resolved && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    Round Completed
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Resolved
                  </Badge>
                </div>
              )}
            </div>
            <PriceDisplay
              marketSymbol={selectedMarketSymbol}
              targetPrice={round.priceTarget}
              className="border-0 shadow-none p-0"
            />
          </div>

          {/* Pool Information */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Total Pool
              </div>
              <div className="text-2xl font-bold">
                {parseFloat(formatEther(totalPool)).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                })}{' '}
                STT
              </div>
            </div>

            {/* YES/NO Pool Visualization */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">
                  YES:{' '}
                  {parseFloat(formatEther(yesAmount)).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    },
                  )}{' '}
                  STT
                </span>
                <span className="text-red-600 font-medium">
                  NO:{' '}
                  {parseFloat(formatEther(noAmount)).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })}{' '}
                  STT
                </span>
              </div>

              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${yesPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground/90">
                    {yesPercentage.toFixed(1)}% YES |{' '}
                    {(100 - yesPercentage).toFixed(1)}% NO
                  </span>
                </div>
              </div>
            </div>

            {/* User's Current Bet */}
            {hasUserBet && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      Your Bet
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <Badge
                        variant={userBet.prediction ? 'default' : 'secondary'}
                        className={
                          userBet.prediction ? 'bg-green-600' : 'bg-red-600'
                        }
                      >
                        {userBet.prediction ? 'YES' : 'NO'}
                      </Badge>
                      <span className="font-bold">
                        {parseFloat(
                          formatEther(BigInt(userBet.amount)),
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 4,
                        })}{' '}
                        STT
                      </span>
                    </div>
                    {userBet.claimed && (
                      <Badge variant="outline" className="mt-2">
                        Winnings Claimed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Betting Form */}
      {!round.resolved && !hasUserBet && (
        <BettingForm
          marketId={marketId}
          roundId={round.id}
          isRoundActive={round.endTime > Math.floor(Date.now() / 1000)}
        />
      )}

      {/* Additional Info for Resolved Rounds */}
      {round.resolved && (
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">
              This round has been resolved. Check the History tab for results.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
