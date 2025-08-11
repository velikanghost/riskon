'use client'

import { useAppSelector } from '@/hooks/useRedux'
import { Header } from '@/components/features/Header'
import { MarketArena } from '@/components/features/MarketArena'
import { RoundDisplay } from '@/components/features/RoundDisplay'
import { UserDashboard } from '@/components/features/UserDashboard'
import { AdminPanel } from '@/components/features/AdminPanel'

export default function HomePage() {
  const selectedTab = useAppSelector((state) => state.ui.selectedTab)

  const renderContent = () => {
    switch (selectedTab) {
      case 'markets':
        return <MarketArena />
      case 'current':
        return <RoundDisplay />
      case 'dashboard':
        return <UserDashboard />
      case 'admin':
        return <AdminPanel />
      default:
        return <MarketArena />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl container mx-auto px-4 py-6">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Riskon - Real-time Prediction Market on Somnia Blockchain
            </div>
            <div className="text-xs text-muted-foreground">
              Fast-paced binary predictions with 3-minute rounds
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
