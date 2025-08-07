import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatUnits } from 'viem'

export interface MarketRound {
  id: number
  marketId: number
  startTime: number
  endTime: number
  priceTarget: string
  finalPrice: string
  totalYes: string
  totalNo: string
  outcome: boolean
  resolved: boolean
  symbol: string
}

/**
 * GET /api/history
 * Get historical round data for a specific market
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 },
      )
    }

    // Get resolved rounds from database
    const rounds = await prisma.round.findMany({
      where: {
        marketId: parseInt(marketId),
        resolved: true,
      },
      include: {
        market: true,
      },
      orderBy: {
        roundId: 'desc',
      },
      take: limit,
    })

    // Transform data for frontend
    const roundHistory: MarketRound[] = rounds.map((round: any) => {
      const target = parseFloat(formatUnits(BigInt(round.priceTarget), 8))
      const final = round.finalPrice
        ? parseFloat(formatUnits(BigInt(round.finalPrice), 8))
        : 0

      return {
        id: round.roundId,
        marketId: round.marketId,
        startTime: Number(round.startTime),
        endTime: Number(round.endTime),
        priceTarget: target.toFixed(2),
        finalPrice: final.toFixed(2),
        totalYes: formatUnits(BigInt(round.totalYes), 18),
        totalNo: formatUnits(BigInt(round.totalNo), 18),
        outcome: round.outcome || false,
        resolved: round.resolved,
        symbol: round.market.symbol,
      }
    })

    return NextResponse.json({
      success: true,
      marketId: parseInt(marketId),
      symbol: rounds[0]?.market.symbol || 'Unknown',
      rounds: roundHistory,
      totalRounds: roundHistory.length,
      timestamp: Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    console.error('Error fetching market history:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch market history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
