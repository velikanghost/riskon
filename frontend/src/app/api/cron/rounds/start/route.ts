import { NextRequest, NextResponse } from 'next/server'
import { getMarketsWithRounds, startNewRound } from '@/lib/priceKeeper'
import { PYTH_FEEDS, HERMES_API_BASE, formatPythPrice } from '@/lib/pythConfig'

const MARKET_CONFIG = {
  'BTC/USD': { increase: 0.2 }, // 0.2% increase
  'ETH/USD': { increase: 0.3 }, // 0.3% increase
  'SOL/USD': { increase: 0.4 }, // 0.4% increase
}

/**
 * Calculate price target with percentage increase
 */
async function calculatePriceTarget(
  symbol: string,
  increasePercentage: number,
): Promise<number> {
  try {
    const feedId = PYTH_FEEDS[symbol as keyof typeof PYTH_FEEDS]
    if (!feedId) {
      throw new Error(`No Pyth feed ID for symbol: ${symbol}`)
    }

    const url = `${HERMES_API_BASE}/v2/updates/price/latest?ids[]=${feedId}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const priceData = data.parsed[0]

    if (!priceData || !priceData.price) {
      throw new Error('Invalid response format or no price data')
    }

    const currentPrice = formatPythPrice(priceData)
    // Calculate target price with percentage increase
    const targetPrice = currentPrice * (1 + increasePercentage / 100)

    return Math.round(targetPrice * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    throw error
  }
}

/**
 * POST /api/cron/rounds/start
 * Automatically start new rounds for all active markets
 */
export async function POST(request: NextRequest) {
  try {
    const marketsData = await getMarketsWithRounds()
    const results = []
    const errors = []

    for (const market of marketsData.markets) {
      if (!market.isActive) continue

      try {
        const config =
          MARKET_CONFIG[market.symbol as keyof typeof MARKET_CONFIG]
        if (!config) {
          console.warn(`No config for market ${market.symbol}, skipping`)
          continue
        }

        const targetPrice = await calculatePriceTarget(
          market.symbol,
          config.increase,
        )
        const result = await startNewRound(market.id, targetPrice)

        results.push({
          ...result,
          symbol: market.symbol,
        })

        console.log(
          `Started round for ${market.symbol} with target $${targetPrice} (${config.increase}% increase)`,
        )
      } catch (error) {
        console.error(`Failed to start round for market ${market.id}:`, error)
        errors.push({
          marketId: market.id,
          symbol: market.symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      started: results,
      errors: errors.length > 0 ? errors : undefined,
      totalStarted: results.length,
      totalErrors: errors.length,
    })
  } catch (error) {
    console.error('Error starting rounds:', error)
    return NextResponse.json(
      {
        error: 'Failed to start rounds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
