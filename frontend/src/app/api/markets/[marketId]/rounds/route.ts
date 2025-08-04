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
  { params }: { params: { marketId: string } },
) {
  try {
    const { marketId } = params

    const roundData = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`,
      abi: riskonAbi,
      functionName: 'getCurrentRoundInfo',
      args: [BigInt(marketId)],
    })

    const [id, startTime, endTime, priceTarget, totalYes, totalNo, resolved] =
      roundData

    return NextResponse.json({
      success: true,
      currentRoundId: Number(id),
      startTime: Number(startTime),
      endTime: Number(endTime),
      priceTarget: priceTarget.toString(),
      totalYes: totalYes.toString(),
      totalNo: totalNo.toString(),
      resolved,
    })
  } catch (error) {
    console.error('Error fetching market rounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market rounds' },
      { status: 500 },
    )
  }
}
