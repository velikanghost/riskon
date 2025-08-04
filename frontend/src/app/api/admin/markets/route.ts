import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'

const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

const createAdminClient = () => {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('Admin private key not configured')
  }
  const account = privateKeyToAccount(ADMIN_PRIVATE_KEY)
  return createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(RPC_URL),
  })
}

/**
 * POST /api/admin/markets
 * Add a new market
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, name, minBet } = body

    if (!symbol || !name || !minBet) {
      return NextResponse.json(
        { error: 'symbol, name, and minBet are required' },
        { status: 400 },
      )
    }

    const walletClient = createAdminClient()
    const hash = await walletClient.writeContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'addMarket',
      args: [symbol, name, BigInt(minBet)],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      market: { symbol, name, minBet },
    })
  } catch (error) {
    console.error('Error adding market:', error)
    return NextResponse.json(
      {
        error: 'Failed to add market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/admin/markets/[marketId]
 * Toggle market active status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId } = body

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 },
      )
    }

    const walletClient = createAdminClient()
    const hash = await walletClient.writeContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'toggleMarket',
      args: [BigInt(marketId)],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      marketId: Number(marketId),
    })
  } catch (error) {
    console.error('Error toggling market:', error)
    return NextResponse.json(
      {
        error: 'Failed to toggle market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/markets/[marketId]
 * Delete a market
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 },
      )
    }

    const walletClient = createAdminClient()
    const hash = await walletClient.writeContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'deleteMarket',
      args: [BigInt(marketId)],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      marketId: Number(marketId),
    })
  } catch (error) {
    console.error('Error deleting market:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete market',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
