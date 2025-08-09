// Core prediction market types
export interface Round {
  id: number
  startTime: number
  endTime: number
  priceTarget: string
  totalYes: string
  totalNo: string
  resolved: boolean
  outcome?: boolean
  finalPrice?: string
}

export interface UserBet {
  roundId: number
  amount: string
  prediction: boolean
  claimed: boolean
  potential?: string
}

export interface PriceData {
  price: string
  timestamp: number
  isStale?: boolean
}

// UI and interaction types
export interface BetFormData {
  amount: string
  prediction: boolean
}

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
  duration?: number
}

// Contract interaction types
export interface ContractAddresses {
  predictionMarket: `0x${string}`
  oracle: `0x${string}`
}

export interface TransactionStatus {
  hash?: string
  status: 'idle' | 'pending' | 'success' | 'error'
  error?: string
}

// Statistics and analytics
export interface UserStats {
  totalBets: number
  totalWinnings: string
  totalLosses: string
  winRate: number
  winStreak: number
  bestStreak: number
  averageBet: string
}

export interface RoundStats {
  totalVolume: string
  totalBettors: number
  averageBet: string
  yesPercentage: number
  noPercentage: number
}

// Time and formatting utilities
export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export type TabType = 'markets' | 'current' | 'history' | 'dashboard' | 'admin'

// Wagmi and Web3 related types
export interface WalletState {
  isConnected: boolean
  address?: string
  chainId?: number
  isLoading: boolean
  error?: string
}

// Contract event types
export interface RoundStartedEvent {
  roundId: bigint
  startTime: bigint
  endTime: bigint
  priceTarget: bigint
}

export interface BetPlacedEvent {
  roundId: bigint
  user: string
  prediction: boolean
  amount: bigint
}

export interface RoundResolvedEvent {
  roundId: bigint
  outcome: boolean
  finalPrice: bigint
  totalYes: bigint
  totalNo: bigint
}
