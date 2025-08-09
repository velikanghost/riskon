'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccount } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { somniaTestnet } from 'viem/chains'
import { riskonAbi } from '@/lib/contracts-generated'

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

  useEffect(() => {
    async function load() {
      try {
        // fetch markets
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
      } catch {}
    }
    load()
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

  // Markets form
  const [symbol, setSymbol] = useState('BTC/USD')
  const [name, setName] = useState('Bitcoin')
  const [minBet, setMinBet] = useState('1000000000000000')

  async function addMarket() {
    if (!isAdmin) return
    await fetch('/api/admin/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name, minBet }),
    })
  }

  const [toggleMarketId, setToggleMarketId] = useState('')
  async function toggleMarket() {
    if (!isAdmin) return
    await fetch('/api/admin/markets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: Number(toggleMarketId) }),
    })
  }

  const [deleteMarketId, setDeleteMarketId] = useState('')
  async function deleteMarket() {
    if (!isAdmin) return
    await fetch(`/api/admin/markets?marketId=${deleteMarketId}`, {
      method: 'DELETE',
    })
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
    await fetch('/api/admin/rounds/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
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
    await fetch('/api/admin/rounds/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function autoResolveAll() {
    if (!isAdmin) return
    await fetch('/api/admin/rounds/resolve/auto', { method: 'PUT' })
  }

  async function scheduler(action: string, config?: any) {
    if (!isAdmin) return
    await fetch('/api/admin/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, config }),
    })
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
          <Button onClick={addMarket} disabled={!isAdmin}>
            Add Market
          </Button>

          <div className="grid md:grid-cols-3 gap-3 pt-4">
            <div>
              <Label>Market ID</Label>
              <Input
                value={toggleMarketId}
                onChange={(e) => setToggleMarketId(e.target.value)}
              />
            </div>
            <Button onClick={toggleMarket} disabled={!isAdmin}>
              Toggle Market
            </Button>
            <div className="flex items-end">
              <Button
                variant="destructive"
                onClick={deleteMarket}
                disabled={!isAdmin}
              >
                Delete Market
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
              <Button onClick={startRound} disabled={!isAdmin}>
                Start Round
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
              <Button onClick={resolveRound} disabled={!isAdmin}>
                Resolve Round
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={autoResolveAll}
            disabled={!isAdmin}
          >
            Auto Resolve All
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => scheduler('start')} disabled={!isAdmin}>
              Start
            </Button>
            <Button
              variant="outline"
              onClick={() => scheduler('stop')}
              disabled={!isAdmin}
            >
              Stop
            </Button>
            <Button
              variant="outline"
              onClick={() => scheduler('restart')}
              disabled={!isAdmin}
            >
              Restart
            </Button>
            <Button
              variant="outline"
              onClick={() => scheduler('manual-resolve')}
              disabled={!isAdmin}
            >
              Manual Resolve
            </Button>
            <Button
              variant="outline"
              onClick={() => scheduler('manual-new-rounds')}
              disabled={!isAdmin}
            >
              Manual New Rounds
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
