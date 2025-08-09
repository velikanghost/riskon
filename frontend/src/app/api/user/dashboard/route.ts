import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'

const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address') as `0x${string}` | null
    const limit = Math.max(
      1,
      Math.min(200, Number(searchParams.get('limit') || '50')),
    )
    const marketsParam = searchParams.get('markets') // comma separated ids

    if (!RISKON_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract address not configured' },
        { status: 500 },
      )
    }
    if (!address) {
      return NextResponse.json(
        { error: 'address is required' },
        { status: 400 },
      )
    }

    // Get markets
    const marketsData = (await publicClient.readContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'getMarkets',
    })) as [bigint[], string[], string[], boolean[]]

    let marketIds = marketsData[0].map(Number)
    if (marketsParam) {
      const filter = new Set(
        marketsParam.split(',').map((s) => Number(s.trim())),
      )
      marketIds = marketIds.filter((id) => filter.has(id))
    }

    // For each market get current round id
    const currentRoundIds: Record<number, number> = {}
    for (const mId of marketIds) {
      const [roundId] = (await publicClient.readContract({
        address: RISKON_ADDRESS,
        abi: riskonAbi,
        functionName: 'getCurrentRoundInfo',
        args: [BigInt(mId)],
      })) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean]
      currentRoundIds[mId] = Number(roundId)
    }

    type Bet = {
      marketId: number
      roundId: number
      amount: bigint
      prediction: boolean
      claimed: boolean
    }
    type Outcome = {
      marketId: number
      roundId: number
      resolved: boolean
      outcome: boolean
      finalPrice: bigint
    }
    type Winnings = { marketId: number; roundId: number; amount: bigint }

    const betCalls: any[] = []
    const outcomeCalls: any[] = []
    const winningsCalls: any[] = []

    for (const mId of marketIds) {
      const last = currentRoundIds[mId]
      const start = Math.max(1, last - limit + 1)
      for (let r = start; r <= last; r++) {
        betCalls.push({
          address: RISKON_ADDRESS,
          abi: riskonAbi,
          functionName: 'getUserBet',
          args: [BigInt(mId), BigInt(r), address],
        })
        outcomeCalls.push({
          address: RISKON_ADDRESS,
          abi: riskonAbi,
          functionName: 'getRoundOutcome',
          args: [BigInt(mId), BigInt(r)],
        })
        winningsCalls.push({
          address: RISKON_ADDRESS,
          abi: riskonAbi,
          functionName: 'calculateWinnings',
          args: [BigInt(mId), BigInt(r), address],
        })
      }
    }

    // Execute in chunks to avoid oversized multicalls
    const MAX_PER_CALL = 300

    const betResults: any[] = []
    for (const group of chunk(betCalls, MAX_PER_CALL)) {
      const res = await publicClient.multicall({ contracts: group })
      betResults.push(...res)
    }

    const outcomeResults: any[] = []
    for (const group of chunk(outcomeCalls, MAX_PER_CALL)) {
      const res = await publicClient.multicall({ contracts: group })
      outcomeResults.push(...res)
    }

    const winningsResults: any[] = []
    for (const group of chunk(winningsCalls, MAX_PER_CALL)) {
      const res = await publicClient.multicall({ contracts: group })
      winningsResults.push(...res)
    }

    // Reassemble by market/round
    const userBets: Array<{
      marketId: number
      roundId: number
      amount: string
      prediction: boolean
      claimed: boolean
      resolved: boolean
      outcome?: boolean
      winnings?: string
    }> = []

    let idx = 0
    let totalWagered = 0n
    let totalWinnings = 0n
    let wins = 0
    let losses = 0
    let currentStreak = 0
    let bestStreak = 0

    for (const mId of marketIds) {
      const last = currentRoundIds[mId]
      const start = Math.max(1, last - limit + 1)
      for (let r = start; r <= last; r++) {
        const betRes = betResults[idx]
        const outcomeRes = outcomeResults[idx]
        const winningsRes = winningsResults[idx]
        idx++

        if (!betRes.result) continue
        const [amount, prediction, claimed] = betRes.result as [
          bigint,
          boolean,
          boolean,
        ]
        if (amount === 0n) continue

        const [resolved, outcome] = (outcomeRes.result || [false, false]) as [
          boolean,
          boolean,
        ]
        const winningsAmount = (winningsRes.result || 0n) as bigint

        userBets.push({
          marketId: mId,
          roundId: r,
          amount: amount.toString(),
          prediction,
          claimed,
          resolved,
          outcome: resolved ? outcome : undefined,
          winnings: winningsAmount ? winningsAmount.toString() : undefined,
        })

        totalWagered += amount
        if (resolved) {
          if (winningsAmount > 0n) {
            totalWinnings += winningsAmount
            wins++
            currentStreak++
            bestStreak = Math.max(bestStreak, currentStreak)
          } else {
            losses++
            currentStreak = 0
          }
        }
      }
    }

    const totalBets = wins + losses
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0
    const averageBet =
      totalBets > 0 ? (totalWagered / BigInt(totalBets)).toString() : '0'
    const netProfit = (totalWinnings - 0n).toString()

    return NextResponse.json({
      success: true,
      stats: {
        totalBets,
        totalWinnings: totalWinnings.toString(),
        totalLosses: '0',
        winRate,
        winStreak: currentStreak,
        bestStreak,
        averageBet,
        totalWagered: totalWagered.toString(),
        netProfit,
      },
      userBets,
      meta: { marketIds, limit },
    })
  } catch (error) {
    console.error('Error building user dashboard:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch user dashboard',
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
