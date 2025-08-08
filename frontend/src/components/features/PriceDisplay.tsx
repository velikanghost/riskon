'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { useMarketPrice } from '@/hooks/useMarkets'
import { formatPriceDecimals } from '@/lib/helpers'

interface PriceDisplayProps {
  marketSymbol: string
  targetPrice: string
  className?: string
}

export function PriceDisplay({
  marketSymbol,
  targetPrice,
  className,
}: PriceDisplayProps) {
  const { price, isLoading, error } = useMarketPrice(marketSymbol)

  // Use the price from the market price hook
  const currentPrice = price.toString()
  const [prevPrice, setPrevPrice] = useState(currentPrice)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'same'>(
    'same',
  )

  useEffect(() => {
    if (currentPrice !== prevPrice) {
      const current = parseFloat(currentPrice)
      const previous = parseFloat(prevPrice)

      console.log('current', current)

      if (current > previous) {
        setPriceDirection('up')
      } else if (current < previous) {
        setPriceDirection('down')
      } else {
        setPriceDirection('same')
      }

      setPrevPrice(currentPrice)

      // Reset direction after animation
      const timer = setTimeout(() => setPriceDirection('same'), 1000)
      return () => clearTimeout(timer)
    }
  }, [currentPrice, prevPrice])

  const target = parseFloat(targetPrice)
  const current = parseFloat(currentPrice)
  const isAboveTarget = current >= target
  const difference = Math.abs(current - target)
  const percentageDiff =
    target > 0 ? ((difference / target) * 100).toFixed(2) : '0.00'

  const priceColorClass = {
    up: 'text-green-500',
    down: 'text-red-500',
    same: 'text-foreground',
  }[priceDirection]

  // Show loading state while fetching price data
  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-24 mx-auto"></div>
          </div>
        </div>
      </Card>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">⚠️ Price Feed Error</div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Current Price */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            Current {marketSymbol.split('/')[0]} Price
          </div>
          <div
            className={`text-3xl font-bold font-mono transition-colors duration-300 ${priceColorClass}`}
          >
            $
            {current.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {priceDirection !== 'same' && (
            <div className={`text-xs ${priceColorClass} animate-pulse`}>
              {priceDirection === 'up' ? '↗' : '↘'} $
              {formatPriceDecimals(difference)} ({percentageDiff}%)
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
