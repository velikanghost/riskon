'use client'

import { useEffect, useState } from 'react'
import { useMarkets, useMarketPrice } from '@/hooks/useMarkets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAppDispatch } from '@/hooks/useRedux'
import { setSelectedTab } from '@/store/slices/uiSlice'
import { SUPPORTED_MARKETS, MarketSymbol } from '@/types/market'
import { formatUnits } from 'viem'

interface MarketCardProps {
  symbol: MarketSymbol
  isSelected: boolean
  onSelect: (symbol: MarketSymbol) => void
  now: number // epoch ms
}

function MarketCard({ symbol, isSelected, onSelect, now }: MarketCardProps) {
  const marketInfo = SUPPORTED_MARKETS[symbol]
  const { price, isLoading, error } = useMarketPrice(symbol)
  const { markets } = useMarkets()

  const market = markets.find((m) => m.id === marketInfo.id)
  const currentRound = market?.currentRound

  const handleSelect = () => {
    onSelect(symbol)
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const getPoolTotal = () => {
    if (!currentRound) return '0'
    const totalYes = BigInt(currentRound.totalYes)
    const totalNo = BigInt(currentRound.totalNo)
    const total = totalYes + totalNo
    return formatUnits(total, 18)
  }

  const getTimeRemaining = () => {
    if (!currentRound || !currentRound.isActive) return null
    const nowSec = Math.floor(now / 1000)
    const remaining = Math.max(0, Number(currentRound.endTime) - nowSec)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } ${!market?.isActive ? 'opacity-60' : ''}`}
      onClick={handleSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{marketInfo.icon || '💰'}</div>
            <div>
              <CardTitle className="text-lg">{symbol}</CardTitle>
              <p className="text-sm text-muted-foreground">{marketInfo.name}</p>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            ) : error ? (
              <span className="text-red-500 text-sm">Error</span>
            ) : (
              <div className="text-lg font-bold">{formatPrice(price)}</div>
            )}
            {!market?.isActive && (
              <Badge variant="secondary" className="mt-1">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {currentRound ? (
          <div className="space-y-3">
            {/* Round Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Round #{currentRound.id}
              </span>
              {currentRound.isActive ? (
                <Badge variant="default" className="bg-green-500">
                  Active {getTimeRemaining() && `• ${getTimeRemaining()}`}
                </Badge>
              ) : currentRound.resolved ? (
                <Badge variant="secondary">Resolved</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>

            {/* Target Price */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target Price</span>
                <span className="font-medium">
                  {formatPrice(
                    parseFloat(formatUnits(currentRound.priceTarget as any, 8)),
                  )}
                </span>
              </div>
            </div>

            {/* Pool Distribution */}
            {currentRound.totalYes !== '0' || currentRound.totalNo !== '0' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pool</span>
                  <span className="font-medium">
                    {parseFloat(getPoolTotal()).toFixed(2)} STT
                  </span>
                </div>

                {/* YES/NO Distribution */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">YES</span>
                    <span className="text-red-600">NO</span>
                  </div>
                  <Progress
                    value={
                      (parseFloat(currentRound.totalYes) /
                        (parseFloat(currentRound.totalYes) +
                          parseFloat(currentRound.totalNo))) *
                      100
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {parseFloat(
                        formatUnits(BigInt(currentRound.totalYes), 18),
                      ).toFixed(1)}{' '}
                      STT
                    </span>
                    <span>
                      {parseFloat(
                        formatUnits(BigInt(currentRound.totalNo), 18),
                      ).toFixed(1)}{' '}
                      STT
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                No bets placed yet
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No active round
          </div>
        )}

        {/* Select Button */}
        <Button
          className="w-full mt-4"
          variant={isSelected ? 'default' : 'outline'}
          disabled={!market?.isActive}
        >
          {isSelected ? 'Selected' : 'Select Market'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function MarketArena() {
  const dispatch = useAppDispatch()
  const {
    markets,
    selectedMarketSymbol,
    selectMarket,
    fetchMarkets,
    isLoadingMarkets,
  } = useMarkets()

  // shared ticker for live countdowns
  const [now, setNow] = useState<number>(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchMarkets(true) // Fetch markets with rounds
  }, [])

  const handleSelectMarket = (symbol: MarketSymbol) => {
    selectMarket(symbol)
    // Navigate to current round view
    dispatch(setSelectedTab('current'))
  }

  if (isLoadingMarkets) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Market Arena</h1>
          <p className="text-muted-foreground">Choose your prediction market</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Market Arena
        </h1>
        <p className="text-muted-foreground">
          Choose your prediction market and start making predictions
        </p>
        <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
          <span>✨ Real-time prices</span>
          <span>•</span>
          <span>⚡ 5-minute rounds</span>
          <span>•</span>
          <span>🏆 Instant rewards</span>
        </div>
      </div>

      {/* Market Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(SUPPORTED_MARKETS).map((symbol) => (
          <MarketCard
            key={symbol}
            symbol={symbol as MarketSymbol}
            isSelected={selectedMarketSymbol === symbol}
            onSelect={handleSelectMarket}
            now={now}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-4 pt-8">
        <div className="text-sm text-muted-foreground">
          Markets are powered by Somnia blockchain with real-time price feeds
        </div>

        {selectedMarketSymbol && (
          <Button
            onClick={() => dispatch(setSelectedTab('current'))}
            size="lg"
            className="px-8"
          >
            Go to {selectedMarketSymbol} Market →
          </Button>
        )}
      </div>
    </div>
  )
}
