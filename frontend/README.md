# Riskon Frontend

## Overview

The Riskon frontend is a modern React application built with Next.js 15, providing a fast-paced, real-time interface for the prediction market. Built for the Somnia blockchain with sub-second finality and high throughput.

## Tech Stack

### Core Framework

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with new features
- **TypeScript** - Full type safety

### Styling & UI

- **TailwindCSS v4** - Utility-first CSS framework
- **Shadcn UI** - High-quality component library
- **Animata** - Advanced UI animations
- **Geist Font** - Modern typography

### Web3 Integration

- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **RainbowKit** - Wallet connection UI

### State Management

- **Redux Toolkit** - Predictable state container
- **RTK Query** - Data fetching and caching
- **React Redux** - React bindings for Redux

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **PostCSS** - CSS processing

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── forms/             # Form components
│   └── features/          # Feature-specific components
├── hooks/                 # Custom React hooks
│   ├── useRedux.ts        # Redux hooks
│   └── usePredictionMarket.ts # Web3 contract hooks
├── lib/
│   ├── config.ts          # Wagmi and chain configuration
│   └── utils.ts           # Utility functions
├── providers/
│   └── Providers.tsx      # All app providers
├── store/
│   ├── index.ts          # Redux store configuration
│   ├── api/              # RTK Query APIs
│   └── slices/           # Redux slices
└── types/
    └── index.ts          # TypeScript type definitions
```

## Features

### Web3 Integration

- 🌐 **Multi-chain Support** - Somnia, Sepolia, Mainnet
- 🔗 **Wallet Connection** - Multiple wallet support via RainbowKit
- ⚡ **Real-time Data** - Live contract state updates
- 🔄 **Auto-refresh** - 5-second polling for current round data

### UI/UX

- 📱 **Responsive Design** - Mobile-first approach
- 🎨 **Modern Design** - Clean, arcade-style interface
- 🔔 **Toast Notifications** - Real-time feedback
- ⏱️ **Live Countdown** - Real-time round timers
- 📊 **Data Visualization** - Pool size indicators

### State Management

- 🗃️ **Persistent State** - User preferences and data
- 🔄 **Real-time Updates** - Live contract event handling
- 📊 **Caching** - Efficient data fetching and caching
- 🎯 **Optimistic Updates** - Immediate UI feedback

## Configuration

### Environment Variables

Copy `env.example` to `.env.local` and configure:

```bash
# WalletConnect Project ID (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract Addresses (update after deployment)
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=0x...

# Chain Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=50311
```

### Chains Supported

1. **Somnia Testnet** (Primary)
   - Chain ID: 50311
   - RPC: https://dream-rpc.somnia.network
   - Explorer: https://somnia-testnet.blockscout.com

2. **Sepolia** (Testing)
   - Chain ID: 11155111

3. **Ethereum Mainnet** (Future)
   - Chain ID: 1

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Development Workflow

1. **Component Development**
   - Use Shadcn UI as base components
   - Implement custom components in `components/features/`
   - Add Animata animations for enhanced UX

2. **State Management**
   - Use Redux slices for UI state
   - Use Wagmi hooks for blockchain data
   - Implement optimistic updates for better UX

3. **Styling**
   - Use TailwindCSS utility classes
   - Follow mobile-first responsive design
   - Maintain consistent design system

## Key Hooks

### Web3 Hooks

```typescript
// Get current round data
const { round, isLoading } = useCurrentRound()

// Get user's bet for a round
const { bet } = useUserBet(roundId, userAddress)

// Calculate potential winnings
const { winnings } = useCalculateWinnings(roundId, userAddress)

// Place a bet
const { placeBet, isPending } = usePredictionMarket()
```

### Redux Hooks

```typescript
// Access Redux state
const selectedTab = useAppSelector((state) => state.ui.selectedTab)

// Dispatch actions
const dispatch = useAppDispatch()
dispatch(setSelectedTab('history'))
```

## Components

### UI Components (Shadcn)

- `Button` - Interactive buttons
- `Card` - Content containers
- `Input` - Form inputs
- `Label` - Form labels
- `Progress` - Progress indicators
- `Dialog` - Modal dialogs
- `Badge` - Status indicators
- `Avatar` - User avatars
- `Sonner` - Toast notifications

### Custom Components (To be implemented)

- `BettingForm` - Place new bets
- `RoundDisplay` - Current round information
- `RoundHistory` - Historical rounds
- `UserDashboard` - User statistics
- `WalletConnect` - Wallet connection
- `PriceDisplay` - Real-time ETH price
- `CountdownTimer` - Round countdown

## Performance

### Optimization Features

- ⚡ **Code Splitting** - Dynamic imports for components
- 🗜️ **Bundle Optimization** - Tree shaking and minification
- 📦 **Image Optimization** - Next.js Image component
- 🔄 **Caching** - Efficient data caching with RTK Query
- 📱 **Mobile Performance** - Optimized for mobile devices

### Real-time Updates

- 5-second polling for current round data
- Live contract event listening
- Optimistic UI updates
- Efficient re-rendering with React.memo

## Security

### Best Practices

- ✅ **Input Validation** - Client-side validation
- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **Secure Defaults** - Safe fallbacks for missing data
- ✅ **Error Boundaries** - Graceful error handling

### Web3 Security

- Wallet connection state validation
- Transaction confirmation prompts
- Network switching notifications
- Contract address verification

## Deployment

### Build Process

```bash
# Build the application
npm run build

# Test the build locally
npm start
```

### Deployment Platforms

- **Vercel** (Recommended) - Optimized for Next.js
- **Netlify** - Alternative hosting
- **AWS Amplify** - Enterprise hosting

### Environment Setup

1. Set up WalletConnect Cloud project
2. Configure environment variables
3. Deploy smart contracts
4. Update contract addresses in config

## Troubleshooting

### Common Issues

1. **WalletConnect Issues**
   - Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
   - Check project configuration on WalletConnect Cloud

2. **Build Errors**
   - Run `npm run lint` to check for linting issues
   - Verify all TypeScript types are correct

3. **Web3 Connection Issues**
   - Check network configuration in `config.ts`
   - Verify contract addresses are correct
   - Ensure user is on the correct network

### Performance Issues

- Check React DevTools for unnecessary re-renders
- Verify data fetching patterns
- Monitor bundle size with Next.js built-in analyzer

## Future Enhancements

- Real-time WebSocket connections
- Advanced charting with price history
- Social features (leaderboards, chat)
- NFT rewards for achievements
- Mobile app with React Native
- Advanced analytics dashboard

## Contributing

1. Follow the established project structure
2. Use TypeScript for all new code
3. Implement responsive design patterns
4. Add proper error handling
5. Include loading states for async operations
6. Write meaningful commit messages

## License

MIT License - see LICENSE file for details.
