import { NextRequest, NextResponse } from 'next/server'
import { PYTH_FEEDS, HERMES_API_BASE, formatPythPrice } from '@/lib/pythConfig'

// Supported markets configuration
const SUPPORTED_MARKETS = {
  'BTC/USD': {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    feedId: PYTH_FEEDS['BTC/USD'],
  },
  'ETH/USD': {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    feedId: PYTH_FEEDS['ETH/USD'],
  },
  'SOL/USD': {
    symbol: 'SOL/USD',
    name: 'Solana',
    feedId: PYTH_FEEDS['SOL/USD'],
  },
} as const

type MarketSymbol = keyof typeof SUPPORTED_MARKETS

/**
 * Fetch current price for a market from Pyth Network
 */
async function fetchMarketPrice(symbol: MarketSymbol): Promise<{
  symbol: MarketSymbol
  price: number
  timestamp: number
  success: boolean
  error?: string
}> {
  try {
    const feedId = SUPPORTED_MARKETS[symbol].feedId
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

    return {
      symbol,
      price: formatPythPrice(priceData),
      timestamp: priceData.price.publish_time,
      success: true,
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return {
      symbol,
      price: 0,
      timestamp: Math.floor(Date.now() / 1000),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * GET /api/prices
 * Get current prices for all supported markets or a specific market
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol') as MarketSymbol | null

    // If symbol is specified, fetch only that market
    if (symbol) {
      if (!SUPPORTED_MARKETS[symbol]) {
        return NextResponse.json(
          {
            error: 'Unsupported market symbol',
            supportedMarkets: Object.keys(SUPPORTED_MARKETS),
          },
          { status: 400 },
        )
      }

      const result = await fetchMarketPrice(symbol)
      return NextResponse.json(result)
    }

    // Fetch all markets
    const symbols = Object.keys(SUPPORTED_MARKETS) as MarketSymbol[]
    const feedIds = symbols.map((s) => SUPPORTED_MARKETS[s].feedId)

    // Fetch all prices in a single request
    const url = `${HERMES_API_BASE}/v2/updates/price/latest?${feedIds
      .map((id) => `ids[]=${id}`)
      .join('&')}`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const results = data.parsed.map((priceData: any) => {
      const symbol = symbols.find(
        (s) => SUPPORTED_MARKETS[s].feedId === priceData.id,
      )!
      return {
        symbol,
        price: formatPythPrice(priceData),
        timestamp: priceData.price.publish_time,
        success: true,
      }
    })

    // Separate successful and failed requests
    const successful = results.filter((r: { success: boolean }) => r.success)
    const failed = results.filter((r: { success: boolean }) => !r.success)

    return NextResponse.json({
      success: true,
      timestamp: Math.floor(Date.now() / 1000),
      prices: successful,
      errors: failed.length > 0 ? failed : undefined,
      totalMarkets: symbols.length,
      successfulMarkets: successful.length,
    })
  } catch (error) {
    console.error('Error in prices API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/prices/refresh
 * Force refresh prices for all markets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body

    let marketsToRefresh: MarketSymbol[]

    if (symbols && Array.isArray(symbols)) {
      // Validate provided symbols
      const invalidSymbols = symbols.filter(
        (s) => !SUPPORTED_MARKETS[s as MarketSymbol],
      )
      if (invalidSymbols.length > 0) {
        return NextResponse.json(
          {
            error: 'Invalid symbols',
            invalidSymbols,
            supportedMarkets: Object.keys(SUPPORTED_MARKETS),
          },
          { status: 400 },
        )
      }
      marketsToRefresh = symbols as MarketSymbol[]
    } else {
      // Refresh all markets
      marketsToRefresh = Object.keys(SUPPORTED_MARKETS) as MarketSymbol[]
    }

    const feedIds = marketsToRefresh.map((s) => SUPPORTED_MARKETS[s].feedId)
    const url = `${HERMES_API_BASE}/v2/updates/price/latest?${feedIds
      .map((id) => `ids[]=${id}`)
      .join('&')}`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const results = data.parsed.map((priceData: any) => {
      const symbol = marketsToRefresh.find(
        (s) => SUPPORTED_MARKETS[s].feedId === priceData.id,
      )!
      return {
        symbol,
        price: formatPythPrice(priceData),
        timestamp: priceData.price.publish_time,
        success: true,
      }
    })

    const successful = results.filter((r: { success: boolean }) => r.success)
    const failed = results.filter((r: { success: boolean }) => !r.success)

    return NextResponse.json({
      success: true,
      refreshed: true,
      timestamp: Math.floor(Date.now() / 1000),
      prices: successful,
      errors: failed.length > 0 ? failed : undefined,
      requestedMarkets: marketsToRefresh.length,
      successfulRefresh: successful.length,
    })
  } catch (error) {
    console.error('Error refreshing prices:', error)
    return NextResponse.json(
      {
        error: 'Failed to refresh prices',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
