// Pyth Network price feed IDs
export const PYTH_FEEDS = {
  'BTC/USD':
    '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD':
    '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD':
    '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'USDC/USD':
    '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
} as const

export const HERMES_API_BASE = 'https://hermes.pyth.network'

// USD increment configuration for each market
export const MARKET_USD_INCREMENTS = {
  'BTC/USD': 10, // $10 increment/decrement
  'ETH/USD': 5, // $5 increment/decrement
  'SOL/USD': 2, // $2 increment/decrement
} as const

export interface PythPriceData {
  id: string
  price: {
    price: string
    conf: string
    expo: number
    publish_time: number
  }
  ema_price: {
    price: string
    conf: string
    expo: number
    publish_time: number
  }
}

export function formatPythPrice(priceData: PythPriceData): number {
  // Convert price considering exponent (e.g., -8 means divide by 10^8)
  return Number(priceData.price.price) * Math.pow(10, priceData.price.expo)
}
