# Riskon Smart Contracts

## Overview

Riskon is a fast-paced, real-time prediction market built for the Somnia blockchain. The smart contract system manages 3-minute binary prediction rounds where users bet on whether ETH price will be above or below a target price.

## Architecture

### Core Contracts

1. **PredictionMarket.sol** - Main contract managing rounds, bets, and payouts
2. **IPriceOracle.sol** - Interface for price oracle integration
3. **MockPriceOracle.sol** - Mock oracle for testing and development

### Key Features

- 🚀 **3-minute rounds** with sub-second finality on Somnia
- 💰 **Binary predictions** (YES/NO) on ETH price movements
- 🔒 **Security-first** design with access controls and reentrancy protection
- ⚡ **Gas optimized** for high-frequency trading
- 📊 **Protocol fees** (2%) collected for treasury
- 🛡️ **Emergency controls** for admin management

## Contract Details

### PredictionMarket

**Key Functions:**

- `placeBet(bool prediction)` - Place YES/NO bet with ETH
- `resolveRound(uint256 roundId)` - Resolve round using oracle price
- `claimWinnings(uint256 roundId)` - Claim proportional winnings
- `startNewRound(uint256 priceTarget)` - Start new prediction round

**Security Features:**

- Access control with admin/resolver roles
- Reentrancy protection on all external calls
- Pausable functionality for emergency stops
- Input validation and custom errors

**Events:**

- `RoundStarted` - New round created
- `BetPlaced` - User placed bet
- `RoundResolved` - Round outcome determined
- `WinningsClaimed` - User claimed rewards

### MockPriceOracle

**Key Functions:**

- `setPrice(uint256 newPrice)` - Update price (testing only)
- `getPrice()` - Get current price and timestamp
- `isActive()` - Check if oracle is providing valid data

## Deployment

### Prerequisites

1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash`
2. Copy `config.example.env` to `.env` and configure:
   ```bash
   PRIVATE_KEY=your_private_key_without_0x
   TREASURY_ADDRESS=your_treasury_address
   ```

### Deploy to Somnia Testnet

```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy to Somnia testnet
forge script script/Deploy.s.sol --rpc-url $SOMNIA_TESTNET_RPC --broadcast --verify
```

### Verification

Contracts are automatically verified during deployment using the configured Etherscan API.

## Interaction Scripts

### Available Commands

```bash
# Display current round info
forge script script/Interact.s.sol --rpc-url $SOMNIA_TESTNET_RPC

# Start new round
forge script script/Interact.s.sol --sig "startNewRound()" --rpc-url $SOMNIA_TESTNET_RPC --broadcast

# Place bet
forge script script/Interact.s.sol --sig "placeBet()" --rpc-url $SOMNIA_TESTNET_RPC --broadcast

# Resolve round
forge script script/Interact.s.sol --sig "resolveCurrentRound()" --rpc-url $SOMNIA_TESTNET_RPC --broadcast

# Claim winnings
forge script script/Interact.s.sol --sig "claimWinnings()" --rpc-url $SOMNIA_TESTNET_RPC --broadcast
```

### Configuration

Update `.env` with interaction parameters:

```bash
NEW_PRICE_TARGET=300000000000  # $3000 USD (8 decimals)
FINAL_PRICE=320000000000       # $3200 USD (8 decimals)
BET_AMOUNT=1000000000000000000 # 1 ETH
PREDICTION=true                # true for YES, false for NO
ROUND_ID=1                     # Target round ID
```

## Testing

### Test Coverage

- ✅ **Unit Tests** - All core functions tested
- ✅ **Fuzz Tests** - Random input validation
- ✅ **Integration Tests** - End-to-end workflows
- ✅ **Security Tests** - Access control and edge cases

### Run Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testPlaceBet

# Gas report
forge test --gas-report

# Coverage report
forge coverage
```

## Security Considerations

### Implemented Protections

1. **Access Control** - Role-based permissions using OpenZeppelin
2. **Reentrancy Guards** - Protection on all external calls
3. **Input Validation** - Custom errors for invalid inputs
4. **Emergency Stops** - Pausable functionality for critical issues
5. **Oracle Validation** - Active status and timestamp checks

### Audit Recommendations

1. External security audit before mainnet deployment
2. Formal verification of mathematical calculations
3. Economic analysis of game theory and incentives
4. Stress testing with high transaction volumes

## Gas Optimization

- Packed structs for efficient storage
- Events for off-chain data retrieval
- Optimized loops and calculations
- Custom errors instead of string reverts

## Economics

### Fee Structure

- **Protocol Fee**: 2% of total pool
- **Winner Share**: 98% distributed proportionally
- **Minimum Bet**: 0.001 ETH (configurable)

### Payout Formula

```
winnings = (user_bet_amount * prize_pool) / winning_pool_total
where prize_pool = total_pool * 0.98
```

## Integration Guide

### Frontend Integration

```solidity
// Check current round
(uint256 roundId, uint256 startTime, uint256 endTime,
 uint256 priceTarget, uint256 totalYes, uint256 totalNo,
 bool resolved) = predictionMarket.getCurrentRoundInfo();

// Place bet
predictionMarket.placeBet{value: betAmount}(prediction);

// Check user bet
(uint256 amount, bool prediction, bool claimed) =
  predictionMarket.getUserBet(roundId, userAddress);

// Calculate potential winnings
uint256 winnings = predictionMarket.calculateWinnings(roundId, userAddress);
```

### Event Monitoring

Monitor these events for real-time updates:

- `RoundStarted` - New round created
- `BetPlaced` - New bet placed
- `RoundResolved` - Round outcome available
- `WinningsClaimed` - Winnings claimed

## Troubleshooting

### Common Issues

1. **"RoundNotActive"** - Round has ended, wait for new round
2. **"BetTooSmall"** - Increase bet amount above minimum
3. **"NotWinner"** - User didn't predict correctly
4. **"WinningsAlreadyClaimed"** - Rewards already withdrawn

### Support

For technical support or questions:

- Review test files for usage examples
- Check deployment logs for contract addresses
- Verify environment configuration

## License

MIT License - see LICENSE file for details.
