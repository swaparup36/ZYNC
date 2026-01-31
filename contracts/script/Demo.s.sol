// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {StrategyVaultFactory} from "../src/StrategyVaultFactory.sol";
import {MockOracle} from "../test/mocks/MockOracle.sol";
import {MockTarget} from "../test/mocks/MockTarget.sol";

contract SmartVaultScript is Script {
    StrategyVault public strategyVault;
    StrategyVaultFactory public factory;
    MockTarget public target;
    MockOracle public oracle;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy factory with protocol treasury address
        address protocolTreasury = address(0x1234567890123456789012345678901234567890);
        factory = new StrategyVaultFactory(protocolTreasury);

        target = new MockTarget();
        oracle = new MockOracle();

        // Create vault through factory -> owner is msg.sender, feeRecipient is protocolTreasury
        address strategyVaultAddress = factory.createVault();
        strategyVault = StrategyVault(payable(strategyVaultAddress));

        // Allow action for the target contract
        strategyVault.allowAction(address(target), MockTarget.doThing.selector);

        // Set oracle price
        oracle.setAnswer(100);

        // Create a strategy
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA
        });
        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        // Recharge vault with execution balance -> fee is 0.0003 ether per execution
        strategyVault.recharge{value: 0.01 ether}();

        // Execute strategy - execution fee (0.0003 ETH) will be split 50/50:
        // - 0.00015 ETH to protocol treasury (feeRecipient)
        // - 0.00015 ETH to executor (msg.sender)
        strategyVault.executeStrategy(strategyId, abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether));

        vm.stopBroadcast();
    }
}
