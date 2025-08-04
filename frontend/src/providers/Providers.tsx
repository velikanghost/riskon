'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Provider as ReduxProvider } from 'react-redux'
import { config } from '@/lib/wagmi'
import { store } from '@/store'
import { Toaster } from '@/components/ui/sonner'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5 seconds - for real-time data
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider showRecentTransactions={true}>
            {children}
            <Toaster
              position="top-right"
              expand={true}
              richColors={true}
              duration={4000}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ReduxProvider>
  )
}
