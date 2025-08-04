import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Types for our prediction market data
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
}

export interface PriceData {
  price: string
  timestamp: number
}

// This API will be used for caching and local data management
// Actual blockchain data will be fetched using Wagmi hooks
export const predictionApi = createApi({
  reducerPath: 'predictionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
  }),
  tagTypes: ['Round', 'UserBet', 'Price'],
  endpoints: (builder) => ({
    // These endpoints will be implemented when we have a backend API
    // For now, we'll use Wagmi hooks directly for blockchain data
    placeholder: builder.query<{ message: string }, void>({
      query: () => 'placeholder',
    }),
  }),
})

export const {
  // API hooks will be exported here when implemented
} = predictionApi
