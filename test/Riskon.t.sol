// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Riskon} from "../src/Riskon.sol";

/**
 * @title RiskonBasic
 * @dev Basic tests for multi-market Riskon contract
 */
contract RiskonTest is Test {
    Riskon public riskon;

    address public admin = makeAddr("admin");
    address public treasury = makeAddr("treasury");
    address public user1 = makeAddr("user1");

    function setUp() public {
        vm.startPrank(admin);

        // Deploy Riskon contract
        riskon = new Riskon(treasury);

        vm.stopPrank();

        // Give users some ETH
        vm.deal(user1, 10 ether);
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
        assertEq(symbols[0], "STT/USDC");
        assertEq(symbols[1], "WBTC/USDC");
        assertEq(symbols[2], "SOL/USDC");
        assertEq(names[0], "Somnia Token");
        assertEq(names[1], "Wrapped Bitcoin");
        assertEq(names[2], "Solana");

        for (uint256 i = 0; i < isActiveList.length; i++) {
            assertTrue(isActiveList[i]);
        }
    }

    function testAddMarket() public {
        vm.prank(admin);
        riskon.addMarket("ETH/USDC", "Ethereum", 0.01 ether);

        (uint256[] memory marketIds, string[] memory symbols, , ) = riskon
            .getMarkets();

        assertEq(marketIds.length, 4);
        assertEq(symbols[3], "ETH/USDC");
    }

    function testStartNewRound() public {
        uint256 marketId = 1; // STT/USDC
        uint256 priceTarget = 250_00000000; // $250 with 8 decimals

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
        uint256 marketId = 1; // STT/USDC
        uint256 priceTarget = 250_00000000;
        uint256 betAmount = 0.1 ether;

        // Start a round
        vm.prank(admin);
        riskon.startNewRound(marketId, priceTarget);

        // Place a bet
        vm.prank(user1);
        riskon.placeBet{value: betAmount}(marketId, true);

        // Check bet was recorded
        (uint256 amount, bool prediction, bool claimed) = riskon.getUserBet(
            marketId,
            1,
            user1
        );
        assertEq(amount, betAmount);
        assertTrue(prediction);
        assertFalse(claimed);

        // Check round totals
        (, , , , uint256 totalYes, uint256 totalNo, ) = riskon
            .getCurrentRoundInfo(marketId);
        assertEq(totalYes, betAmount);
        assertEq(totalNo, 0);
    }
}
