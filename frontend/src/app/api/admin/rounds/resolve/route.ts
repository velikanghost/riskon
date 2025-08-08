import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'
import { PYTH_FEEDS, HERMES_API_BASE, formatPythPrice } from '@/lib/pythConfig'

// Contract configuration
const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL
const RESOLVER_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`

// Create clients
const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

const createResolverClient = () => {
  if (!RESOLVER_PRIVATE_KEY) {
    throw new Error('Resolver private key not configured')
  }

  const account = privateKeyToAccount(RESOLVER_PRIVATE_KEY)
  return createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(RPC_URL),
  })
}

// Market symbol mapping (marketId to symbol)
const MARKET_SYMBOLS: Record<number, string> = {
  1: 'BTC/USD',
  2: 'ETH/USD',
  3: 'SOL/USD',
}

/**
 * Fetch current price for a market symbol from Pyth Network
 */
async function fetchCurrentPrice(symbol: string): Promise<number> {
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

  return formatPythPrice(priceData)
}

/**
 * POST /api/admin/rounds/resolve
 * Resolve a round using current market price from Pyth Network
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, roundId, finalPrice } = body

    if (!marketId || !roundId) {
      return NextResponse.json(
        { error: 'marketId and roundId are required' },
        { status: 400 },
      )
    }

    if (!RESOLVER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Resolver key not configured' },
        { status: 500 },
      )
    }

    let resolvedPrice: number

    // If finalPrice is provided, use it; otherwise fetch from API
    if (finalPrice !== undefined) {
      resolvedPrice = finalPrice
    } else {
      const symbol = MARKET_SYMBOLS[marketId]
      if (!symbol) {
        return NextResponse.json(
          { error: `Unknown market ID: ${marketId}` },
          { status: 400 },
        )
      }

      console.log(`Fetching current price for ${symbol}...`)
      resolvedPrice = await fetchCurrentPrice(symbol)
      console.log(`Current price for ${symbol}: ${resolvedPrice}`)
    }

    // Convert price to proper format (8 decimals for USD)
    const priceWei = parseUnits(resolvedPrice.toString(), 8)

    const walletClient = createResolverClient()

    // Resolve the round with the fetched price
    console.log(
      `Resolving round ${roundId} for market ${marketId} with price ${resolvedPrice}`,
    )

    const hash = await walletClient.writeContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'resolveRoundWithPrice',
      args: [BigInt(marketId), BigInt(roundId), priceWei],
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    console.log(`Round resolved successfully. Transaction: ${hash}`)

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      marketId: Number(marketId),
      roundId: Number(roundId),
      finalPrice: resolvedPrice,
      resolvedAt: Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    console.error('Error resolving round:', error)
    return NextResponse.json(
      {
        error: 'Failed to resolve round',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/admin/rounds/resolve/auto
 * Auto-resolve all pending rounds
 */
export async function PUT(request: NextRequest) {
  try {
    if (!RESOLVER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Resolver key not configured' },
        { status: 500 },
      )
    }

    const results = []
    const errors = []

    // Check all markets for rounds that need resolution
    for (const [marketId, symbol] of Object.entries(MARKET_SYMBOLS)) {
      try {
        console.log(
          `Checking market ${marketId} (${symbol}) for pending rounds...`,
        )

        // Get current round info
        const roundData = (await publicClient.readContract({
          address: RISKON_ADDRESS,
          abi: riskonAbi,
          functionName: 'getCurrentRoundInfo',
          args: [BigInt(marketId)],
        })) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean]

        const [
          id,
          startTime,
          endTime,
          priceTarget,
          totalYes,
          totalNo,
          resolved,
        ] = roundData

        // Check if round has ended and is not resolved
        const now = Math.floor(Date.now() / 1000)
        if (!resolved && now >= Number(endTime)) {
          console.log(`Round ${id} in market ${marketId} needs resolution`)

          // Fetch current price from Pyth
          const currentPrice = await fetchCurrentPrice(symbol)
          const priceWei = parseUnits(currentPrice.toString(), 8)

          const walletClient = createResolverClient()

          // Resolve the round
          const hash = await walletClient.writeContract({
            address: RISKON_ADDRESS,
            abi: riskonAbi,
            functionName: 'resolveRoundWithPrice',
            args: [BigInt(marketId), id, priceWei],
          })

          const receipt = await publicClient.waitForTransactionReceipt({ hash })

          results.push({
            marketId: Number(marketId),
            symbol,
            roundId: Number(id),
            finalPrice: currentPrice,
            transactionHash: hash,
            blockNumber: receipt.blockNumber.toString(),
          })

          console.log(
            `Successfully resolved round ${id} for market ${marketId}`,
          )
        } else if (resolved) {
          console.log(`Round ${id} in market ${marketId} already resolved`)
        } else {
          console.log(`Round ${id} in market ${marketId} still active`)
        }
      } catch (error) {
        console.error(`Error processing market ${marketId}:`, error)
        errors.push({
          marketId: Number(marketId),
          symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      resolvedRounds: results,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: Object.keys(MARKET_SYMBOLS).length,
      totalResolved: results.length,
      timestamp: Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    console.error('Error in auto-resolve:', error)
    return NextResponse.json(
      {
        error: 'Failed to auto-resolve rounds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
