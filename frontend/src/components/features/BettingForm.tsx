'use client'

import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useMultiMarketPrediction } from '@/hooks/useMultiMarketPrediction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'

interface BettingFormProps {
  marketId: bigint
  roundId?: number
  isRoundActive: boolean
  className?: string
}

export function BettingForm({
  marketId,
  isRoundActive,
  className,
}: BettingFormProps) {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { placeBet, isPending } = useMultiMarketPrediction()

  const [betAmount, setBetAmount] = useState('')
  const [selectedPrediction, setSelectedPrediction] = useState<boolean | null>(
    null,
  )

  const handleBetAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value)
    }
  }

  const handleQuickAmount = (percentage: number) => {
    if (!balance) return
    const amount = (
      (parseFloat(formatEther(balance.value)) * percentage) /
      100
    ).toFixed(4)
    setBetAmount(amount)
  }

  const handlePlaceBet = async () => {
    console.log('handlePlaceBet', isConnected, selectedPrediction, betAmount)
    if (!isConnected || !betAmount) {
      toast.error('Please connect wallet, select prediction, and enter amount')
      return
    }

    if (!isRoundActive) {
      toast.error('Round has ended, cannot place bet')
      return
    }

    try {
      const amount = parseEther(betAmount)
      await placeBet(marketId, selectedPrediction!, amount)

      // Reset form on success
      setBetAmount('')
      setSelectedPrediction(null)

      toast.success('Bet placed successfully!')
    } catch (error) {
      console.error('Failed to place bet:', error)
      toast.error('Failed to place bet')
    }
  }

  const isValidAmount = betAmount && parseFloat(betAmount) > 0
  const hasBalance =
    balance &&
    parseFloat(formatEther(balance.value)) >= parseFloat(betAmount || '0')
  const canPlaceBet =
    isConnected &&
    isValidAmount &&
    hasBalance &&
    selectedPrediction !== null &&
    isRoundActive

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-lg font-medium">Connect Your Wallet</div>
            <div className="text-muted-foreground">
              Connect your wallet to start placing predictions
            </div>
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isRoundActive) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <div className="text-lg font-medium text-muted-foreground">
              Round Has Ended
            </div>
            <div className="text-sm text-muted-foreground">
              Wait for the next round to place new bets
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">Place Your Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prediction Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose your prediction</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedPrediction === true ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedPrediction(true)}
              className={`h-16 ${
                selectedPrediction === true
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'hover:bg-green-50 hover:border-green-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold">YES</div>
                <div className="text-xs opacity-80">
                  Price will be above target
                </div>
              </div>
            </Button>
            <Button
              variant={selectedPrediction === false ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedPrediction(false)}
              className={`h-16 ${
                selectedPrediction === false
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'hover:bg-red-50 hover:border-red-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold">NO</div>
                <div className="text-xs opacity-80">
                  Price will be below target
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Bet Amount (STT)</Label>
            {balance && (
              <div className="text-xs text-muted-foreground">
                Balance: {parseFloat(formatEther(balance.value)).toFixed(4)} STT
              </div>
            )}
          </div>

          <Input
            type="text"
            placeholder="0.00"
            value={betAmount}
            onChange={(e) => handleBetAmountChange(e.target.value)}
            className="text-lg font-mono text-center"
          />

          {/* Quick Amount Buttons */}
          {balance && (
            <div className="flex space-x-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(percentage)}
                  className="flex-1 text-xs"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Validation Messages */}
        <div className="space-y-2">
          {betAmount && !isValidAmount && (
            <div className="text-sm text-red-500">
              Please enter a valid amount
            </div>
          )}
          {isValidAmount && !hasBalance && (
            <div className="text-sm text-red-500">Insufficient balance</div>
          )}
          {selectedPrediction === null && (
            <div className="text-sm text-muted-foreground">
              Select YES or NO prediction
            </div>
          )}
        </div>

        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!canPlaceBet || isPending}
          size="lg"
          className="w-full"
        >
          {isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Placing Bet...</span>
            </div>
          ) : (
            `Place ${selectedPrediction === true ? 'YES' : selectedPrediction === false ? 'NO' : ''} Bet`
          )}
        </Button>

        {/* Summary */}
        {selectedPrediction !== null && isValidAmount && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Prediction:</span>
                  <Badge
                    variant={selectedPrediction ? 'default' : 'secondary'}
                    className={
                      selectedPrediction ? 'bg-green-600' : 'bg-red-600'
                    }
                  >
                    {selectedPrediction ? 'YES' : 'NO'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{betAmount} STT</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Potential Return:</span>
                  <span>Depends on final pool ratio</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
