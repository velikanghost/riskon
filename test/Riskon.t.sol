// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Riskon} from "../src/Riskon.sol";

/**
 * @title RiskonTest
 * @dev Comprehensive tests for multi-market Riskon contract with odds-based betting
 */
contract RiskonTest is Test {
    Riskon public riskon;

    address public admin = makeAddr("admin");
    address public treasury = makeAddr("treasury");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");

    function setUp() public {
        vm.startPrank(admin);

        // Deploy Riskon contract
        riskon = new Riskon(treasury);

        vm.stopPrank();

        // Give users some ETH
        vm.deal(user1, 20 ether);
        vm.deal(user2, 20 ether);
        vm.deal(user3, 20 ether);
    }

    function testInitialMarkets() public view {
        // Test that initial markets were created
        (
            uint256[] memory marketIds,
            string[] memory symbols,
            string[] memory names,
            bool[] memory isActiveList
        ) = riskon.getMarkets();

        assertEq(marketIds.length, 3);
        assertEq(symbols[0], "BTC/USD");
        assertEq(symbols[1], "ETH/USD");
        assertEq(symbols[2], "SOL/USD");
        assertEq(names[0], "Bitcoin");
        assertEq(names[1], "Ethereum");
        assertEq(names[2], "Solana");

        for (uint256 i = 0; i < isActiveList.length; i++) {
            assertTrue(isActiveList[i]);
        }
    }

    function testAddMarket() public {
        vm.prank(admin);
        riskon.addMarket("ADA/USD", "Cardano", 0.01 ether);

        (uint256[] memory marketIds, string[] memory symbols, , ) = riskon
            .getMarkets();

        assertEq(marketIds.length, 4);
        assertEq(symbols[3], "ADA/USD");
    }

    function testStartNewRound() public {
        uint256 marketId = 1; // BTC/USD
        uint256 priceTarget = 50000_00000000; // $50,000 with 8 decimals

        vm.prank(admin);
        riskon.startNewRound(marketId, priceTarget);

        (
            uint256 id,
            uint256 startTime,
            uint256 endTime,
            uint256 target,
            uint256 totalYes,
            uint256 totalNo,
            bool resolved
        ) = riskon.getCurrentRoundInfo(marketId);

        assertEq(id, 1);
        assertEq(target, priceTarget);
        assertEq(totalYes, 0);
        assertEq(totalNo, 0);
        assertFalse(resolved);
        assertGt(endTime, startTime);
    }

    function testPlaceBet() public {
        uint256 marketId = 1; // BTC/USD
        uint256 priceTarget = 50000_00000000;
        uint256 betAmount = 0.1 ether;

        // Start a round
        vm.prank(admin);
        riskon.startNewRound(marketId, priceTarget);

        // Place a bet
        vm.prank(user1);
        riskon.placeBet{value: betAmount}(marketId, true);

        // Check bet was recorded
        (
            uint256 amount,
            bool prediction,
            bool claimed,
            uint256 odds,
            uint256 timestamp
        ) = riskon.getUserBet(marketId, 1, user1);
        assertEq(amount, betAmount);
        assertTrue(prediction);
        assertFalse(claimed);
        assertGt(odds, 0); // Should have odds
        assertGt(timestamp, 0); // Should have timestamp

        // Check round totals
        (, , , , uint256 totalYes, uint256 totalNo, ) = riskon
            .getCurrentRoundInfo(marketId);
        assertEq(totalYes, betAmount);
        assertEq(totalNo, 0);
    }

    // ===== ODDS CALCULATION TESTS =====

    function testCalculateOdds_EmptyPool() public {
        uint256 odds = riskon.calculateOdds(0, 0, true);
        assertEq(odds, 2 * 1e18); // Should return 2.0x for empty pool
    }

    function testCalculateOdds_BalancedPool() public {
        uint256 yesOdds = riskon.calculateOdds(50 ether, 50 ether, true);
        uint256 noOdds = riskon.calculateOdds(50 ether, 50 ether, false);

        assertEq(yesOdds, 2 * 1e18); // 2.0x
        assertEq(noOdds, 2 * 1e18); // 2.0x
    }

    function testCalculateOdds_UnbalancedPool() public {
        uint256 yesOdds = riskon.calculateOdds(20 ether, 80 ether, true);
        uint256 noOdds = riskon.calculateOdds(20 ether, 80 ether, false);

        assertEq(yesOdds, 5 * 1e18); // 5.0x (underdog) - 100/20
        assertEq(noOdds, 125 * 1e17); // 1.25x (favorite) - 100/80
    }

    function testCalculateOdds_ExtremeUnbalance() public {
        uint256 yesOdds = riskon.calculateOdds(5 ether, 95 ether, true);
        uint256 noOdds = riskon.calculateOdds(5 ether, 95 ether, false);

        assertEq(yesOdds, 20 * 1e18); // 20.0x (very high odds)
        assertEq(noOdds, 1052631578947368421); // ~1.05x (very low odds)
    }

    function testOddsBounds() public {
        // Test maximum odds (100x) - when one side dominates
        uint256 odds = riskon.calculateOdds(100 ether, 1 wei, false);
        assertEq(odds, 100 * 1e18); // Should be clamped to 100x maximum

        // Test maximum odds (100x) - when one side is very small
        odds = riskon.calculateOdds(1 wei, 100 ether, true);
        assertEq(odds, 100 * 1e18); // Should be clamped to 100x maximum
    }

    // ===== ODDS INTEGRATION TESTS =====

    function testPlaceBetWithOdds() public {
        vm.startPrank(admin);
        riskon.startNewRound(1, 50000 * 1e8); // $50,000 target
        vm.stopPrank();

        // First bet on YES
        vm.prank(user1);
        riskon.placeBet{value: 10 ether}(1, true);

        // Check odds after first bet
        (uint256 yesOdds, uint256 noOdds) = riskon.getCurrentOdds(1);
        assertEq(yesOdds, 1 * 1e18); // 1.0x for first bet (10/10)
        assertEq(noOdds, 2 * 1e18); // 2.0x for empty side

        // Second bet on NO
        vm.prank(user2);
        riskon.placeBet{value: 20 ether}(1, false);

        // Check updated odds
        (yesOdds, noOdds) = riskon.getCurrentOdds(1);
        assertEq(yesOdds, 3 * 1e18); // 3.0x (30/10)
        assertEq(noOdds, 15 * 1e17); // 1.5x (30/20)
    }

    function testOddsChangeWithBets() public {
        vm.startPrank(admin);
        riskon.startNewRound(1, 50000 * 1e8);
        vm.stopPrank();

        // Initial odds should be 2.0x for both sides
        (uint256 yesOdds, uint256 noOdds) = riskon.getCurrentOdds(1);
        assertEq(yesOdds, 2 * 1e18);
        assertEq(noOdds, 2 * 1e18);

        // Bet on YES
        vm.prank(user1);
        riskon.placeBet{value: 10 ether}(1, true);

        // YES odds should decrease, NO odds should increase
        (yesOdds, noOdds) = riskon.getCurrentOdds(1);
        assertEq(yesOdds, 1 * 1e18); // 1.0x (10/10)
        assertEq(noOdds, 2 * 1e18); // 2.0x (10/0)

        // Bet on NO
        vm.prank(user2);
        riskon.placeBet{value: 20 ether}(1, false);

        // YES odds should increase, NO odds should decrease
        (yesOdds, noOdds) = riskon.getCurrentOdds(1);
        assertEq(yesOdds, 3 * 1e18); // 3.0x (30/10)
        assertEq(noOdds, 15 * 1e17); // 1.5x (30/20)
    }

    // ===== WINNINGS CALCULATION TESTS =====

    function testWinningsCalculation() public {
        vm.startPrank(admin);
        riskon.startNewRound(1, 50000 * 1e8);
        vm.stopPrank();

        // User1 bets 10 STT on YES at 2.0x odds
        vm.prank(user1);
        riskon.placeBet{value: 10 ether}(1, true);

        // User2 bets 20 STT on NO at 2.0x odds
        vm.prank(user2);
        riskon.placeBet{value: 20 ether}(1, false);

        // Fast forward time to end the round
        vm.warp(block.timestamp + 6 minutes);

        // Resolve round with YES winning
        vm.startPrank(admin);
        riskon.resolveRoundWithPrice(1, 1, 60000 * 1e8); // $60,000 final price
        vm.stopPrank();

        // User1 should win 20 STT (10 * 2.0x) minus 2% fee = 19.6 STT
        uint256 winnings = riskon.calculateWinnings(1, 1, user1);
        assertEq(winnings, 196 * 1e17); // 19.6 STT

        // User2 should win nothing (wrong prediction)
        winnings = riskon.calculateWinnings(1, 1, user2);
        assertEq(winnings, 0);
    }

    function testWinningsWithDifferentOdds() public {
        vm.startPrank(admin);
        riskon.startNewRound(1, 50000 * 1e8);
        vm.stopPrank();

        // User1 bets 10 STT on YES (gets 2.0x odds)
        vm.prank(user1);
        riskon.placeBet{value: 10 ether}(1, true);

        // User2 bets 20 STT on NO (gets 1.25x odds)
        vm.prank(user2);
        riskon.placeBet{value: 20 ether}(1, false);

        // User3 bets 5 STT on YES (gets 5.5x odds)
        vm.prank(user3);
        riskon.placeBet{value: 5 ether}(1, true);

        // Fast forward time to end the round
        vm.warp(block.timestamp + 6 minutes);

        // Resolve round with YES winning
        vm.startPrank(admin);
        riskon.resolveRoundWithPrice(1, 1, 60000 * 1e8);
        vm.stopPrank();

        // User1 should win: 10 * 2.0x = 20 STT minus 2% fee = 19.6 STT
        uint256 winnings = riskon.calculateWinnings(1, 1, user1);
        assertEq(winnings, 196 * 1e17);

        // User3 should win: 5 * 3.0x = 15 STT minus 2% fee = 14.7 STT
        winnings = riskon.calculateWinnings(1, 1, user3);
        assertEq(winnings, 147 * 1e17);

        // User2 should win nothing (wrong prediction)
        winnings = riskon.calculateWinnings(1, 1, user2);
        assertEq(winnings, 0);
    }

    // ===== EDGE CASES =====

    function testMultipleBetsSameUser() public {
        vm.startPrank(admin);
        riskon.startNewRound(1, 50000 * 1e8);
        vm.stopPrank();

        // User1 places multiple bets
        vm.startPrank(user1);
        riskon.placeBet{value: 5 ether}(1, true);
        riskon.placeBet{value: 5 ether}(1, true);
        vm.stopPrank();

        // Check that bet was recorded correctly
        (
            uint256 amount,
            bool prediction,
            bool claimed,
            uint256 odds,
            uint256 timestamp
        ) = riskon.getUserBet(1, 1, user1);
        assertEq(amount, 10 ether);
        assertTrue(prediction);
        assertFalse(claimed);
        assertGt(odds, 0); // Should have odds
        assertGt(timestamp, 0); // Should have timestamp
    }

    function testClaimWinnings() public {
        vm.startPrank(admin);
        riskon.startNewRound(1, 50000 * 1e8);
        vm.stopPrank();

        // User1 bets and wins
        vm.prank(user1);
        riskon.placeBet{value: 10 ether}(1, true);

        // Fast forward and resolve
        vm.warp(block.timestamp + 6 minutes);
        vm.startPrank(admin);
        riskon.resolveRoundWithPrice(1, 1, 60000 * 1e8);
        vm.stopPrank();

        // Check winnings calculation
        uint256 winnings = riskon.calculateWinnings(1, 1, user1);
        assertGt(winnings, 0);

        // Check that bet is not claimed yet
        (, , bool claimed, , ) = riskon.getUserBet(1, 1, user1);
        assertFalse(claimed);
    }
}
