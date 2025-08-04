'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
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
            Current ETH Price
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

        {/* Divider */}
        <div className="border-t border-border"></div>

        {/* Target Price */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Target Price</div>
          <div className="text-xl font-bold font-mono">
            ${target.toFixed(2)}
          </div>
        </div>

        {/* Price Status */}
        <div className="flex justify-center">
          <Badge
            variant={isAboveTarget ? 'default' : 'secondary'}
            className={`${
              isAboveTarget
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAboveTarget
              ? `$${difference.toFixed(2)} ABOVE`
              : `$${difference.toFixed(2)} BELOW`}{' '}
            TARGET
          </Badge>
        </div>

        {/* Visual Indicator */}
        <div className="relative">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isAboveTarget ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, (difference / target) * 100 * 10)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Target</span>
            <span>Current</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
