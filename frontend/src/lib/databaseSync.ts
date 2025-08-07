import { prisma } from '@/lib/prisma'
import { createPublicClient, http, formatUnits } from 'viem'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'

const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

/**
 * Sync markets from blockchain to database
 */
export async function syncMarkets() {
  try {
    const marketsData = (await publicClient.readContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'getMarkets',
    })) as [bigint[], string[], string[], boolean[]]

    const [marketIds, symbols, names, isActiveList] = marketsData

    for (let i = 0; i < marketIds.length; i++) {
      const marketId = Number(marketIds[i])
      const symbol = symbols[i]
      const name = names[i]
      const isActive = isActiveList[i]

      await prisma.market.upsert({
        where: { marketId },
        update: {
          symbol,
          name,
          isActive,
        },
        create: {
          marketId,
          symbol,
          name,
          isActive,
        },
      })
    }

    console.log(`Synced ${marketIds.length} markets`)
  } catch (error) {
    console.error('Error syncing markets:', error)
  }
}

/**
 * Sync current round data to database
 */
export async function syncCurrentRound(marketId: number) {
  try {
    const roundData = (await publicClient.readContract({
      address: RISKON_ADDRESS,
      abi: riskonAbi,
      functionName: 'getCurrentRoundInfo',
      args: [BigInt(marketId)],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean]

    const [id, startTime, endTime, priceTarget, totalYes, totalNo, resolved] =
      roundData

    await prisma.round.upsert({
      where: {
        marketId_roundId: {
          marketId,
          roundId: Number(id),
        },
      },
      update: {
        startTime,
        endTime,
        priceTarget: priceTarget.toString(),
        totalYes: totalYes.toString(),
        totalNo: totalNo.toString(),
        resolved,
      },
      create: {
        marketId,
        roundId: Number(id),
        startTime,
        endTime,
        priceTarget: priceTarget.toString(),
        totalYes: totalYes.toString(),
        totalNo: totalNo.toString(),
        resolved,
      },
    })

    console.log(`Synced round ${id} for market ${marketId}`)
  } catch (error) {
    console.error(`Error syncing round for market ${marketId}:`, error)
  }
}

/**
 * Update round with final price when resolved
 */
export async function updateRoundResolution(
  marketId: number,
  roundId: number,
  finalPrice: bigint,
) {
  try {
    const target = await prisma.round.findUnique({
      where: {
        marketId_roundId: {
          marketId,
          roundId,
        },
      },
    })

    if (!target) {
      console.warn(
        `Round ${roundId} for market ${marketId} not found in database`,
      )
      return
    }

    const targetPrice = BigInt(target.priceTarget)
    const outcome = finalPrice > targetPrice

    await prisma.round.update({
      where: {
        marketId_roundId: {
          marketId,
          roundId,
        },
      },
      data: {
        finalPrice: finalPrice.toString(),
        outcome,
        resolved: true,
      },
    })

    console.log(`Updated round ${roundId} resolution for market ${marketId}`)
  } catch (error) {
    console.error(
      `Error updating round resolution for market ${marketId}, round ${roundId}:`,
      error,
    )
  }
}

/**
 * Sync user bet to database
 */
export async function syncUserBet(
  marketId: number,
  roundId: number,
  userAddress: string,
  amount: bigint,
  prediction: boolean,
) {
  try {
    await prisma.userBet.upsert({
      where: {
        marketId_roundId_userAddress: {
          marketId,
          roundId,
          userAddress,
        },
      },
      update: {
        amount: amount.toString(),
        prediction,
      },
      create: {
        marketId,
        roundId,
        userAddress,
        amount: amount.toString(),
        prediction,
      },
    })

    console.log(`Synced bet for user ${userAddress} in round ${roundId}`)
  } catch (error) {
    console.error(`Error syncing user bet:`, error)
  }
}
