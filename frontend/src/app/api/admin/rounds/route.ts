import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'
import { PYTH_FEEDS, HERMES_API_BASE, formatPythPrice } from '@/lib/pythConfig'

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
 * Calculate price target with percentage increase
 */
async function calculatePriceTarget(
  symbol: string,
  increasePercentage: number,
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
    // Calculate target price with percentage increase
    const targetPrice = currentPrice * (1 + increasePercentage / 100)

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

    if (!RISKON_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract address not configured' },
        { status: 500 },
      )
    }

    if (!ADMIN_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Admin private key not configured' },
        { status: 500 },
      )
    }

    let finalPriceTarget: number

    // If symbol is provided, calculate price target automatically
    if (symbol && !priceTarget) {
      const marketConfig: Record<string, { increase: number }> = {
        'BTC/USD': { increase: 0.2 }, // 0.2% increase
        'ETH/USD': { increase: 0.3 }, // 0.3% increase
        'SOL/USD': { increase: 0.4 }, // 0.4% increase
      }

      const config = marketConfig[symbol]
      if (!config) {
        return NextResponse.json(
          { error: `No configuration for symbol: ${symbol}` },
          { status: 400 },
        )
      }

      finalPriceTarget = await calculatePriceTarget(symbol, config.increase)
    } else if (priceTarget) {
      finalPriceTarget = priceTarget
    } else {
      return NextResponse.json(
        { error: 'marketId and either priceTarget or symbol are required' },
        { status: 400 },
      )
    }

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 },
      )
    }

    // Convert price target to proper format (8 decimals for USD)
    const priceTargetWei = parseUnits(finalPriceTarget.toString(), 8)

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

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      marketId: Number(marketId),
      priceTarget: finalPriceTarget.toString(),
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
