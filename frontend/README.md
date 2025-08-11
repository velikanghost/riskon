# Riskon Frontend

A Next.js 15 + Wagmi + viem interface for the Riskon prediction market.

## Requirements

- Node.js 18+
- A deployed `Riskon` contract address

## Env Setup

Create `frontend/.env` with:

```env
# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# RPC and Chain (Somnia Testnet example)
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_DEFAULT_CHAIN_ID=50312

# Contract + Admin
NEXT_PUBLIC_RISKON_ADDRESS=
NEXT_PUBLIC_ADMIN_ADDRESSES=
ADMIN_PRIVATE_KEY=
```

Notes

- `NEXT_PUBLIC_RISKON_ADDRESS` must be set to the deployed contract
- `ADMIN_PRIVATE_KEY` is only used by server API routes when needed

## Install, Generate, Build

```bash
cd frontend
npm install

# Generate wagmi bindings (re-run if ABI changes)
npx wagmi generate

# Build or run dev
npm run build
npm run dev
```

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run production build

## Where Things Live

- Contract bindings: `src/lib/contracts-generated.ts`
- Hooks: `src/hooks/*` (e.g., `useMultiMarketPrediction`, `useCurrentOdds`)
- API routes (backend): `src/app/api/*`
- UI components: `src/components/*`

For contract deployment and full project docs, see the repository root `README.md`.
