// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Riskon.sol";

/**
 * @title DeployRiskon
 * @dev Deployment script for Riskon prediction market with Blocksense CL Aggregator
 */

// not being used currently
contract DeployRiskon is Script {
    function run() external {
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        console.log("=== Deploying Riskon ===");
        console.log("Treasury:", treasury);
        console.log("Network:", block.chainid);

        vm.startBroadcast();
        Riskon riskon = new Riskon(treasury);
        console.log("Riskon deployed at:", address(riskon));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
    }
}
