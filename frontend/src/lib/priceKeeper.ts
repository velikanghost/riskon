/**
 * Price Keeper Service
 * Handles automated price fetching and round resolution
 */

// Types
export interface MarketPrice {
  symbol: string
  price: number
  timestamp: number
  success: boolean
  error?: string
}

export interface RoundInfo {
  marketId: number
  roundId: number
  startTime: number
  endTime: number
  priceTarget: string
  resolved: boolean
  isActive: boolean
}

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Fetch current prices for all markets
 */
export async function fetchAllPrices(): Promise<{
  success: boolean
  prices: MarketPrice[]
  errors?: MarketPrice[]
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prices`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching prices:', error)
    throw error
  }
}

/**
 * Fetch price for a specific market
 */
export async function fetchMarketPrice(symbol: string): Promise<MarketPrice> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prices?symbol=${symbol}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    throw error
  }
}

/**
 * Get all active markets with current rounds
 */
export async function getMarketsWithRounds(): Promise<{
  success: boolean
  markets: Array<{
    id: number
    symbol: string
    name: string
    isActive: boolean
    currentRound: RoundInfo | null
  }>
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/markets?includeRounds=true`,
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching markets with rounds:', error)
    throw error
  }
}

/**
 * Resolve a specific round with a price
 */
export async function resolveRound(
  marketId: number,
  roundId: number,
  finalPrice?: number,
): Promise<{
  success: boolean
  transactionHash: string
  finalPrice: number
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/rounds/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketId,
        roundId,
        finalPrice,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(
      `Error resolving round ${roundId} for market ${marketId}:`,
      error,
    )
    throw error
  }
}

/**
 * Auto-resolve all pending rounds
 */
export async function autoResolveAllRounds(): Promise<{
  success: boolean
  resolvedRounds: Array<{
    marketId: number
    symbol: string
    roundId: number
    finalPrice: number
    transactionHash: string
  }>
  errors?: Array<{
    marketId: number
    symbol: string
    error: string
  }>
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/rounds/resolve/auto`,
      {
        method: 'PUT',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error auto-resolving rounds:', error)
    throw error
  }
}

/**
 * Start a new round for a market
 */
export async function startNewRound(
  marketId: number,
  priceTarget: number,
): Promise<{
  success: boolean
  transactionHash: string
  marketId: number
  priceTarget: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/rounds/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketId,
        priceTarget,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error starting new round for market ${marketId}:`, error)
    throw error
  }
}

/**
 * Price Keeper class for automated operations
 */
export class PriceKeeper {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(
    private checkInterval = 30000, // Check every 30 seconds
    private enableAutoResolve = true,
  ) {}

  /**
   * Start the automated price monitoring and round resolution
   */
  start(): void {
    if (this.isRunning) {
      console.warn('PriceKeeper is already running')
      return
    }

    console.log('Starting PriceKeeper service...')
    this.isRunning = true

    // Run immediately
    this.tick()

    // Set up interval
    this.intervalId = setInterval(() => {
      this.tick()
    }, this.checkInterval)
  }

  /**
   * Stop the automated service
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('PriceKeeper is not running')
      return
    }

    console.log('Stopping PriceKeeper service...')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Manual tick - check for rounds to resolve
   */
  async tick(): Promise<void> {
    try {
      console.log('PriceKeeper tick - checking for rounds to resolve...')

      if (this.enableAutoResolve) {
        const result = await autoResolveAllRounds()

        if (result.resolvedRounds.length > 0) {
          console.log(`Resolved ${result.resolvedRounds.length} rounds:`)
          result.resolvedRounds.forEach((round) => {
            console.log(
              `  - Market ${round.marketId} (${round.symbol}): Round ${round.roundId} resolved at $${round.finalPrice}`,
            )
          })
        }

        if (result.errors && result.errors.length > 0) {
          console.warn('Errors occurred during auto-resolve:')
          result.errors.forEach((error) => {
            console.warn(
              `  - Market ${error.marketId} (${error.symbol}): ${error.error}`,
            )
          })
        }
      }

      // Fetch and log current prices
      const pricesResult = await fetchAllPrices()
      if (pricesResult.success && pricesResult.prices.length > 0) {
        console.log('Current market prices:')
        pricesResult.prices.forEach((price) => {
          console.log(`  - ${price.symbol}: $${price.price}`)
        })
      }
    } catch (error) {
      console.error('Error in PriceKeeper tick:', error)
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      enableAutoResolve: this.enableAutoResolve,
    }
  }
}

// Default instance
export const defaultPriceKeeper = new PriceKeeper()
