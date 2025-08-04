import { NextRequest, NextResponse } from 'next/server'
import { autoResolveAllRounds } from '@/lib/priceKeeper'

/**
 * GET /api/cron/resolve-rounds
 * Cron endpoint for automated round resolution
 * This should be called periodically (e.g., every minute) by a cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron job triggered: Checking for rounds to resolve...')

    // Run the auto-resolve process
    const result = await autoResolveAllRounds()

    // Log results
    if (result.resolvedRounds.length > 0) {
      console.log(
        `✅ Successfully resolved ${result.resolvedRounds.length} rounds`,
      )
      result.resolvedRounds.forEach((round) => {
        console.log(
          `   - Market ${round.marketId} (${round.symbol}): Round ${round.roundId} → $${round.finalPrice}`,
        )
      })
    } else {
      console.log('ℹ️  No rounds needed resolution')
    }

    if (result.errors && result.errors.length > 0) {
      console.warn(`⚠️  ${result.errors.length} errors occurred:`)
      result.errors.forEach((error) => {
        console.warn(
          `   - Market ${error.marketId} (${error.symbol}): ${error.error}`,
        )
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalResolved: result.resolvedRounds.length,
        totalErrors: result.errors?.length || 0,
        resolvedRounds: result.resolvedRounds,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/cron/resolve-rounds
 * Manual trigger for round resolution (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Manual round resolution triggered...')

    const result = await autoResolveAllRounds()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      manual: true,
      summary: {
        totalResolved: result.resolvedRounds.length,
        totalErrors: result.errors?.length || 0,
        resolvedRounds: result.resolvedRounds,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Manual resolution error:', error)
    return NextResponse.json(
      {
        error: 'Manual resolution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
