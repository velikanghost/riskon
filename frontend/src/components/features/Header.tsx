'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux'
import { setSelectedTab } from '@/store/slices/uiSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabType } from '@/types'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const dispatch = useAppDispatch()
  const selectedTab = useAppSelector((state) => state.ui.selectedTab)

  const tabs: { key: TabType; label: string; badge?: string }[] = [
    { key: 'markets', label: 'Markets' },
    { key: 'current', label: 'Current Round' },
    { key: 'dashboard', label: 'Dashboard', badge: 'My Bets' },
  ]

  return (
    <header className={`border-b bg-card/50 backdrop-blur-sm ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Riskon
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time Prediction Market
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => dispatch(setSelectedTab(tab.key))}
                className="relative"
              >
                {tab.label}
                {tab.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs h-5 px-1.5"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              chainStatus={{
                smallScreen: 'icon',
                largeScreen: 'full',
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={selectedTab === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => dispatch(setSelectedTab(tab.key))}
              className="whitespace-nowrap flex-shrink-0"
            >
              {tab.label}
              {tab.badge && (
                <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  )
}
