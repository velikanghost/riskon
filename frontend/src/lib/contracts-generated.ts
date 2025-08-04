import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Riskon
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const riskonAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_treasury', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FEE_DENOMINATOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PROTOCOL_FEE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'RESOLVER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ROUND_DURATION',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_symbol', internalType: 'string', type: 'string' },
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_minBetAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addMarket',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_roundId', internalType: 'uint256', type: 'uint256' },
      { name: '_user', internalType: 'address', type: 'address' },
    ],
    name: 'calculateWinnings',
    outputs: [{ name: 'winnings', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_roundId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_marketId', internalType: 'uint256', type: 'uint256' }],
    name: 'deleteMarket',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_marketId', internalType: 'uint256', type: 'uint256' }],
    name: 'getCurrentRoundInfo',
    outputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'startTime', internalType: 'uint256', type: 'uint256' },
      { name: 'endTime', internalType: 'uint256', type: 'uint256' },
      { name: 'priceTarget', internalType: 'uint256', type: 'uint256' },
      { name: 'totalYes', internalType: 'uint256', type: 'uint256' },
      { name: 'totalNo', internalType: 'uint256', type: 'uint256' },
      { name: 'resolved', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMarkets',
    outputs: [
      { name: 'marketIds', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'symbols', internalType: 'string[]', type: 'string[]' },
      { name: 'names', internalType: 'string[]', type: 'string[]' },
      { name: 'isActiveList', internalType: 'bool[]', type: 'bool[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_roundId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRoundBettors',
    outputs: [
      { name: 'bettors', internalType: 'address[]', type: 'address[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_roundId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRoundOutcome',
    outputs: [
      { name: 'resolved', internalType: 'bool', type: 'bool' },
      { name: 'outcome', internalType: 'bool', type: 'bool' },
      { name: 'finalPrice', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_roundId', internalType: 'uint256', type: 'uint256' },
      { name: '_user', internalType: 'address', type: 'address' },
    ],
    name: 'getUserBet',
    outputs: [
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'prediction', internalType: 'bool', type: 'bool' },
      { name: 'claimed', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'markets',
    outputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'isActive', internalType: 'bool', type: 'bool' },
      { name: 'minBetAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'currentRoundId', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'minBetAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextMarketId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_prediction', internalType: 'bool', type: 'bool' },
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_roundId', internalType: 'uint256', type: 'uint256' },
      { name: '_finalPrice', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'resolveRoundWithPrice',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rounds',
    outputs: [
      { name: 'marketId', internalType: 'uint256', type: 'uint256' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'startTime', internalType: 'uint256', type: 'uint256' },
      { name: 'endTime', internalType: 'uint256', type: 'uint256' },
      { name: 'priceTarget', internalType: 'uint256', type: 'uint256' },
      { name: 'totalYes', internalType: 'uint256', type: 'uint256' },
      { name: 'totalNo', internalType: 'uint256', type: 'uint256' },
      { name: 'resolved', internalType: 'bool', type: 'bool' },
      { name: 'outcome', internalType: 'bool', type: 'bool' },
      { name: 'finalPrice', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketId', internalType: 'uint256', type: 'uint256' },
      { name: '_priceTarget', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'startNewRound',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_marketId', internalType: 'uint256', type: 'uint256' }],
    name: 'toggleMarket',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalFeesCollected',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_newMinBetAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateMinBetAmount',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_newTreasury', internalType: 'address', type: 'address' },
    ],
    name: 'updateTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'roundId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'prediction',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BetPlaced',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'treasury',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FeesWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'minBetAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MarketAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'MarketDeleted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'isActive', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'MarketToggled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MinBetAmountUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Paused',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'roundId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'outcome', internalType: 'bool', type: 'bool', indexed: true },
      {
        name: 'finalPrice',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalYes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalNo',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RoundResolved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'roundId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'startTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'endTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'priceTarget',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RoundStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldTreasury',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newTreasury',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'TreasuryUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Unpaused',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'marketId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'roundId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WinningsClaimed',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'BetTooSmall' },
  { type: 'error', inputs: [], name: 'EnforcedPause' },
  { type: 'error', inputs: [], name: 'ExpectedPause' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidMarketId' },
  { type: 'error', inputs: [], name: 'InvalidPriceTarget' },
  { type: 'error', inputs: [], name: 'InvalidRoundId' },
  { type: 'error', inputs: [], name: 'InvalidTreasuryAddress' },
  { type: 'error', inputs: [], name: 'MarketAlreadyExists' },
  { type: 'error', inputs: [], name: 'MarketHasActiveRound' },
  { type: 'error', inputs: [], name: 'MarketHasUnresolvedRounds' },
  { type: 'error', inputs: [], name: 'MarketNotActive' },
  { type: 'error', inputs: [], name: 'NoBetPlaced' },
  { type: 'error', inputs: [], name: 'NotWinner' },
  { type: 'error', inputs: [], name: 'PriceFeedInactive' },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  { type: 'error', inputs: [], name: 'RoundAlreadyResolved' },
  { type: 'error', inputs: [], name: 'RoundNotActive' },
  { type: 'error', inputs: [], name: 'RoundNotResolved' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
  { type: 'error', inputs: [], name: 'WinningsAlreadyClaimed' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__
 */
export const useReadRiskon = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"ADMIN_ROLE"`
 */
export const useReadRiskonAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'ADMIN_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const useReadRiskonDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: riskonAbi,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"FEE_DENOMINATOR"`
 */
export const useReadRiskonFeeDenominator = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'FEE_DENOMINATOR',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"PROTOCOL_FEE"`
 */
export const useReadRiskonProtocolFee = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'PROTOCOL_FEE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"RESOLVER_ROLE"`
 */
export const useReadRiskonResolverRole = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'RESOLVER_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"ROUND_DURATION"`
 */
export const useReadRiskonRoundDuration = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'ROUND_DURATION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"calculateWinnings"`
 */
export const useReadRiskonCalculateWinnings =
  /*#__PURE__*/ createUseReadContract({
    abi: riskonAbi,
    functionName: 'calculateWinnings',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"getCurrentRoundInfo"`
 */
export const useReadRiskonGetCurrentRoundInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: riskonAbi,
    functionName: 'getCurrentRoundInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"getMarkets"`
 */
export const useReadRiskonGetMarkets = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'getMarkets',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const useReadRiskonGetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"getRoundBettors"`
 */
export const useReadRiskonGetRoundBettors = /*#__PURE__*/ createUseReadContract(
  { abi: riskonAbi, functionName: 'getRoundBettors' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"getRoundOutcome"`
 */
export const useReadRiskonGetRoundOutcome = /*#__PURE__*/ createUseReadContract(
  { abi: riskonAbi, functionName: 'getRoundOutcome' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"getUserBet"`
 */
export const useReadRiskonGetUserBet = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'getUserBet',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"hasRole"`
 */
export const useReadRiskonHasRole = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"markets"`
 */
export const useReadRiskonMarkets = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'markets',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"minBetAmount"`
 */
export const useReadRiskonMinBetAmount = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'minBetAmount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"nextMarketId"`
 */
export const useReadRiskonNextMarketId = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'nextMarketId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"paused"`
 */
export const useReadRiskonPaused = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'paused',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"rounds"`
 */
export const useReadRiskonRounds = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'rounds',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadRiskonSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: riskonAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"totalFeesCollected"`
 */
export const useReadRiskonTotalFeesCollected =
  /*#__PURE__*/ createUseReadContract({
    abi: riskonAbi,
    functionName: 'totalFeesCollected',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"treasury"`
 */
export const useReadRiskonTreasury = /*#__PURE__*/ createUseReadContract({
  abi: riskonAbi,
  functionName: 'treasury',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__
 */
export const useWriteRiskon = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"addMarket"`
 */
export const useWriteRiskonAddMarket = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'addMarket',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"claimWinnings"`
 */
export const useWriteRiskonClaimWinnings = /*#__PURE__*/ createUseWriteContract(
  { abi: riskonAbi, functionName: 'claimWinnings' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"deleteMarket"`
 */
export const useWriteRiskonDeleteMarket = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'deleteMarket',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"emergencyWithdraw"`
 */
export const useWriteRiskonEmergencyWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: riskonAbi,
    functionName: 'emergencyWithdraw',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"grantRole"`
 */
export const useWriteRiskonGrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"pause"`
 */
export const useWriteRiskonPause = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'pause',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"placeBet"`
 */
export const useWriteRiskonPlaceBet = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'placeBet',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useWriteRiskonRenounceRole = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"resolveRoundWithPrice"`
 */
export const useWriteRiskonResolveRoundWithPrice =
  /*#__PURE__*/ createUseWriteContract({
    abi: riskonAbi,
    functionName: 'resolveRoundWithPrice',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useWriteRiskonRevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"startNewRound"`
 */
export const useWriteRiskonStartNewRound = /*#__PURE__*/ createUseWriteContract(
  { abi: riskonAbi, functionName: 'startNewRound' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"toggleMarket"`
 */
export const useWriteRiskonToggleMarket = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'toggleMarket',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"unpause"`
 */
export const useWriteRiskonUnpause = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'unpause',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"updateMinBetAmount"`
 */
export const useWriteRiskonUpdateMinBetAmount =
  /*#__PURE__*/ createUseWriteContract({
    abi: riskonAbi,
    functionName: 'updateMinBetAmount',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"updateTreasury"`
 */
export const useWriteRiskonUpdateTreasury =
  /*#__PURE__*/ createUseWriteContract({
    abi: riskonAbi,
    functionName: 'updateTreasury',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"withdrawFees"`
 */
export const useWriteRiskonWithdrawFees = /*#__PURE__*/ createUseWriteContract({
  abi: riskonAbi,
  functionName: 'withdrawFees',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__
 */
export const useSimulateRiskon = /*#__PURE__*/ createUseSimulateContract({
  abi: riskonAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"addMarket"`
 */
export const useSimulateRiskonAddMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'addMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"claimWinnings"`
 */
export const useSimulateRiskonClaimWinnings =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'claimWinnings',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"deleteMarket"`
 */
export const useSimulateRiskonDeleteMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'deleteMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"emergencyWithdraw"`
 */
export const useSimulateRiskonEmergencyWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'emergencyWithdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"grantRole"`
 */
export const useSimulateRiskonGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"pause"`
 */
export const useSimulateRiskonPause = /*#__PURE__*/ createUseSimulateContract({
  abi: riskonAbi,
  functionName: 'pause',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"placeBet"`
 */
export const useSimulateRiskonPlaceBet =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'placeBet',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useSimulateRiskonRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"resolveRoundWithPrice"`
 */
export const useSimulateRiskonResolveRoundWithPrice =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'resolveRoundWithPrice',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useSimulateRiskonRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"startNewRound"`
 */
export const useSimulateRiskonStartNewRound =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'startNewRound',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"toggleMarket"`
 */
export const useSimulateRiskonToggleMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'toggleMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"unpause"`
 */
export const useSimulateRiskonUnpause = /*#__PURE__*/ createUseSimulateContract(
  { abi: riskonAbi, functionName: 'unpause' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"updateMinBetAmount"`
 */
export const useSimulateRiskonUpdateMinBetAmount =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'updateMinBetAmount',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"updateTreasury"`
 */
export const useSimulateRiskonUpdateTreasury =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'updateTreasury',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link riskonAbi}__ and `functionName` set to `"withdrawFees"`
 */
export const useSimulateRiskonWithdrawFees =
  /*#__PURE__*/ createUseSimulateContract({
    abi: riskonAbi,
    functionName: 'withdrawFees',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__
 */
export const useWatchRiskonEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: riskonAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"BetPlaced"`
 */
export const useWatchRiskonBetPlacedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'BetPlaced',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"FeesWithdrawn"`
 */
export const useWatchRiskonFeesWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'FeesWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"MarketAdded"`
 */
export const useWatchRiskonMarketAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'MarketAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"MarketDeleted"`
 */
export const useWatchRiskonMarketDeletedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'MarketDeleted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"MarketToggled"`
 */
export const useWatchRiskonMarketToggledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'MarketToggled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"MinBetAmountUpdated"`
 */
export const useWatchRiskonMinBetAmountUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'MinBetAmountUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"Paused"`
 */
export const useWatchRiskonPausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'Paused',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const useWatchRiskonRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"RoleGranted"`
 */
export const useWatchRiskonRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"RoleRevoked"`
 */
export const useWatchRiskonRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"RoundResolved"`
 */
export const useWatchRiskonRoundResolvedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'RoundResolved',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"RoundStarted"`
 */
export const useWatchRiskonRoundStartedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'RoundStarted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"TreasuryUpdated"`
 */
export const useWatchRiskonTreasuryUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'TreasuryUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"Unpaused"`
 */
export const useWatchRiskonUnpausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'Unpaused',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link riskonAbi}__ and `eventName` set to `"WinningsClaimed"`
 */
export const useWatchRiskonWinningsClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: riskonAbi,
    eventName: 'WinningsClaimed',
  })
