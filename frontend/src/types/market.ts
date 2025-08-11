export interface Market {
  id: number
  symbol: string
  name: string
  isActive: boolean
  currentRound?: RoundInfo | null
}

export interface RoundInfo {
  marketId: number
  id: number
  startTime: number
  endTime: number
  priceTarget: string
  totalYes: string
  totalNo: string
  resolved: boolean
  outcome?: boolean
  finalPrice?: string
  isActive: boolean
  timeRemaining: number
  yesOdds?: number
  noOdds?: number
}

export interface Bet {
  roundId: number
  amount: string
  prediction: boolean
  claimed: boolean
  odds: string
  timestamp: number
}

export interface MarketPrice {
  symbol: string
  price: number
  timestamp: number
  success: boolean
  error?: string
}

export type MarketSymbol = 'BTC/USD' | 'ETH/USD' | 'SOL/USD'

export const SUPPORTED_MARKETS: Record<
  MarketSymbol,
  { id: number; name: string; icon?: string }
> = {
  'BTC/USD': { id: 1, name: 'Bitcoin', icon: '₿' },
  'ETH/USD': { id: 2, name: 'Ethereum', icon: 'Ξ' },
  'SOL/USD': { id: 3, name: 'Solana', icon: '◎' },
}
