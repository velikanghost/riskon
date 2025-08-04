import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserBet {
  roundId: number
  amount: string
  prediction: boolean
  claimed: boolean
  potential?: string
}

interface UserState {
  address: string | null
  balance: string | null
  bets: UserBet[]
  totalWinnings: string
  totalLosses: string
  winStreak: number
  bestStreak: number
}

const initialState: UserState = {
  address: null,
  balance: null,
  bets: [],
  totalWinnings: '0',
  totalLosses: '0',
  winStreak: 0,
  bestStreak: 0,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload
    },
    setUserBalance: (state, action: PayloadAction<string | null>) => {
      state.balance = action.payload
    },
    addUserBet: (state, action: PayloadAction<UserBet>) => {
      const existingBetIndex = state.bets.findIndex(
        (bet) => bet.roundId === action.payload.roundId,
      )
      if (existingBetIndex >= 0) {
        state.bets[existingBetIndex] = action.payload
      } else {
        state.bets.push(action.payload)
      }
    },
    updateUserBet: (
      state,
      action: PayloadAction<{ roundId: number; updates: Partial<UserBet> }>,
    ) => {
      const betIndex = state.bets.findIndex(
        (bet) => bet.roundId === action.payload.roundId,
      )
      if (betIndex >= 0) {
        state.bets[betIndex] = {
          ...state.bets[betIndex],
          ...action.payload.updates,
        }
      }
    },
    updateUserStats: (
      state,
      action: PayloadAction<
        Partial<
          Pick<
            UserState,
            'totalWinnings' | 'totalLosses' | 'winStreak' | 'bestStreak'
          >
        >
      >,
    ) => {
      Object.assign(state, action.payload)
    },
    resetUserData: (state) => {
      Object.assign(state, initialState)
    },
  },
})

export const {
  setUserAddress,
  setUserBalance,
  addUserBet,
  updateUserBet,
  updateUserStats,
  resetUserData,
} = userSlice.actions

export const userReducer = userSlice.reducer
