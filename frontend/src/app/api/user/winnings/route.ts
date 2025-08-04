import { NextRequest, NextResponse } from 'next/server'
import { riskonAbi } from '@/lib/contracts-generated'

import { createPublicClient, http } from 'viem'
import { somniaTestnet } from 'viem/chains'

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

// Create clients
const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')
    const roundId = searchParams.get('roundId')
    const userAddress = searchParams.get('userAddress')

    if (!marketId || !roundId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }

    const winnings = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`,
      abi: riskonAbi,
      functionName: 'calculateWinnings',
      args: [BigInt(marketId), BigInt(roundId), userAddress as `0x${string}`],
    })

    return NextResponse.json({
      success: true,
      winnings: winnings.toString(),
    })
  } catch (error) {
    console.error('Error calculating winnings:', error)
    return NextResponse.json(
      { error: 'Failed to calculate winnings' },
      { status: 500 },
    )
  }
}
