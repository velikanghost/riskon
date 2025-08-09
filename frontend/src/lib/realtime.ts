const encoder = new TextEncoder()

// Global singleton store for SSE clients
const globalForRealtime = globalThis as unknown as {
  __riskon_sse_clients?: Set<WritableStreamDefaultWriter>
}

if (!globalForRealtime.__riskon_sse_clients) {
  globalForRealtime.__riskon_sse_clients = new Set()
}

const clients = globalForRealtime.__riskon_sse_clients

export function addClient(writer: WritableStreamDefaultWriter) {
  clients.add(writer)
}

export function removeClient(writer: WritableStreamDefaultWriter) {
  try {
    clients.delete(writer)
    writer.close()
  } catch {}
}

export async function broadcast(event: unknown) {
  const payload = `data: ${JSON.stringify(event)}\n\n`
  const bytes = encoder.encode(payload)
  for (const writer of clients) {
    try {
      await writer.write(bytes)
    } catch {
      // drop broken writer
      clients.delete(writer)
    }
  }
}
