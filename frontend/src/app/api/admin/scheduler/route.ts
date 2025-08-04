import { NextRequest, NextResponse } from 'next/server'
import { defaultRoundScheduler } from '@/lib/roundScheduler'

/**
 * Admin endpoint for scheduler management
 */

/**
 * GET /api/admin/scheduler
 * Get scheduler status
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication

    const status = defaultRoundScheduler.getStatus()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scheduler: status,
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get scheduler status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/admin/scheduler
 * Control scheduler (start/stop/manual triggers)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    // TODO: Add admin authentication

    switch (action) {
      case 'start':
        defaultRoundScheduler.start()
        return NextResponse.json({
          success: true,
          message: 'Scheduler started',
          status: defaultRoundScheduler.getStatus(),
        })

      case 'stop':
        defaultRoundScheduler.stop()
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped',
          status: defaultRoundScheduler.getStatus(),
        })

      case 'restart':
        defaultRoundScheduler.stop()
        if (config) {
          defaultRoundScheduler.updateConfig(config)
        }
        defaultRoundScheduler.start()
        return NextResponse.json({
          success: true,
          message: 'Scheduler restarted',
          status: defaultRoundScheduler.getStatus(),
        })

      case 'manual-resolve':
        await defaultRoundScheduler.manualResolveCheck()
        return NextResponse.json({
          success: true,
          message: 'Manual resolve check completed',
        })

      case 'manual-new-rounds':
        await defaultRoundScheduler.manualNewRoundCheck()
        return NextResponse.json({
          success: true,
          message: 'Manual new round check completed',
        })

      case 'update-config':
        if (!config) {
          return NextResponse.json(
            { error: 'Config is required for update-config action' },
            { status: 400 },
          )
        }
        defaultRoundScheduler.updateConfig(config)
        return NextResponse.json({
          success: true,
          message: 'Config updated',
          status: defaultRoundScheduler.getStatus(),
        })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: start, stop, restart, manual-resolve, manual-new-rounds, update-config',
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error)
    return NextResponse.json(
      {
        error: 'Failed to control scheduler',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
