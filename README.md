# Riskon – Odds-Based On‑Chain Prediction Markets

## Overview

Riskon is a fast, prediction market for crypto prices. Rounds last 3 minutes. At round start, the protocol fixes a USD target relative to the current price using a small, fixed increment/decrement (e.g., BTC ±$10, ETH ±$5, SOL ±$2). Users bet YES (price will be above target) or NO (below target) with STT. Payouts are determined by fixed odds captured at bet time.

Key highlights

- Odds-based payouts captured at bet time
- Short 3-minute rounds for fast gameplay
- Fixed USD increments for targets
- Access-controlled admin actions with emergency pause
- Built with Solidity + Foundry and a Next.js 15 frontend (Wagmi + viem)

## Repository Structure

```
.
├── src/                    # Solidity contracts (Foundry)
│   └── Riskon.sol          # Core contract
├── script/                 # Foundry deployment & helper scripts
├── test/                   # Foundry tests
├── frontend/               # Next.js 15 app (Wagmi + viem)
│   └── src/
│       ├── app/            # App Router pages & API routes (backend)
│       ├── components/     # UI & feature components
│       ├── hooks/          # React hooks (wagmi/viem, odds, state)
│       ├── lib/            # utils, config, contracts-generated.ts
│       └── store/          # Redux Toolkit
├── foundry.toml
└── README.md
```

---

## Smart Contracts

### Contract

- File: `src/Riskon.sol`
- Solidity: `^0.8.19`
- Patterns: AccessControl, ReentrancyGuard, Pausable, checks-effects-interactions

### Game Mechanics

- Round duration: 3 minutes
- Target selection: at round start, choose randomly to increment or decrement current price by a fixed USD amount per market
  - Increments: `BTC/USD` $10, `ETH/USD` $5, `SOL/USD` $2 (8‑decimals on-chain)
- Price decimals: USD prices use 8 decimals on-chain
- Odds: calculated from current YES/NO totals at bet time; stored per bet and used for payouts

### Key Functions (selection)

- `startNewRound(uint256 priceTarget)` – Admin starts a new round with 8‑dec USD target
- `placeBet(uint256 marketId, bool prediction)` – Bet YES/NO with `msg.value`
- `getCurrentRoundInfo(uint256 marketId)` – Current round data
- `getCurrentOdds(uint256 marketId)` – Current YES/NO odds
- `getUserBet(uint256 marketId, uint256 roundId, address user)` – Returns `(amount, prediction, claimed, odds, timestamp)`
- `calculateWinnings(uint256 marketId, uint256 roundId, address user)` – Potential winnings
- `claimWinnings(uint256 marketId, uint256 roundId)` – Withdraw winnings

### Roles & Security

- Roles: `ADMIN_ROLE`, `RESOLVER_ROLE`
- Security: `ReentrancyGuard`, `Pausable`, custom errors, input validation

### Build & Test (Foundry)

```bash
# From repo root
forge build
forge test -vvv
```

### Deployment (Somnia Testnet)

Use this direct deployment command (no deploy script):

```bash
forge create src/Riskon.sol:Riskon \
  --rpc-url https://rpc.ankr.com/somnia_testnet \
  --broadcast \
  --private-key <<private_key>> \
  --constructor-args "<<treasury_address>>"
```

Notes

- `<<private_key>>` should be without `0x`
- `<<treasury_address>>` will receive protocol fees
- After deploy, copy the deployed address into the frontend env (`NEXT_PUBLIC_RISKON_ADDRESS`)

---

## Frontend (Next.js 15, Wagmi + viem)

### Tech

- Next.js 15 App Router, React 19
- Wagmi + viem for contract reads/writes
- Redux Toolkit for global state
- TailwindCSS v4, shadcn/ui components
- Next.js API routes (in `frontend/src/app/api`) serve as the backend for admin and data endpoints

### Important Paths

- Components: `frontend/src/components/features/*`
- Hooks: `frontend/src/hooks/*` (e.g., `useMultiMarketPrediction`, `useCurrentOdds`)
- Contract bindings: `frontend/src/lib/contracts-generated.ts` (auto‑generated)
- Admin/API routes: `frontend/src/app/api/*` (e.g., `admin/rounds/start`, `admin/rounds/resolve`, `prices`, `user/*`)

### Environment (.env) – Frontend

Create `frontend/.env` and set:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_DEFAULT_CHAIN_ID=50312
ADMIN_PRIVATE_KEY=
NEXT_PUBLIC_RISKON_ADDRESS=
NEXT_PUBLIC_ADMIN_ADDRESSES=
```

Notes

- `NEXT_PUBLIC_RISKON_ADDRESS` is the deployed `Riskon` contract address
- `NEXT_PUBLIC_ADMIN_ADDRESSES` is a comma-separated list of admin EOA addresses (for UI controls)
- `ADMIN_PRIVATE_KEY` is used only by server/admin API routes if required (do not expose in client)

### Install, Generate, Build

```bash
cd frontend
npm install

# Generate wagmi/viem types from wagmi.config.ts
npx wagmi generate

# Build frontend
npm run build

# Run dev server
npm run dev
```

If you change contract ABIs or addresses, re-run `npx wagmi generate`.

---

## Backend (API Routes inside Frontend)

The project uses Next.js API routes as its backend for admin and data tasks:

- `frontend/src/app/api/admin/rounds/start` – starts new rounds (uses fixed USD increments)
- `frontend/src/app/api/admin/rounds/resolve` and `resolve/auto` – resolves rounds
- `frontend/src/app/api/markets`, `prices` – market and price data
- `frontend/src/app/api/user/*` – user dashboard, winnings, and bets

Other libs/config

- `frontend/src/lib/pythConfig.ts` – Pyth feed IDs and market USD increments
- `frontend/src/lib/roundScheduler.ts` – round creation/resolution helper logic

Database

- There is no PostgreSQL/Prisma dependency in use; all state is on-chain and via API routes

---

## Troubleshooting

- After modifying `Riskon.sol`, regenerate frontend bindings: `cd frontend && npx wagmi generate`
- Ensure `NEXT_PUBLIC_RISKON_ADDRESS` matches the latest deployed address
- USD prices are handled with 8 decimals on-chain; ensure conversions use `BigInt(Math.round(usd * 1e8))`
- If you see TypeScript tuple errors for contract reads, regenerate bindings and confirm the deployed contract matches the ABI

---

## License

MIT License – see `LICENSE`.
