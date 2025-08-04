import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { predictionApi } from './api/predictionApi'
import { uiReducer } from './slices/uiSlice'
import { userReducer } from './slices/userSlice'
import { marketReducer } from './slices/marketSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    user: userReducer,
    market: marketReducer,
    [predictionApi.reducerPath]: predictionApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(predictionApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
