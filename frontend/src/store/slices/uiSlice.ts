import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  isLoading: boolean
  error: string | null
  selectedTab: 'markets' | 'current' | 'history' | 'dashboard'
  showConnectModal: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: number
  }>
}

const initialState: UiState = {
  isLoading: false,
  error: null,
  selectedTab: 'markets',
  showConnectModal: false,
  notifications: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSelectedTab: (state, action: PayloadAction<UiState['selectedTab']>) => {
      state.selectedTab = action.payload
    },
    setShowConnectModal: (state, action: PayloadAction<boolean>) => {
      state.showConnectModal = action.payload
    },
    addNotification: (
      state,
      action: PayloadAction<
        Omit<UiState['notifications'][0], 'id' | 'timestamp'>
      >,
    ) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
})

export const {
  setLoading,
  setError,
  setSelectedTab,
  setShowConnectModal,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions

export const uiReducer = uiSlice.reducer
