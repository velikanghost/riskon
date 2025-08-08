'use client'

import { useAppSelector } from '@/hooks/useRedux'
import { Header } from '@/components/features/Header'
import { MarketArena } from '@/components/features/MarketArena'
import { RoundDisplay } from '@/components/features/RoundDisplay'
import { RoundHistory } from '@/components/features/RoundHistory'
import { UserDashboard } from '@/components/features/UserDashboard'

export default function HomePage() {
  const selectedTab = useAppSelector((state) => state.ui.selectedTab)
  const selectedMarketId = useAppSelector(
    (state) => state.market?.selectedMarketId,
  )

  const renderContent = () => {
    switch (selectedTab) {
      case 'markets':
        return <MarketArena />
      case 'current':
        return <RoundDisplay />
      case 'history':
        return <RoundHistory marketId={Number(selectedMarketId ?? 1)} />
      case 'dashboard':
        return <UserDashboard />
      default:
        return <MarketArena />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Riskon - Real-time Prediction Market on Somnia Blockchain
            </div>
            <div className="text-xs text-muted-foreground">
              Fast-paced binary predictions with 5-minute rounds
            </div>
            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <span>Sub-second finality</span>
              <span>•</span>
              <span>1M+ TPS</span>
              <span>•</span>
              <span>Fully on-chain</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
