import { NextRequest } from 'next/server'
import { addClient, removeClient } from '@/lib/realtime'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const encoder = new TextEncoder()
  // Initial headers for SSE
  await writer.write(
    encoder.encode(`: connected\n` + `event: ping\n` + `data: connected\n\n`),
  )

  addClient(writer)

  // Keep-alive pings
  const interval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`event: ping\n` + `data: \"\"\n\n`))
    } catch {
      clearInterval(interval)
      removeClient(writer)
    }
  }, 15000)

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  return new Response(stream.readable, { headers })
}
