'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccount } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'
import { toast } from 'sonner'

const RISKON_ADDRESS = process.env.NEXT_PUBLIC_RISKON_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
})

export function AdminPanel() {
  const { address } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)

  // Markets from contract
  const [markets, setMarkets] = useState<
    Array<{ id: number; symbol: string; name: string; isActive: boolean }>
  >([])

  async function refreshMarkets() {
    try {
      const marketsData = (await publicClient.readContract({
        address: RISKON_ADDRESS,
        abi: riskonAbi,
        functionName: 'getMarkets',
      })) as [bigint[], string[], string[], boolean[]]
      const [ids, symbols, names, active] = marketsData
      setMarkets(
        ids.map((id, i) => ({
          id: Number(id),
          symbol: symbols[i],
          name: names[i],
          isActive: active[i],
        })),
      )
    } catch (e) {
      console.error('Failed to load markets', e)
    }
  }

  useEffect(() => {
    refreshMarkets()
  }, [])

  useEffect(() => {
    async function checkRole() {
      if (!address) return setIsAdmin(false)
      try {
        const adminRole = (await publicClient.readContract({
          address: RISKON_ADDRESS,
          abi: riskonAbi,
          functionName: 'DEFAULT_ADMIN_ROLE',
        })) as `0x${string}`
        const has = (await publicClient.readContract({
          address: RISKON_ADDRESS,
          abi: riskonAbi,
          functionName: 'hasRole',
          args: [adminRole, address],
        })) as boolean
        setIsAdmin(has)
      } catch {
        setIsAdmin(false)
      }
    }
    checkRole()
  }, [address])

  // Busy flags
  const [isBusy, setIsBusy] = useState<string | null>(null)
  const wrap = async (key: string, fn: () => Promise<void>) => {
    try {
      setIsBusy(key)
      await fn()
    } finally {
      setIsBusy(null)
    }
  }

  // Markets form
  const [symbol, setSymbol] = useState('BTC/USD')
  const [name, setName] = useState('Bitcoin')
  const [minBet, setMinBet] = useState('1000000000000000')

  async function addMarket() {
    if (!isAdmin) return
    const res = await fetch('/api/admin/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name, minBet }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(`Add market failed`, {
        description: data.message || res.statusText,
      })
      return
    }
    toast.success('Market added')
    refreshMarkets()
  }

  const [toggleMarketId, setToggleMarketId] = useState('')
  async function toggleMarket() {
    if (!isAdmin) return
    const res = await fetch('/api/admin/markets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: Number(toggleMarketId) }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(`Toggle market failed`, {
        description: data.message || res.statusText,
      })
      return
    }
    toast.success('Market toggled')
    refreshMarkets()
  }

  const [deleteMarketId, setDeleteMarketId] = useState('')
  async function deleteMarket() {
    if (!isAdmin) return
    const res = await fetch(`/api/admin/markets?marketId=${deleteMarketId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(`Delete market failed`, {
        description: data.message || res.statusText,
      })
      return
    }
    toast.success('Market deleted')
    refreshMarkets()
  }

  // Rounds
  const [roundMarketId, setRoundMarketId] = useState('')
  const [roundSymbol, setRoundSymbol] = useState('BTC/USD')
  const [priceTarget, setPriceTarget] = useState('')

  async function startRound() {
    if (!isAdmin) return
    const body: any = { marketId: Number(roundMarketId) }
    if (priceTarget) body.priceTarget = Number(priceTarget)
    else body.symbol = roundSymbol
    const res = await fetch('/api/admin/rounds/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error('Start round failed', {
        description: data.message || res.statusText,
      })
      return
    }
    toast.success('Round started')
  }

  const [resolveRoundId, setResolveRoundId] = useState('')
  const [resolvePrice, setResolvePrice] = useState('')
  async function resolveRound() {
    if (!isAdmin) return
    const body: any = {
      marketId: Number(roundMarketId),
      roundId: Number(resolveRoundId),
    }
    if (resolvePrice) body.finalPrice = Number(resolvePrice)
    const res = await fetch('/api/admin/rounds/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error('Resolve round failed', {
        description: data.message || res.statusText,
      })
      return
    }
    toast.success('Round resolved')
  }

  async function autoResolveAll() {
    if (!isAdmin) return
    const res = await fetch('/api/admin/rounds/resolve/auto', { method: 'PUT' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error('Auto resolve failed', {
        description: data.message || res.statusText,
      })
      return
    }
    toast.success('Auto resolve triggered')
  }

  async function scheduler(action: string, config?: any) {
    if (!isAdmin) return
    const res = await fetch('/api/admin/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, config }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error('Scheduler action failed', {
        description: data.message || res.statusText,
      })
      return
    }
    const actionTitle = action.replace(/-/g, ' ')
    toast.success(`Scheduler ${actionTitle}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Markets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {markets.length > 0 && (
            <div className="grid md:grid-cols-3 gap-3">
              {markets.map((m) => (
                <div key={m.id} className="text-sm p-3 border rounded">
                  <div className="font-medium">{m.symbol}</div>
                  <div className="text-muted-foreground">{m.name}</div>
                  <div className="text-xs mt-1">
                    ID: {m.id} • {m.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3 pt-2">
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Min Bet (wei)</Label>
              <Input
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => wrap('addMarket', addMarket)}
            disabled={!isAdmin || isBusy === 'addMarket'}
          >
            {isBusy === 'addMarket' ? 'Adding…' : 'Add Market'}
          </Button>

          <div className="grid md:grid-cols-3 gap-3 pt-4">
            <div>
              <Label>Market ID</Label>
              <Input
                value={toggleMarketId}
                onChange={(e) => setToggleMarketId(e.target.value)}
              />
            </div>
            <Button
              onClick={() => wrap('toggleMarket', toggleMarket)}
              disabled={!isAdmin || isBusy === 'toggleMarket'}
            >
              {isBusy === 'toggleMarket' ? 'Toggling…' : 'Toggle Market'}
            </Button>
            <div className="flex items-end">
              <Button
                variant="destructive"
                onClick={() => wrap('deleteMarket', deleteMarket)}
                disabled={!isAdmin || isBusy === 'deleteMarket'}
              >
                {isBusy === 'deleteMarket' ? 'Deleting…' : 'Delete Market'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Market ID</Label>
              <Input
                value={roundMarketId}
                onChange={(e) => setRoundMarketId(e.target.value)}
              />
            </div>
            <div>
              <Label>Symbol (auto target) OR Price Target</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={roundSymbol}
                  onChange={(e) => setRoundSymbol(e.target.value)}
                  placeholder="BTC/USD"
                />
                <Input
                  value={priceTarget}
                  onChange={(e) => setPriceTarget(e.target.value)}
                  placeholder="3902.15"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => wrap('startRound', startRound)}
                disabled={!isAdmin || isBusy === 'startRound'}
              >
                {isBusy === 'startRound' ? 'Starting…' : 'Start Round'}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Round ID</Label>
              <Input
                value={resolveRoundId}
                onChange={(e) => setResolveRoundId(e.target.value)}
              />
            </div>
            <div>
              <Label>Final Price (optional)</Label>
              <Input
                value={resolvePrice}
                onChange={(e) => setResolvePrice(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => wrap('resolveRound', resolveRound)}
                disabled={!isAdmin || isBusy === 'resolveRound'}
              >
                {isBusy === 'resolveRound' ? 'Resolving…' : 'Resolve Round'}
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => wrap('autoResolveAll', autoResolveAll)}
            disabled={!isAdmin || isBusy === 'autoResolveAll'}
          >
            {isBusy === 'autoResolveAll' ? 'Triggering…' : 'Auto Resolve All'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => wrap('sch-start', () => scheduler('start'))}
              disabled={!isAdmin || isBusy === 'sch-start'}
            >
              {isBusy === 'sch-start' ? 'Starting…' : 'Start'}
            </Button>
            <Button
              variant="outline"
              onClick={() => wrap('sch-stop', () => scheduler('stop'))}
              disabled={!isAdmin || isBusy === 'sch-stop'}
            >
              {isBusy === 'sch-stop' ? 'Stopping…' : 'Stop'}
            </Button>
            <Button
              variant="outline"
              onClick={() => wrap('sch-restart', () => scheduler('restart'))}
              disabled={!isAdmin || isBusy === 'sch-restart'}
            >
              {isBusy === 'sch-restart' ? 'Restarting…' : 'Restart'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                wrap('sch-man-res', () => scheduler('manual-resolve'))
              }
              disabled={!isAdmin || isBusy === 'sch-man-res'}
            >
              {isBusy === 'sch-man-res' ? 'Running…' : 'Manual Resolve'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                wrap('sch-man-new', () => scheduler('manual-new-rounds'))
              }
              disabled={!isAdmin || isBusy === 'sch-man-new'}
            >
              {isBusy === 'sch-man-new' ? 'Running…' : 'Manual New Rounds'}
            </Button>
          </div>
          {!isAdmin && (
            <div className="text-sm text-muted-foreground">
              Connect as contract admin to use controls.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
