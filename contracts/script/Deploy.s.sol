// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {StrategyVaultFactory} from "../src/StrategyVaultFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envOr("TREASURY_ADDRESS", vm.addr(deployerPrivateKey));
        
        console.log("Deploying StrategyVaultFactory...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Treasury:", treasury);
        
        // Deploy the StrategyVaultFactory contract
        vm.startBroadcast(deployerPrivateKey);
        
        StrategyVaultFactory factory = new StrategyVaultFactory(treasury);
        
        vm.stopBroadcast();
        
        console.log("StrategyVaultFactory deployed at:", address(factory));
        console.log("Protocol Owner:", factory.protocolOwner());
        console.log("Protocol Treasury:", factory.protocolTreasury());
    }
}
