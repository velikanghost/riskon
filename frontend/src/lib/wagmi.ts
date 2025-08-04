import { http } from 'wagmi'
import { somniaTestnet } from 'viem/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'Riskon - Prediction Market',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [somniaTestnet],
  transports: {
    [somniaTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  ssr: true,
})

export const RISKON_ADDRESS = process.env
  .NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
export const FEED_ADDRESS = process.env
  .NEXT_PUBLIC_FEED_ADDRESS as `0x${string}`
