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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ marketId: string; roundId: string }> },
) {
  try {
    const { marketId, roundId } = await context.params

    const outcomeData = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`,
      abi: riskonAbi,
      functionName: 'getRoundOutcome',
      args: [BigInt(marketId), BigInt(roundId)],
    })

    const [resolved, outcome, finalPrice] = outcomeData as [
      boolean,
      boolean,
      bigint,
    ]

    return NextResponse.json({
      success: true,
      resolved,
      outcome,
      finalPrice: finalPrice.toString(),
    })
  } catch (error) {
    console.error('Error fetching round outcome:', error)
    return NextResponse.json(
      { error: 'Failed to fetch round outcome' },
      { status: 500 },
    )
  }
}
