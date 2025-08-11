import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'
import {
  PYTH_FEEDS,
  HERMES_API_BASE,
  formatPythPrice,
  MARKET_USD_INCREMENTS,
} from '@/lib/pythConfig'
import { broadcast } from '@/lib/realtime'

// Contract configuration
const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`

// Create clients
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
 * Calculate price target with fixed USD increment/decrement
 */
async function calculatePriceTarget(
  symbol: string,
  usdIncrement: number,
): Promise<number> {
  try {
    const feedId = PYTH_FEEDS[symbol as keyof typeof PYTH_FEEDS]
    if (!feedId) {
      throw new Error(`No Pyth feed ID for symbol: ${symbol}`)
    }

    const url = `${HERMES_API_BASE}/v2/updates/price/latest?ids[]=${feedId}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const priceData = data.parsed[0]

    if (!priceData || !priceData.price) {
      throw new Error('Invalid response format or no price data')
    }

    const currentPrice = formatPythPrice(priceData)

    // Randomly choose direction: 50% above, 50% below
    const isAbove = Math.random() >= 0.5

    // Calculate target price with fixed USD increment/decrement
    const targetPrice = isAbove
      ? currentPrice + usdIncrement
      : currentPrice - usdIncrement

    return Math.round(targetPrice * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    throw error
  }
}

/**
 * POST /api/admin/rounds/start
 * Start a new round for a market
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, priceTarget, symbol } = body

    // If symbol is provided, calculate price target automatically
    if (symbol && !priceTarget) {
      const usdIncrement =
        MARKET_USD_INCREMENTS[symbol as keyof typeof MARKET_USD_INCREMENTS]

      if (!usdIncrement) {
        return NextResponse.json(
          { error: `No USD increment configuration for symbol: ${symbol}` },
          { status: 400 },
        )
      }

      const calculatedTarget = await calculatePriceTarget(symbol, usdIncrement)

      // Convert price target to proper format (8 decimals for USD)
      const priceTargetWei = parseUnits(calculatedTarget.toString(), 8)

      const walletClient = createAdminClient()

      // Start new round directly on contract
      const hash = await walletClient.writeContract({
        address: RISKON_ADDRESS,
        abi: riskonAbi,
        functionName: 'startNewRound',
        args: [BigInt(marketId), priceTargetWei],
      })

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Broadcast
      await broadcast({
        type: 'round:start',
        marketId: Number(marketId),
        priceTarget: calculatedTarget,
        tx: hash,
      })

      return NextResponse.json({
        success: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        marketId: Number(marketId),
        priceTarget: calculatedTarget.toString(),
        timestamp: new Date().toISOString(),
      })
    }

    // If explicit price target is provided
    if (!marketId || !priceTarget) {
      return NextResponse.json(
        { error: 'marketId and either priceTarget or symbol are required' },
        { status: 400 },
      )
    }

    // Convert price target to proper format (8 decimals for USD)
    const priceTargetWei = parseUnits(priceTarget.toString(), 8)

    const walletClient = createAdminClient()

    // Start new round directly on contract
    const hash = await walletClient.writeContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'startNewRound',
      args: [BigInt(marketId), priceTargetWei],
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    await broadcast({
      type: 'round:start',
      marketId: Number(marketId),
      priceTarget: Number(priceTarget),
      tx: hash,
    })

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      marketId: Number(marketId),
      priceTarget: priceTarget.toString(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error starting round:', error)
    return NextResponse.json(
      {
        error: 'Failed to start round',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
