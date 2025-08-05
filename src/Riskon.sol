// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Riskon
 * @dev A fast-paced multi-market prediction platform for binary outcomes with 5-minute rounds
 * @notice Users can bet on whether asset prices will be above or below target prices across multiple markets
 */
contract Riskon is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    /// @dev Round duration in seconds (5 minutes)
    uint256 public constant ROUND_DURATION = 5 minutes;

    /// @dev Protocol fee in basis points (200 = 2%)
    uint256 public constant PROTOCOL_FEE = 200;

    /// @dev Fee denominator (10000 = 100%)
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @dev Minimum bet amount to prevent spam
    uint256 public minBetAmount = 0.01 ether;

    /// @dev Next market ID to be assigned
    uint256 public nextMarketId = 1;

    struct Market {
        uint256 id;
        string symbol;
        string name;
        bool isActive;
        uint256 minBetAmount;
        uint256 currentRoundId;
    }

    struct Round {
        uint256 marketId;
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 priceTarget;
        uint256 totalYes;
        uint256 totalNo;
        mapping(address => Bet) bets;
        bool resolved;
        bool outcome;
        uint256 finalPrice;
        address[] bettors;
    }

    struct Bet {
        uint256 amount;
        bool prediction;
        bool claimed;
    }

    /// @dev Treasury address for protocol fees
    address public treasury;

    /// @dev Mapping from market ID to Market
    mapping(uint256 => Market) public markets;

    /// @dev Mapping from market ID to round ID to Round
    mapping(uint256 => mapping(uint256 => Round)) public rounds;

    /// @dev Total protocol fees collected
    uint256 public totalFeesCollected;

    // Events
    event MarketAdded(
        uint256 indexed marketId,
        string symbol,
        string name,
        uint256 minBetAmount
    );

    event MarketToggled(uint256 indexed marketId, bool isActive);

    event RoundStarted(
        uint256 indexed marketId,
        uint256 indexed roundId,
        uint256 indexed startTime,
        uint256 endTime,
        uint256 priceTarget
    );

    event BetPlaced(
        uint256 indexed marketId,
        uint256 indexed roundId,
        address indexed user,
        bool prediction,
        uint256 amount
    );

    event RoundResolved(
        uint256 indexed marketId,
        uint256 indexed roundId,
        bool indexed outcome,
        uint256 finalPrice,
        uint256 totalYes,
        uint256 totalNo
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        uint256 indexed roundId,
        address indexed user,
        uint256 amount
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event MinBetAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event FeesWithdrawn(address indexed treasury, uint256 amount);
    event MarketDeleted(uint256 indexed marketId, string symbol);

    // Custom errors
    error InvalidMarketId();
    error MarketNotActive();
    error MarketAlreadyExists();
    error InvalidRoundId();
    error RoundNotActive();
    error RoundAlreadyResolved();
    error RoundNotResolved();
    error BetTooSmall();
    error NoBetPlaced();
    error WinningsAlreadyClaimed();
    error NotWinner();
    error InvalidPriceTarget();
    error PriceFeedInactive();
    error InvalidTreasuryAddress();
    error InsufficientBalance();
    error TransferFailed();
    error MarketHasActiveRound();
    error MarketHasUnresolvedRounds();

    constructor(address _treasury) {
        if (_treasury == address(0)) {
            revert InvalidTreasuryAddress();
        }

        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RESOLVER_ROLE, msg.sender);

        _addMarket("BTC/USD", "Bitcoin", 0.01 ether);
        _addMarket("ETH/USD", "Ethereum", 0.01 ether);
        _addMarket("SOL/USD", "Solana", 0.01 ether);
    }

    /**
     * @notice Add a new market
     * @param _symbol Market symbol (e.g., "STT/USDC")
     * @param _name Market name (e.g., "Somnia Token")
     * @param _minBetAmount Minimum bet amount for this market
     */
    function addMarket(
        string memory _symbol,
        string memory _name,
        uint256 _minBetAmount
    ) external onlyRole(ADMIN_ROLE) {
        _addMarket(_symbol, _name, _minBetAmount);
    }

    /**
     * @notice Toggle market active status
     * @param _marketId Market ID to toggle
     */
    function toggleMarket(uint256 _marketId) external onlyRole(ADMIN_ROLE) {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        markets[_marketId].isActive = !markets[_marketId].isActive;
        emit MarketToggled(_marketId, markets[_marketId].isActive);
    }

    /**
     * @notice Delete a market.
     * @param _marketId Market ID to delete
     */
    function deleteMarket(uint256 _marketId) external onlyRole(ADMIN_ROLE) {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        Market storage market = markets[_marketId];

        if (market.isActive) {
            revert MarketHasActiveRound();
        }

        if (market.currentRoundId > 0) {
            Round storage currentRound = rounds[_marketId][
                market.currentRoundId
            ];
            if (!currentRound.resolved) {
                revert MarketHasUnresolvedRounds();
            }
        }

        string memory symbol = market.symbol;

        delete markets[_marketId];

        emit MarketDeleted(_marketId, symbol);
    }

    /**
     * @notice Start a new prediction round for a specific market
     * @param _marketId Market ID
     * @param _priceTarget The target price for the prediction (in USD with 8 decimals)
     */
    function startNewRound(
        uint256 _marketId,
        uint256 _priceTarget
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        if (!markets[_marketId].isActive) {
            revert MarketNotActive();
        }

        Market storage market = markets[_marketId];

        if (
            market.currentRoundId > 0 &&
            !rounds[_marketId][market.currentRoundId].resolved
        ) {
            if (
                block.timestamp >=
                rounds[_marketId][market.currentRoundId].endTime
            ) {
                _resolveRoundWithPrice(_marketId, market.currentRoundId, 0); // Will be called by backend with actual price
            } else {
                revert RoundNotActive();
            }
        }

        _startNewRound(_marketId, _priceTarget);
    }

    /**
     * @notice Place a bet on the current round of a specific market
     * @param _marketId Market ID
     * @param _prediction True for YES (price will be above target), false for NO
     */
    function placeBet(
        uint256 _marketId,
        bool _prediction
    ) external payable nonReentrant whenNotPaused {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        if (!markets[_marketId].isActive) {
            revert MarketNotActive();
        }

        Market storage market = markets[_marketId];

        if (msg.value < market.minBetAmount) {
            revert BetTooSmall();
        }

        Round storage round = rounds[_marketId][market.currentRoundId];

        if (market.currentRoundId == 0 || block.timestamp >= round.endTime) {
            revert RoundNotActive();
        }

        if (round.resolved) {
            revert RoundAlreadyResolved();
        }

        if (round.bets[msg.sender].amount == 0) {
            round.bettors.push(msg.sender);
        }

        round.bets[msg.sender].amount += msg.value;
        round.bets[msg.sender].prediction = _prediction;

        if (_prediction) {
            round.totalYes += msg.value;
        } else {
            round.totalNo += msg.value;
        }

        emit BetPlaced(
            _marketId,
            market.currentRoundId,
            msg.sender,
            _prediction,
            msg.value
        );
    }

    /**
     * @notice Resolve a round
     * @param _marketId Market ID
     * @param _roundId The round ID to resolve
     * @param _finalPrice Final price from API
     */
    function resolveRoundWithPrice(
        uint256 _marketId,
        uint256 _roundId,
        uint256 _finalPrice
    ) external onlyRole(RESOLVER_ROLE) whenNotPaused {
        _resolveRoundWithPrice(_marketId, _roundId, _finalPrice);
    }

    /**
     * @notice Claim winnings from a resolved round
     * @param _marketId Market ID
     * @param _roundId The round ID to claim from
     */
    function claimWinnings(
        uint256 _marketId,
        uint256 _roundId
    ) external nonReentrant whenNotPaused {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        Round storage round = rounds[_marketId][_roundId];

        if (!round.resolved) {
            revert RoundNotResolved();
        }

        Bet storage userBet = round.bets[msg.sender];

        if (userBet.amount == 0) {
            revert NoBetPlaced();
        }

        if (userBet.claimed) {
            revert WinningsAlreadyClaimed();
        }

        if (userBet.prediction != round.outcome) {
            revert NotWinner();
        }

        userBet.claimed = true;

        uint256 winnings = _calculateWinnings(_marketId, _roundId, msg.sender);

        if (winnings == 0) {
            revert NotWinner();
        }

        emit WinningsClaimed(_marketId, _roundId, msg.sender, winnings);

        (bool success, ) = payable(msg.sender).call{value: winnings}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @notice Get all available markets
     * @return marketIds Array of market IDs
     * @return symbols Array of market symbols
     * @return names Array of market names
     * @return isActiveList Array of market active status
     */
    function getMarkets()
        external
        view
        returns (
            uint256[] memory marketIds,
            string[] memory symbols,
            string[] memory names,
            bool[] memory isActiveList
        )
    {
        uint256 marketCount = nextMarketId - 1;
        marketIds = new uint256[](marketCount);
        symbols = new string[](marketCount);
        names = new string[](marketCount);
        isActiveList = new bool[](marketCount);

        for (uint256 i = 1; i < nextMarketId; i++) {
            marketIds[i - 1] = markets[i].id;
            symbols[i - 1] = markets[i].symbol;
            names[i - 1] = markets[i].name;
            isActiveList[i - 1] = markets[i].isActive;
        }
    }

    /**
     * @notice Get current round information for a specific market
     * @param _marketId Market ID
     * @return id Current round ID
     * @return startTime Round start timestamp
     * @return endTime Round end timestamp
     * @return priceTarget Target price for the round
     * @return totalYes Total amount bet on YES
     * @return totalNo Total amount bet on NO
     * @return resolved Whether the round is resolved
     */
    function getCurrentRoundInfo(
        uint256 _marketId
    )
        external
        view
        returns (
            uint256 id,
            uint256 startTime,
            uint256 endTime,
            uint256 priceTarget,
            uint256 totalYes,
            uint256 totalNo,
            bool resolved
        )
    {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        Market storage market = markets[_marketId];
        Round storage round = rounds[_marketId][market.currentRoundId];
        return (
            round.id,
            round.startTime,
            round.endTime,
            round.priceTarget,
            round.totalYes,
            round.totalNo,
            round.resolved
        );
    }

    /**
     * @notice Get bet information for a user in a specific round
     * @param _marketId Market ID
     * @param _roundId Round ID
     * @param _user User address
     * @return amount Bet amount
     * @return prediction User's prediction
     * @return claimed Whether winnings have been claimed
     */
    function getUserBet(
        uint256 _marketId,
        uint256 _roundId,
        address _user
    ) external view returns (uint256 amount, bool prediction, bool claimed) {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        Bet storage bet = rounds[_marketId][_roundId].bets[_user];
        return (bet.amount, bet.prediction, bet.claimed);
    }

    /**
     * @notice Calculate potential winnings for a user in a round
     * @param _marketId Market ID
     * @param _roundId Round ID
     * @param _user User address
     * @return winnings Potential winnings amount
     */
    function calculateWinnings(
        uint256 _marketId,
        uint256 _roundId,
        address _user
    ) external view returns (uint256 winnings) {
        return _calculateWinnings(_marketId, _roundId, _user);
    }

    /**
     * @notice Get all bettors for a specific round
     * @param _marketId Market ID
     * @param _roundId Round ID
     * @return bettors Array of bettor addresses
     */
    function getRoundBettors(
        uint256 _marketId,
        uint256 _roundId
    ) external view returns (address[] memory bettors) {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        return rounds[_marketId][_roundId].bettors;
    }

    /**
     * @notice Get round outcome and final price
     * @param _marketId Market ID
     * @param _roundId Round ID
     * @return resolved Whether the round is resolved
     * @return outcome Round outcome (true = YES won, false = NO won)
     * @return finalPrice Final price used for resolution
     */
    function getRoundOutcome(
        uint256 _marketId,
        uint256 _roundId
    ) external view returns (bool resolved, bool outcome, uint256 finalPrice) {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        Round storage round = rounds[_marketId][_roundId];
        return (round.resolved, round.outcome, round.finalPrice);
    }

    // Admin functions

    /**
     * @notice Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(
        address _newTreasury
    ) external onlyRole(ADMIN_ROLE) {
        if (_newTreasury == address(0)) {
            revert InvalidTreasuryAddress();
        }

        address oldTreasury = treasury;
        treasury = _newTreasury;

        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @notice Update minimum bet amount
     * @param _newMinBetAmount New minimum bet amount
     */
    function updateMinBetAmount(
        uint256 _newMinBetAmount
    ) external onlyRole(ADMIN_ROLE) {
        uint256 oldAmount = minBetAmount;
        minBetAmount = _newMinBetAmount;

        emit MinBetAmountUpdated(oldAmount, _newMinBetAmount);
    }

    /**
     * @notice Withdraw collected protocol fees
     */
    function withdrawFees() external onlyRole(ADMIN_ROLE) {
        uint256 amount = totalFeesCollected;
        if (amount == 0) {
            revert InsufficientBalance();
        }

        totalFeesCollected = 0;

        emit FeesWithdrawn(treasury, amount);

        (bool success, ) = payable(treasury).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Internal functions

    function _addMarket(
        string memory _symbol,
        string memory _name,
        uint256 _minBetAmount
    ) internal {
        markets[nextMarketId] = Market({
            id: nextMarketId,
            symbol: _symbol,
            name: _name,
            isActive: true,
            minBetAmount: _minBetAmount,
            currentRoundId: 0
        });

        emit MarketAdded(nextMarketId, _symbol, _name, _minBetAmount);
        nextMarketId++;
    }

    function _startNewRound(uint256 _marketId, uint256 _priceTarget) internal {
        if (_priceTarget == 0) {
            revert InvalidPriceTarget();
        }

        Market storage market = markets[_marketId];
        market.currentRoundId++;

        Round storage round = rounds[_marketId][market.currentRoundId];
        round.marketId = _marketId;
        round.id = market.currentRoundId;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + ROUND_DURATION;
        round.priceTarget = _priceTarget;

        emit RoundStarted(
            _marketId,
            market.currentRoundId,
            round.startTime,
            round.endTime,
            _priceTarget
        );
    }

    function _resolveRoundWithPrice(
        uint256 _marketId,
        uint256 _roundId,
        uint256 _finalPrice
    ) internal {
        if (_marketId == 0 || _marketId >= nextMarketId) {
            revert InvalidMarketId();
        }

        Round storage round = rounds[_marketId][_roundId];

        if (_roundId == 0 || _roundId > markets[_marketId].currentRoundId) {
            revert InvalidRoundId();
        }

        if (round.resolved) {
            revert RoundAlreadyResolved();
        }

        if (block.timestamp < round.endTime) {
            revert RoundNotActive();
        }

        round.resolved = true;
        round.finalPrice = _finalPrice;
        round.outcome = _finalPrice >= round.priceTarget;

        uint256 totalPool = round.totalYes + round.totalNo;
        if (totalPool > 0) {
            uint256 protocolFee = (totalPool * PROTOCOL_FEE) / FEE_DENOMINATOR;
            totalFeesCollected += protocolFee;
        }

        emit RoundResolved(
            _marketId,
            _roundId,
            round.outcome,
            _finalPrice,
            round.totalYes,
            round.totalNo
        );
    }

    function _calculateWinnings(
        uint256 _marketId,
        uint256 _roundId,
        address _user
    ) internal view returns (uint256) {
        Round storage round = rounds[_marketId][_roundId];

        if (!round.resolved) {
            return 0;
        }

        Bet storage userBet = round.bets[_user];

        if (userBet.amount == 0 || userBet.prediction != round.outcome) {
            return 0;
        }

        uint256 totalPool = round.totalYes + round.totalNo;
        if (totalPool == 0) {
            return 0;
        }

        uint256 winningPool = round.outcome ? round.totalYes : round.totalNo;
        if (winningPool == 0) {
            return 0;
        }

        uint256 protocolFee = (totalPool * PROTOCOL_FEE) / FEE_DENOMINATOR;
        uint256 prizePool = totalPool - protocolFee;

        return (userBet.amount * prizePool) / winningPool;
    }

    /**
     * @notice Emergency function to recover stuck ETH
     * @dev Only callable by admin in emergency situations
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    receive() external payable {}
}
