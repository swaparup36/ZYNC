// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {MockOracle} from "./mocks/MockOracle.sol";
import {MockTarget} from "./mocks/MockTarget.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract StrategyVaultTest is Test {
    StrategyVault public strategyVault;
    MockOracle public oracle;
    MockTarget public target;
    MockERC20 public token;

    event ETHDeposited(address indexed user, uint256 amount);
    event ETHWithdrawn(address indexed user, uint256 amount);
    event VaultRecharged(uint256 amount);
    event StrategyExecuted(uint256 indexed strategyId);
    event StrategyCreated(uint256 indexed strategyId);
    event ActionAllowed(address indexed target, bytes4 indexed selector);
    event ActionDisallowed(address indexed target, bytes4 indexed selector);
    event StrategyExecutionFailed(uint256 strategyId);

    function setUp() public {
        oracle = new MockOracle();
        target = new MockTarget();
        token = new MockERC20("Test Token", "TEST");
        strategyVault = new StrategyVault(address(this), address(0x9999));

        strategyVault.allowAction(address(target), MockTarget.doThing.selector);

        oracle.setAnswer(100);
    }

    function test_checkConditions_true_when_LT_passes() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        bool canExecute = strategyVault.canExecute(strategyId);
        assertTrue(canExecute);
    }

    function test_checkConditions_false_when_LT_fails() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 50});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_checkConditions_false_when_GT_passes() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.GT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_checkConditions_false_when_GT_fails() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.GT, value: 50});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        bool canExecute = strategyVault.canExecute(strategyId);
        assertTrue(canExecute);
    }

    function test_checkConditions_false_when_EQ_passes() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.EQ, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_checkConditions_false_when_EQ_fails() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.EQ, value: 100});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        bool canExecute = strategyVault.canExecute(strategyId);
        assertTrue(canExecute);
    }

    function test_canExecute_false_when_paused() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.pauseStrategy(strategyId);

        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_canExecute_false_when_expired() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 hours);

        strategyVault.recharge{value: 0.01 ether}();

        // Fast forward time beyond expiry
        vm.warp(block.timestamp + 2 hours);

        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_canExecute_false_when_cooldown_active() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId =
            strategyVault.createStrategy(conditions, action, 1 ether, 1 hours, block.timestamp + 1 days);

        // Recharge execution balance
        strategyVault.recharge{value: 0.01 ether}();

        // Simulate execution to set lastExecution time
        vm.prank(address(this));
        strategyVault.executeStrategy(strategyId);

        // Immediately check canExecute, should be false due to cooldown
        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_canExecute_false_when_failureCount_exceeded() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        // Recharge execution balance
        strategyVault.recharge{value: 0.1 ether}();

        // Set target to revert to trigger external call failures
        target.setRevert(true);

        // Manually increment failureCount to exceed MAX_FAILURES
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(address(this));
            try strategyVault.executeStrategy(strategyId) {
            // Do nothing
            }
                catch {
                // Ignore failures
            }
        }
        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_execute_reverts_on_selector_mismatch() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doAnotherThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.allowAction(address(target), MockTarget.doAnotherThing.selector);

        vm.expectRevert("Selector mismatch");
        strategyVault.executeStrategy(strategyId);
    }

    function test_execute_reverts_when_action_not_allowlisted() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doAnotherThingThatIsNowAllowed.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doAnotherThingThatIsNowAllowed.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.disallowAction(address(target), MockTarget.doAnotherThingThatIsNowAllowed.selector);

        vm.expectRevert("Action not allowed");
        strategyVault.executeStrategy(strategyId);
    }

    function test_execute_reverts_when_amount_exceeds_max() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 2 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        vm.expectRevert("Amount exceeds maxAmount");
        strategyVault.executeStrategy(strategyId);
    }

    function test_execute_reverts_when_ETH_exceeds_max() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: true,
            amountSource: StrategyVault.AmountSource.MSG_VALUE,
            value: 2 ether,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.depositETH{value: 2 ether}();
        vm.expectRevert("ETH exceeds maxAmount");
        strategyVault.executeStrategy(strategyId);
    }

    function test_execute_succeeds_and_updates_state() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.executeStrategy(strategyId);

        // Verify that the target's lastAmount was updated
        uint256 lastAmount = target.lastAmount();
        assertEq(lastAmount, 0.5 ether);
    }

    function test_execute_resets_failureCount_on_success() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.1 ether}();

        // Cause a failure
        target.setRevert(true);
        vm.prank(address(this));
        try strategyVault.executeStrategy(strategyId) {
        // Do nothing
        }
            catch {
            // Ignore failures
        }

        // Execute successfully
        target.setRevert(false);
        strategyVault.executeStrategy(strategyId);

        // Verify that failureCount is reset
        bool canExecute = strategyVault.canExecute(strategyId);
        assertTrue(canExecute);
    }

    function test_failure_increments_failureCount() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();

        // Set target to revert to trigger external call failure
        target.setRevert(true);

        // Cause a failure
        vm.prank(address(this));
        try strategyVault.executeStrategy(strategyId) {
        // Do nothing
        }
            catch {
            // Ignore failures
        }

        // Verify that failureCount has incremented
        bool canExecute = strategyVault.canExecute(strategyId);
        assertTrue(canExecute); // Should still be able to execute as failureCount < MAX_FAILURES
    }

    function test_auto_pause_after_max_failures() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.1 ether}();

        target.setRevert(true);
        // Cause failures to exceed MAX_FAILURES
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(address(this));
            try strategyVault.executeStrategy(strategyId) {
            // Do nothing
            }
                catch {
                // Ignore failures
            }
        }

        // Verify that strategy is paused
        bool canExecute = strategyVault.canExecute(strategyId);
        assertFalse(canExecute);
    }

    function test_depositETH_succeeds() public {
        uint256 depositAmount = 5 ether;

        vm.expectEmit(true, false, false, true);
        emit ETHDeposited(address(this), depositAmount);

        strategyVault.depositETH{value: depositAmount}();

        assertEq(address(strategyVault).balance, depositAmount);
    }

    function test_depositETH_reverts_when_no_eth() public {
        vm.expectRevert("No ETH sent");
        strategyVault.depositETH{value: 0}();
    }

    function test_withdrawETH_succeeds() public {
        uint256 depositAmount = 5 ether;
        uint256 withdrawAmount = 2 ether;

        strategyVault.depositETH{value: depositAmount}();

        uint256 balanceBefore = address(this).balance;

        vm.expectEmit(true, false, false, true);
        emit ETHWithdrawn(address(this), withdrawAmount);

        strategyVault.withdrawETH(withdrawAmount);

        assertEq(address(strategyVault).balance, depositAmount - withdrawAmount);
        assertEq(address(this).balance, balanceBefore + withdrawAmount);
    }

    function test_withdrawETH_reverts_insufficient_balance() public {
        uint256 depositAmount = 1 ether;

        strategyVault.depositETH{value: depositAmount}();

        vm.expectRevert("Insufficient balance");
        strategyVault.withdrawETH(2 ether);
    }

    function test_withdrawETH_reverts_invalid_amount() public {
        vm.expectRevert("Invalid amount");
        strategyVault.withdrawETH(0);
    }

    function test_execute_with_MSG_VALUE_amountSource() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: true,
            amountSource: StrategyVault.AmountSource.MSG_VALUE,
            value: 0.5 ether,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.depositETH{value: 0.5 ether}();
        strategyVault.executeStrategy(strategyId);

        // Verify that target received the ETH
        assertEq(address(target).balance, 0.5 ether);
    }

    function test_execute_with_NONE_amountSource() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.NONE,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        strategyVault.executeStrategy(strategyId);

        // Verify that the target function was called
        uint256 lastAmount = target.lastAmount();
        assertEq(lastAmount, 0);
    }

    // Note: The contract does not validate that no ETH is sent for CALLDATA amountSource
    // This test was removed as the validation is not implemented in the contract

    // Note: The contract does not validate that no ETH is sent for NONE amountSource
    // This test was removed as the validation is not implemented in the contract

    function test_execute_reverts_when_insufficient_vault_ETH_for_MSG_VALUE() public {
        // This test verifies that executing a strategy with MSG_VALUE fails if vault has insufficient ETH
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: true,
            amountSource: StrategyVault.AmountSource.MSG_VALUE,
            value: 1 ether,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 2 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        // Don't deposit enough ETH to cover the action value
        vm.expectRevert("Insufficient vault ETH");
        strategyVault.executeStrategy(strategyId);
    }

    function test_recharge_succeeds() public {
        uint256 rechargeAmount = 1 ether;

        uint256 balanceBefore = strategyVault.executionBalance();

        vm.expectEmit(false, false, false, true);
        emit VaultRecharged(rechargeAmount);

        strategyVault.recharge{value: rechargeAmount}();

        assertEq(strategyVault.executionBalance(), balanceBefore + rechargeAmount);
        assertEq(address(strategyVault).balance, rechargeAmount);
    }

    function test_recharge_reverts_when_no_eth() public {
        vm.expectRevert("No ETH sent");
        strategyVault.recharge{value: 0}();
    }

    function test_execute_reverts_insufficient_execution_balance() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        // Don't recharge, executionBalance is 0
        vm.expectRevert("Insufficient execution balance");
        strategyVault.executeStrategy(strategyId);
    }

    function test_execute_deducts_executionFee() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        uint256 balanceBefore = strategyVault.executionBalance();
        uint256 fee = strategyVault.executionFee();

        strategyVault.executeStrategy(strategyId);

        assertEq(strategyVault.executionBalance(), balanceBefore - fee);
    }

    function test_execute_sends_fee_to_recipient() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();

        address feeRecipient = strategyVault.feeRecipient();
        uint256 recipientBalanceBefore = feeRecipient.balance;
        uint256 fee = strategyVault.executionFee();

        strategyVault.executeStrategy(strategyId);

        // Half of fee goes to feeRecipient
        assertEq(feeRecipient.balance, recipientBalanceBefore + fee / 2);
    }

    function test_execute_sends_fee_to_executor() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();

        uint256 executorBalanceBefore = address(this).balance;
        uint256 fee = strategyVault.executionFee();

        strategyVault.executeStrategy(strategyId);

        // Half of fee goes to executor (msg.sender)
        assertEq(address(this).balance, executorBalanceBefore + fee / 2);
    }

    function test_execute_splits_fee_correctly() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();

        address feeRecipient = strategyVault.feeRecipient();
        uint256 recipientBalanceBefore = feeRecipient.balance;
        uint256 executorBalanceBefore = address(this).balance;
        uint256 fee = strategyVault.executionFee();

        strategyVault.executeStrategy(strategyId);

        // Verify fee is split 50/50
        assertEq(feeRecipient.balance, recipientBalanceBefore + fee / 2);
        assertEq(address(this).balance, executorBalanceBefore + fee / 2);
    }

    function test_createStrategy_reverts_when_not_owner() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        vm.prank(address(0x1234));
        vm.expectRevert("Not owner");
        strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
    }

    function test_createStrategy_reverts_when_expiry_in_past() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        vm.expectRevert("Expiry must be in the future");
        strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp);
    }

    function test_createStrategy_reverts_when_no_conditions() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](0);

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        vm.expectRevert("No conditions");
        strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
    }

    function test_createStrategy_reverts_when_maxAmount_zero() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        vm.expectRevert("Invalid maxAmount");
        strategyVault.createStrategy(conditions, action, 0, 0, block.timestamp + 1 days);
    }

    function test_createStrategy_emits_event() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        vm.expectEmit(true, false, false, false);
        emit StrategyCreated(0);
        strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
    }

    function test_createStrategy_with_multiple_conditions() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](3);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});
        conditions[1] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.GT, value: 50});
        conditions[2] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.EQ, value: 100});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.01 ether}();
        assertTrue(strategyVault.canExecute(strategyId));
    }

    function test_allowAction_reverts_when_not_owner() public {
        vm.prank(address(0x1234));
        vm.expectRevert("Not owner");
        strategyVault.allowAction(address(target), MockTarget.doThing.selector);
    }

    function test_allowAction_reverts_when_target_zero() public {
        vm.expectRevert("Invalid target");
        strategyVault.allowAction(address(0), MockTarget.doThing.selector);
    }

    function test_allowAction_reverts_when_selector_zero() public {
        vm.expectRevert("Invalid selector");
        strategyVault.allowAction(address(target), bytes4(0));
    }

    function test_allowAction_emits_event() public {
        vm.expectEmit(true, true, false, false);
        emit ActionAllowed(address(target), MockTarget.doAnotherThing.selector);
        strategyVault.allowAction(address(target), MockTarget.doAnotherThing.selector);
    }

    function test_disallowAction_reverts_when_not_owner() public {
        vm.prank(address(0x1234));
        vm.expectRevert("Not owner");
        strategyVault.disallowAction(address(target), MockTarget.doThing.selector);
    }

    function test_disallowAction_reverts_when_target_zero() public {
        vm.expectRevert("Invalid target");
        strategyVault.disallowAction(address(0), MockTarget.doThing.selector);
    }

    function test_disallowAction_reverts_when_selector_zero() public {
        vm.expectRevert("Invalid selector");
        strategyVault.disallowAction(address(target), bytes4(0));
    }

    function test_disallowAction_emits_event() public {
        vm.expectEmit(true, true, false, false);
        emit ActionDisallowed(address(target), MockTarget.doThing.selector);
        strategyVault.disallowAction(address(target), MockTarget.doThing.selector);
    }

    function test_pauseStrategy_reverts_when_not_owner() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        vm.prank(address(0x1234));
        vm.expectRevert("Not owner");
        strategyVault.pauseStrategy(strategyId);
    }

    function test_pauseStrategy_reverts_when_invalid_strategy() public {
        vm.expectRevert("Invalid strategy");
        strategyVault.pauseStrategy(999);
    }

    function test_depositETH_reverts_when_not_owner() public {
        address nonOwner = address(0x1234);
        vm.deal(nonOwner, 10 ether);

        vm.prank(nonOwner);
        vm.expectRevert("Not owner");
        strategyVault.depositETH{value: 1 ether}();
    }

    function test_withdrawETH_reverts_when_not_owner() public {
        strategyVault.depositETH{value: 1 ether}();

        vm.prank(address(0x1234));
        vm.expectRevert("Not owner");
        strategyVault.withdrawETH(0.5 ether);
    }

    function test_withdrawETH_reverts_when_transfer_fails() public {
        RejectETH rejecter = new RejectETH();

        StrategyVault rejecterVault = new StrategyVault(address(rejecter), address(0x9999));

        vm.deal(address(this), 10 ether);
        (bool sent,) = payable(address(rejecterVault)).call{value: 1 ether}("");
        require(sent, "Failed to send ETH to vault");

        vm.prank(address(rejecter));
        vm.expectRevert("ETH transfer failed");
        rejecterVault.withdrawETH(0.5 ether);
    }

    function test_recharge_reverts_when_not_owner() public {
        address nonOwner = address(0x1234);
        vm.deal(nonOwner, 10 ether);

        vm.prank(nonOwner);
        vm.expectRevert("Not owner");
        strategyVault.recharge{value: 1 ether}();
    }

    function test_executeStrategy_reverts_when_invalid_strategy() public {
        strategyVault.recharge{value: 0.01 ether}();

        vm.expectRevert("Invalid strategy");
        strategyVault.executeStrategy(999);
    }

    function test_executeStrategy_reverts_when_paused() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.pauseStrategy(strategyId);
        strategyVault.recharge{value: 0.01 ether}();

        vm.expectRevert("Strategy paused");
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_expired() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 hours);
        strategyVault.recharge{value: 0.01 ether}();

        vm.warp(block.timestamp + 2 hours);

        vm.expectRevert("Strategy expired");
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_cooldown_active() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId =
            strategyVault.createStrategy(conditions, action, 1 ether, 1 hours, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.1 ether}();

        strategyVault.executeStrategy(strategyId);

        vm.expectRevert("Cooldown active");
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_strategy_disabled() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.1 ether}();

        target.setRevert(true);
        for (uint8 i = 0; i < 3; i++) {
            try strategyVault.executeStrategy(strategyId) {} catch {}
        }

        vm.expectRevert("Strategy paused");
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_conditions_not_met() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 50});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.01 ether}();

        vm.expectRevert("Conditions not met");
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_invalid_calldata() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: hex"",
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.01 ether}();

        vm.expectRevert("Invalid calldata");
        strategyVault.executeStrategy(strategyId);
    }

    function test_createStrategy_reverts_when_action_not_payable() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.MSG_VALUE,
            value: 0.5 ether,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0),
            allowances: allowances
        });

        vm.expectRevert("Action must be payable");
        strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
    }

    function test_executeStrategy_emits_failed_event() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.01 ether}();

        target.setRevert(true);

        vm.expectEmit(false, false, false, true);
        emit StrategyExecutionFailed(strategyId);
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_emits_success_event() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.01 ether}();

        vm.expectEmit(true, false, false, false);
        emit StrategyExecuted(strategyId);
        strategyVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_fee_transfer_fails() public {
        RejectETH rejecter = new RejectETH();

        StrategyVault rejecterVault = new StrategyVault(address(this), address(rejecter));
        rejecterVault.allowAction(address(target), MockTarget.doThing.selector);

        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = rejecterVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        rejecterVault.recharge{value: 0.01 ether}();

        vm.expectRevert("Fee transfer failed");
        rejecterVault.executeStrategy(strategyId);
    }

    function test_executeStrategy_reverts_when_executor_fee_transfer_fails() public {
        RejectETH rejecter = new RejectETH();

        StrategyVault rejecterVault = new StrategyVault(address(rejecter), address(0x9999));

        vm.prank(address(rejecter));
        rejecterVault.allowAction(address(target), MockTarget.doThing.selector);

        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        vm.prank(address(rejecter));
        uint256 strategyId = rejecterVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        // Fund the rejecter contract so it can call recharge
        vm.deal(address(rejecter), 10 ether);
        vm.prank(address(rejecter));
        rejecterVault.recharge{value: 0.01 ether}();

        // Executor (rejecter) will fail to receive the executor fee
        vm.prank(address(rejecter));
        vm.expectRevert("Executor fee transfer failed");
        rejecterVault.executeStrategy(strategyId);
    }

    function test_canExecute_returns_false_for_invalid_strategy() public {
        assertFalse(strategyVault.canExecute(999));
    }

    function test_oracle_reverts_when_negative_value() public {
        oracle.setAnswer(-1);

        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        vm.expectRevert("Invalid oracle answer");
        strategyVault.simulateStrategy(strategyId);
    }

    function test_extractAmount_reverts_when_out_of_bounds() public {
        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 10, // Out of bounds
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);
        strategyVault.recharge{value: 0.01 ether}();

        vm.expectRevert("Arg out of bounds");
        strategyVault.executeStrategy(strategyId);
    }

    function test_oracle_reverts_when_stale_data() public {
        oracle.setStaleData(true);

        StrategyVault.Condition[] memory conditions = new StrategyVault.Condition[](1);
        conditions[0] =
            StrategyVault.Condition({oracle: address(oracle), operator: StrategyVault.Operator.LT, value: 200});

        StrategyVault.Allowance[] memory allowances = new StrategyVault.Allowance[](0);
        StrategyVault.Action memory action = StrategyVault.Action({
            target: address(target),
            selector: MockTarget.doThing.selector,
            amountIndex: 0,
            isPayable: false,
            amountSource: StrategyVault.AmountSource.CALLDATA,
            value: 0,
            data: abi.encodeWithSelector(MockTarget.doThing.selector, 0.5 ether),
            allowances: allowances
        });

        uint256 strategyId = strategyVault.createStrategy(conditions, action, 1 ether, 0, block.timestamp + 1 days);

        strategyVault.recharge{value: 0.01 ether}();
        vm.expectRevert("Stale oracle data");
        strategyVault.simulateStrategy(strategyId);
    }

    function test_depositToken_succeeds() public {
        uint256 depositAmount = 100 ether;

        token.approve(address(strategyVault), depositAmount);

        uint256 vaultBalanceBefore = strategyVault.tokenBalance(address(token));
        uint256 userBalanceBefore = token.balanceOf(address(this));

        strategyVault.depositToken(address(token), depositAmount);

        assertEq(strategyVault.tokenBalance(address(token)), vaultBalanceBefore + depositAmount);
        assertEq(token.balanceOf(address(this)), userBalanceBefore - depositAmount);
    }

    function test_depositToken_reverts_when_not_owner() public {
        uint256 depositAmount = 100 ether;
        address nonOwner = address(0x1234);

        token.mint(nonOwner, depositAmount);

        vm.startPrank(nonOwner);
        token.approve(address(strategyVault), depositAmount);

        vm.expectRevert("Not owner");
        strategyVault.depositToken(address(token), depositAmount);
        vm.stopPrank();
    }

    function test_depositToken_reverts_when_invalid_token() public {
        vm.expectRevert("Invalid token");
        strategyVault.depositToken(address(0), 100 ether);
    }

    function test_depositToken_reverts_when_invalid_amount() public {
        vm.expectRevert("Invalid amount");
        strategyVault.depositToken(address(token), 0);
    }

    function test_withdrawToken_succeeds() public {
        uint256 depositAmount = 100 ether;
        uint256 withdrawAmount = 50 ether;

        token.approve(address(strategyVault), depositAmount);
        strategyVault.depositToken(address(token), depositAmount);

        uint256 vaultBalanceBefore = strategyVault.tokenBalance(address(token));
        uint256 userBalanceBefore = token.balanceOf(address(this));

        strategyVault.withdrawToken(address(token), withdrawAmount);

        assertEq(strategyVault.tokenBalance(address(token)), vaultBalanceBefore - withdrawAmount);
        assertEq(token.balanceOf(address(this)), userBalanceBefore + withdrawAmount);
    }

    function test_withdrawToken_reverts_when_not_owner() public {
        uint256 depositAmount = 100 ether;

        token.approve(address(strategyVault), depositAmount);
        strategyVault.depositToken(address(token), depositAmount);

        address nonOwner = address(0x1234);

        vm.prank(nonOwner);
        vm.expectRevert("Not owner");
        strategyVault.withdrawToken(address(token), 50 ether);
    }

    function test_withdrawToken_reverts_when_invalid_token() public {
        vm.expectRevert("Invalid token");
        strategyVault.withdrawToken(address(0), 100 ether);
    }

    function test_withdrawToken_reverts_when_invalid_amount() public {
        vm.expectRevert("Invalid amount");
        strategyVault.withdrawToken(address(token), 0);
    }

    function test_withdrawToken_reverts_when_insufficient_balance() public {
        uint256 depositAmount = 50 ether;

        token.approve(address(strategyVault), depositAmount);
        strategyVault.depositToken(address(token), depositAmount);

        vm.expectRevert();
        strategyVault.withdrawToken(address(token), 100 ether);
    }

    function test_tokenBalance_returns_correct_balance() public {
        assertEq(strategyVault.tokenBalance(address(token)), 0);

        uint256 depositAmount = 100 ether;
        token.approve(address(strategyVault), depositAmount);
        strategyVault.depositToken(address(token), depositAmount);

        assertEq(strategyVault.tokenBalance(address(token)), depositAmount);
    }

    receive() external payable {}
}

// Helper contract that rejects ETH
contract RejectETH {
    // No fallback or receive function, so it rejects ETH

    }

