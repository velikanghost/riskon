/**
 * Round Scheduler Service
 * Handles automated round creation and resolution scheduling
 */

import {
  autoResolveAllRounds,
  startNewRound,
  getMarketsWithRounds,
} from './priceKeeper'

export interface SchedulerConfig {
  resolveCheckInterval: number // How often to check for rounds to resolve (ms)
  newRoundInterval: number // How often to start new rounds (ms)
  enableAutoResolve: boolean
  enableAutoNewRounds: boolean
  priceTargets: Record<string, () => Promise<number>> // Functions to calculate price targets
}

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
/**
 * Default price target calculators
 */
const defaultPriceTargets = {
  'BTC/USD': async (): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prices?symbol=BTC/USD`)
      if (!response.ok) {
        throw new Error(`Failed to fetch BTC price: ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.success || !data.price) {
        throw new Error('Invalid price data for BTC/USD')
      }
      return Math.round(data.price * 1.002 * 100) / 100 // +0.2%
    } catch (error) {
      console.error('Error fetching BTC/USD price:', error)
      throw error
    }
  },

  'ETH/USD': async (): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prices?symbol=ETH/USD`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ETH price: ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.success || !data.price) {
        throw new Error('Invalid price data for ETH/USD')
      }
      return Math.round(data.price * 1.003 * 100) / 100 // +0.3%
    } catch (error) {
      console.error('Error fetching ETH/USD price:', error)
      throw error
    }
  },

  'SOL/USD': async (): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prices?symbol=SOL/USD`)
      if (!response.ok) {
        throw new Error(`Failed to fetch SOL price: ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.success || !data.price) {
        throw new Error('Invalid price data for SOL/USD')
      }
      return Math.round(data.price * 1.004 * 100) / 100 // +0.4%
    } catch (error) {
      console.error('Error fetching SOL/USD price:', error)
      throw error
    }
  },
}

/**
 * Round Scheduler Class
 */
export class RoundScheduler {
  private resolveIntervalId: NodeJS.Timeout | null = null
  private newRoundIntervalId: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(
    private config: SchedulerConfig = {
      resolveCheckInterval: 60000, // Check every minute
      newRoundInterval: 300000, // New rounds every 5 minutes
      enableAutoResolve: true,
      enableAutoNewRounds: true,
      priceTargets: defaultPriceTargets,
    },
  ) {}

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.warn('RoundScheduler is already running')
      return
    }

    console.log('🚀 Starting RoundScheduler service...')
    this.isRunning = true

    // Start resolution checking
    if (this.config.enableAutoResolve) {
      this.startResolutionScheduler()
    }

    // Start new round creation
    if (this.config.enableAutoNewRounds) {
      this.startNewRoundScheduler()
    }

    console.log('✅ RoundScheduler service started')
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('RoundScheduler is not running')
      return
    }

    console.log('🛑 Stopping RoundScheduler service...')
    this.isRunning = false

    if (this.resolveIntervalId) {
      clearInterval(this.resolveIntervalId)
      this.resolveIntervalId = null
    }

    if (this.newRoundIntervalId) {
      clearInterval(this.newRoundIntervalId)
      this.newRoundIntervalId = null
    }

    console.log('✅ RoundScheduler service stopped')
  }

  /**
   * Start the resolution scheduler
   */
  private startResolutionScheduler(): void {
    console.log(
      `⏰ Starting auto-resolution (every ${this.config.resolveCheckInterval}ms)`,
    )

    // Run immediately
    this.checkAndResolveRounds()

    // Set up interval
    this.resolveIntervalId = setInterval(() => {
      this.checkAndResolveRounds()
    }, this.config.resolveCheckInterval)
  }

  /**
   * Start the new round scheduler
   */
  private startNewRoundScheduler(): void {
    console.log(
      `⏰ Starting auto-new-rounds (every ${this.config.newRoundInterval}ms)`,
    )

    // Wait a bit before first run to let any existing rounds resolve
    setTimeout(() => {
      this.checkAndCreateNewRounds()

      // Set up interval
      this.newRoundIntervalId = setInterval(() => {
        this.checkAndCreateNewRounds()
      }, this.config.newRoundInterval)
    }, 10000) // Wait 10 seconds
  }

  /**
   * Check for rounds that need resolution
   */
  private async checkAndResolveRounds(): Promise<void> {
    try {
      console.log('🔍 Checking for rounds to resolve...')

      const result = await autoResolveAllRounds()

      if (result.resolvedRounds.length > 0) {
        console.log(`✅ Resolved ${result.resolvedRounds.length} rounds:`)
        result.resolvedRounds.forEach((round) => {
          console.log(
            `   📊 ${round.symbol}: Round ${round.roundId} → $${round.finalPrice}`,
          )
        })
      }

      if (result.errors && result.errors.length > 0) {
        console.warn(`⚠️  Resolution errors:`)
        result.errors.forEach((error) => {
          console.warn(`   ❌ ${error.symbol}: ${error.error}`)
        })
      }
    } catch (error) {
      console.error('❌ Error in resolution check:', error)
    }
  }

  /**
   * Check if new rounds need to be created
   */
  private async checkAndCreateNewRounds(): Promise<void> {
    try {
      console.log('🔍 Checking if new rounds need to be created...')

      const marketsData = await getMarketsWithRounds()
      const results = []
      const errors = []

      for (const market of marketsData.markets) {
        if (!market.isActive) continue

        try {
          // Check if market needs a new round
          const needsNewRound =
            !market.currentRound ||
            market.currentRound.resolved ||
            !market.currentRound.isActive

          if (needsNewRound) {
            console.log(`🎯 Market ${market.symbol} needs a new round`)

            // Calculate price target
            const targetCalculator = this.config.priceTargets[market.symbol]
            if (!targetCalculator) {
              console.warn(
                `⚠️  No price target calculator for ${market.symbol}`,
              )
              continue
            }

            const priceTarget = await targetCalculator()
            console.log(
              `📈 Calculated target price for ${market.symbol}: $${priceTarget}`,
            )

            // Start new round
            const result = await startNewRound(market.id, priceTarget)

            results.push({
              ...result,
              symbol: market.symbol,
            })

            console.log(
              `🎉 Started new round for ${market.symbol} with target $${priceTarget}`,
            )
          } else {
            console.log(
              `ℹ️  Market ${market.symbol} has active round ${market?.currentRound?.roundId}`,
            )
          }
        } catch (error) {
          console.error(
            `❌ Failed to create round for ${market.symbol}:`,
            error,
          )
          errors.push({
            marketId: market.id,
            symbol: market.symbol,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      if (results.length > 0) {
        console.log(`✅ Created ${results.length} new rounds`)
      }

      if (errors.length > 0) {
        console.warn(`⚠️  ${errors.length} errors creating new rounds`)
      }
    } catch (error) {
      console.error('❌ Error in new round check:', error)
    }
  }

  /**
   * Manual trigger for resolution check
   */
  async manualResolveCheck(): Promise<void> {
    console.log('🔧 Manual resolution check triggered')
    await this.checkAndResolveRounds()
  }

  /**
   * Manual trigger for new round check
   */
  async manualNewRoundCheck(): Promise<void> {
    console.log('🔧 Manual new round check triggered')
    await this.checkAndCreateNewRounds()
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      intervals: {
        resolve: this.resolveIntervalId !== null,
        newRounds: this.newRoundIntervalId !== null,
      },
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (this.isRunning) {
      console.log('🔄 Restarting scheduler with new config...')
      this.stop()
      this.start()
    }
  }
}

// Default scheduler instance
export const defaultRoundScheduler = new RoundScheduler()
