import { syncMarkets, syncCurrentRound } from '../src/lib/databaseSync'

async function setupDatabase() {
  console.log('Setting up database...')

  try {
    // Sync markets
    await syncMarkets()

    // Sync current rounds for all markets
    const markets = [1, 2, 3] // BTC, ETH, SOL
    for (const marketId of markets) {
      await syncCurrentRound(marketId)
    }

    console.log('Database setup complete!')
  } catch (error) {
    console.error('Error setting up database:', error)
  }
}

setupDatabase()
