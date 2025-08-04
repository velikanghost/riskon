import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatUnits } from 'viem'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'

// Contract configuration
const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

/**
 * GET /api/markets
 * Get all available markets from the smart contract
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCurrentRounds = searchParams.get('includeRounds') === 'true'

    if (!RISKON_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract address not configured' },
        { status: 500 },
      )
    }

    // Fetch markets from smart contract
    const marketsData = (await publicClient.readContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'getMarkets',
    })) as [bigint[], string[], string[], boolean[]]

    const [marketIds, symbols, names, isActiveList] = marketsData

    // Transform the data into a more usable format
    const markets = marketIds.map((id, index) => ({
      id: Number(id),
      symbol: symbols[index],
      name: names[index],
      isActive: isActiveList[index],
      currentRound: null, // Will be populated if includeCurrentRounds is true
    }))

    // Optionally fetch current round data for each market
    if (includeCurrentRounds) {
      const roundPromises = markets.map(async (market) => {
        try {
          const roundData = (await publicClient.readContract({
            address: RISKON_ADDRESS,
            abi: riskonAbi,
            functionName: 'getCurrentRoundInfo',
            args: [BigInt(market.id)],
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

          return {
            ...market,
            currentRound: {
              id: Number(id),
              startTime: Number(startTime),
              endTime: Number(endTime),
              priceTarget: formatUnits(priceTarget, 8), // Assuming 8 decimals for USD price
              totalYes: formatUnits(totalYes, 18), // ETH has 18 decimals
              totalNo: formatUnits(totalNo, 18),
              resolved,
              isActive: !resolved && Date.now() / 1000 < Number(endTime),
              timeRemaining: Math.max(
                0,
                Number(endTime) - Math.floor(Date.now() / 1000),
              ),
            },
          }
        } catch (error) {
          console.warn(
            `Failed to fetch round data for market ${market.id}:`,
            error,
          )
          return {
            ...market,
            currentRound: null,
          }
        }
      })

      const marketsWithRounds = await Promise.all(roundPromises)

      return NextResponse.json({
        success: true,
        timestamp: Math.floor(Date.now() / 1000),
        markets: marketsWithRounds,
        totalMarkets: markets.length,
        activeMarkets: markets.filter((m) => m.isActive).length,
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: Math.floor(Date.now() / 1000),
      markets,
      totalMarkets: markets.length,
      activeMarkets: markets.filter((m) => m.isActive).length,
    })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch markets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/markets/[marketId]
 * Get specific market details with current round information
 */
export async function GET_MARKET_BY_ID(marketId: number) {
  try {
    if (!RISKON_ADDRESS) {
      throw new Error('Contract address not configured')
    }

    // Get all markets first to find the specific one
    const marketsData = (await publicClient.readContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'getMarkets',
    })) as [bigint[], string[], string[], boolean[]]

    const [marketIds, symbols, names, isActiveList] = marketsData
    const marketIndex = marketIds.findIndex((id) => Number(id) === marketId)

    if (marketIndex === -1) {
      throw new Error('Market not found')
    }

    const market = {
      id: marketId,
      symbol: symbols[marketIndex],
      name: names[marketIndex],
      isActive: isActiveList[marketIndex],
    }

    // Get current round data
    const roundData = (await publicClient.readContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'getCurrentRoundInfo',
      args: [BigInt(marketId)],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean]

    const [id, startTime, endTime, priceTarget, totalYes, totalNo, resolved] =
      roundData

    const currentRound = {
      id: Number(id),
      startTime: Number(startTime),
      endTime: Number(endTime),
      priceTarget: formatUnits(priceTarget, 8),
      totalYes: formatUnits(totalYes, 18),
      totalNo: formatUnits(totalNo, 18),
      resolved,
      isActive: !resolved && Date.now() / 1000 < Number(endTime),
      timeRemaining: Math.max(
        0,
        Number(endTime) - Math.floor(Date.now() / 1000),
      ),
    }

    return {
      success: true,
      timestamp: Math.floor(Date.now() / 1000),
      market: {
        ...market,
        currentRound,
      },
    }
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error)
    throw error
  }
}
