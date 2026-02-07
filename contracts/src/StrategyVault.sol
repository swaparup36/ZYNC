// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IStrategyVaultFactory {
    function executionFee() external view returns (uint256);
}

contract StrategyVault {
    using SafeERC20 for IERC20;

    address public immutable owner;
    Strategy[] strategies;

    struct Strategy {
        Condition[] conditions;
        Action action;
        uint256 maxAmount;
        uint256 cooldown;
        uint256 lastExecution;
        uint256 expiry;
        bool paused;
        uint8 failureCount;
    }

    struct Condition {
        address oracle;
        Operator operator;
        uint256 value;
    }

    struct Action {
        address target;
        bytes4 selector;
        uint8 amountIndex;
        bool isPayable;
        AmountSource amountSource;
        uint256 value; // ETH to send when vault funds payable actions
        bytes data;
        Allowance[] allowances;
        Transfer[] transfers;
    }

    enum Operator {
        LT, // Less Than
        GT, // Greater Than
        EQ // Equal To
    }

    enum AmountSource {
        CALLDATA, // amount comes from calldata
        MSG_VALUE, // amount comes from msg.value
        NONE // no amount involved
    }

    struct Allowance {
        address token; // ERC20 token
        address spender; // contract that pulls tokens
        uint256 amount; // max allowance
    }

    struct Transfer {
        address token;      // ERC20 token (address(0) for ETH)
        address to;         // recipient
        uint256 amount;     // amount to transfer
    }

    mapping(address => mapping(bytes4 => bool)) allowedActions;
    uint8 MAX_FAILURES;
    address public immutable factory;
    // ETH hold for execution fees
    uint256 public executionBalance;
    address public feeRecipient;
    bool private _executing;

    constructor(address _owner, address _feeRecipient) {
        owner = _owner;
        feeRecipient = _feeRecipient;
        MAX_FAILURES = 3;
        factory = msg.sender;
    }

    event StrategyCreated(uint256 indexed strategyId);
    event ActionAllowed(address indexed target, bytes4 indexed selector);
    event ActionDisallowed(address indexed target, bytes4 indexed selector);
    event StrategyExecuted(uint256 indexed strategyId);
    event StrategyExecutionFailed(uint256 strategyId);
    event ETHDeposited(address indexed user, uint256 amount);
    event ETHWithdrawn(address indexed user, uint256 amount);
    event VaultRecharged(uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_executing, "Reentrancy");
        _executing = true;
        _;
        _executing = false;
    }

    function createStrategy(
        Condition[] calldata conditions,
        Action calldata action,
        uint256 maxAmount,
        uint256 cooldown,
        uint256 expiry
    ) external onlyOwner returns (uint256) {
        require(expiry > block.timestamp, "Expiry must be in the future");
        require(conditions.length > 0, "No conditions");
        require(maxAmount > 0, "Invalid maxAmount");
        require(action.target != address(0), "Invalid action target");
        require(action.selector != bytes4(0), "Invalid action selector");

        strategies.push();
        uint256 strategyId = strategies.length - 1;
        Strategy storage strategy = strategies[strategyId];

        for (uint256 i = 0; i < conditions.length; i++) {
            strategy.conditions.push(conditions[i]);
        }

        Action storage a = strategy.action;

        a.target = action.target;
        a.selector = action.selector;
        a.amountIndex = action.amountIndex;
        a.isPayable = action.isPayable;
        a.amountSource = action.amountSource;
        a.value = action.value;
        a.data = action.data;

        if (action.amountSource == AmountSource.MSG_VALUE) {
            require(action.isPayable, "Action must be payable");
        } else {
            require(action.value == 0, "ETH value only for payable actions");
        }

        for (uint256 i = 0; i < action.allowances.length; i++) {
            Allowance calldata al = action.allowances[i];

            require(al.token != address(0), "Invalid allowance token");
            require(al.spender != address(0), "Invalid allowance spender");
            require(al.amount > 0, "Invalid allowance amount");

            a.allowances.push(al);
        }

        for (uint256 i = 0; i < action.transfers.length; i++) {
            Transfer calldata t = action.transfers[i];

            require(t.to != address(0), "Invalid transfer to");
            require(t.amount > 0, "Invalid transfer amount");

            a.transfers.push(t);
        }


        strategy.maxAmount = maxAmount;
        strategy.cooldown = cooldown;
        strategy.lastExecution = 0;
        strategy.expiry = expiry;
        strategy.paused = false;
        strategy.failureCount = 0;

        emit StrategyCreated(strategyId);
        return strategyId;
    }

    function _ensureAllowances(Action storage action) internal {
        for (uint256 i = 0; i < action.allowances.length; i++) {
            Allowance storage al = action.allowances[i];

            uint256 current = IERC20(al.token).allowance(address(this), al.spender);
            if (current < al.amount) {
                IERC20(al.token).forceApprove(al.spender, al.amount);
            }
        }
    }

    function _executeTransfers(Transfer[] storage transfers) internal {
        for (uint256 i = 0; i < transfers.length; i++) {
            Transfer storage t = transfers[i];

            if (t.token == address(0)) {
                // ETH transfer
                (bool ok,) = payable(t.to).call{value: t.amount}("");
                require(ok, "ETH transfer failed");
            } else {
                IERC20(t.token).safeTransfer(t.to, t.amount);
            }
        }
    }

    function _readOracle(address oracle) internal view returns (uint256) {
        AggregatorV3Interface feed = AggregatorV3Interface(oracle);

        (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();

        require(answer > 0, "Invalid oracle answer");
        require(updatedAt != 0, "Stale oracle data");

        return uint256(answer);
    }

    function _checkConditions(uint256 strategyId) internal view returns (bool) {
        if (strategyId >= strategies.length) {
            return false;
        }

        Strategy storage strategy = strategies[strategyId];

        for (uint256 i = 0; i < strategy.conditions.length; i++) {
            Condition storage condition = strategy.conditions[i];
            uint256 oracleValue = _readOracle(condition.oracle);

            if (condition.operator == Operator.LT) {
                if (!(oracleValue < condition.value)) return false;
            } else if (condition.operator == Operator.GT) {
                if (!(oracleValue > condition.value)) return false;
            } else if (condition.operator == Operator.EQ) {
                if (!(oracleValue == condition.value)) return false;
            }
        }

        return true;
    }

    function _extractAmount(bytes calldata data, uint8 amountIndex) internal pure returns (uint256 amount) {
        uint256 offset = 4 + uint256(amountIndex) * 32;
        require(data.length >= offset + 32, "Arg out of bounds");

        assembly {
            amount := calldataload(add(data.offset, offset))
        }
    }

    function _extractAmountFromMemory(bytes memory data, uint8 amountIndex) internal pure returns (uint256 amount) {
        uint256 offset = 4 + uint256(amountIndex) * 32;
        require(data.length >= offset + 32, "Arg out of bounds");

        assembly {
            amount := mload(add(add(data, 32), offset))
        }
    }

    function canExecute(uint256 strategyId) external view returns (bool) {
        try this.simulateStrategy(strategyId) {
            return true;
        } catch {
            return false;
        }
    }

    function isActionAllowed(address target, bytes4 selector) external view returns (bool) {
        return allowedActions[target][selector];
    }

    function allowAction(address target, bytes4 selector) external onlyOwner {
        require(target != address(0), "Invalid target");
        require(selector != bytes4(0), "Invalid selector");

        allowedActions[target][selector] = true;

        emit ActionAllowed(target, selector);
    }

    function disallowAction(address target, bytes4 selector) external onlyOwner {
        require(target != address(0), "Invalid target");
        require(selector != bytes4(0), "Invalid selector");

        allowedActions[target][selector] = false;

        emit ActionDisallowed(target, selector);
    }

    function pauseStrategy(uint256 strategyId) external onlyOwner {
        require(strategyId < strategies.length, "Invalid strategy");
        strategies[strategyId].paused = true;
    }

    function _validateStrategy(uint256 strategyId) internal view {
        require(strategyId < strategies.length, "Invalid strategy");

        Strategy storage strategy = strategies[strategyId];
        Action storage action = strategy.action;

        require(!strategy.paused, "Strategy paused");
        require(block.timestamp < strategy.expiry, "Strategy expired");
        require(
            strategy.lastExecution == 0 || block.timestamp >= strategy.lastExecution + strategy.cooldown,
            "Cooldown active"
        );
        require(strategy.failureCount < MAX_FAILURES, "Strategy disabled");

        require(_checkConditions(strategyId), "Conditions not met");
        require(action.data.length >= 4, "Invalid calldata");

        bytes memory actionData = action.data;

        bytes4 selector;
        assembly {
            selector := mload(add(actionData, 32))
        }

        require(selector == action.selector, "Selector mismatch");
        require(allowedActions[action.target][action.selector], "Action not allowed");

        if (action.amountSource == AmountSource.CALLDATA) {
            uint256 amount = _extractAmountFromMemory(actionData, action.amountIndex);
            require(amount <= strategy.maxAmount, "Amount exceeds maxAmount");
        } else if (action.amountSource == AmountSource.MSG_VALUE) {
            require(action.isPayable, "Action not payable");

            uint256 amount = action.value;
            require(amount > 0, "ETH required");
            require(amount <= strategy.maxAmount, "ETH exceeds maxAmount");

            uint256 vaultBalance = address(this).balance;
            require(vaultBalance >= executionBalance, "Vault undercollateralized");
            require(vaultBalance - executionBalance >= amount, "Insufficient vault ETH");
        } else {
            // AmountSource.NONE -> nothing to validate
        }

        uint256 totalTransfer;

        for (uint256 i = 0; i < action.transfers.length; i++) {
            Transfer storage t = action.transfers[i];

            if (t.token != address(0)) {
                totalTransfer += t.amount;
            } else {
                totalTransfer += t.amount; // ETH
            }
        }

        require(totalTransfer <= strategy.maxAmount, "Transfers exceed maxAmount");
    }

    function simulateStrategy(uint256 strategyId) external view {
        uint256 executionFee = getExecutionFee();
        require(executionBalance >= executionFee, "Insufficient execution balance");
        _validateStrategy(strategyId);
    }

    function executeStrategy(uint256 strategyId) external payable nonReentrant {
        uint256 executionFee = getExecutionFee();
        require(executionBalance >= executionFee, "Insufficient execution balance");

        _validateStrategy(strategyId);

        Strategy storage strategy = strategies[strategyId];
        Action storage action = strategy.action;

        uint256 callValue = 0;

        if (action.amountSource == AmountSource.MSG_VALUE) {
            callValue = action.value;
        }

        _ensureAllowances(action);
        _executeTransfers(action.transfers);

        (bool success, bytes memory returndata) = action.target.call{value: callValue}(action.data);

        if (!success) {
            strategy.failureCount++;
            emit StrategyExecutionFailed(strategyId);
            
            if (returndata.length > 0) {
                assembly {
                    revert(add(returndata, 32), mload(returndata))
                }
            }
            revert("ACTION_CALL_FAILED");
        }

        strategy.lastExecution = block.timestamp;
        executionBalance -= executionFee;

        // 10 % to feeRecipient, 90% to executor
        (bool ok,) = payable(feeRecipient).call{value: executionFee / 10}("");
        require(ok, "Fee transfer failed");

        (ok,) = payable(msg.sender).call{value: (executionFee * 9) / 10}("");
        require(ok, "Executor fee transfer failed");

        strategy.failureCount = 0;
        emit StrategyExecuted(strategyId);
    }

    function depositETH() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
        emit ETHDeposited(msg.sender, msg.value);
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        require(amount > 0, "Invalid amount");
        require(address(this).balance - executionBalance >= amount, "Insufficient balance");

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit ETHWithdrawn(msg.sender, amount);
    }

    function recharge() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
        executionBalance += msg.value;
        emit VaultRecharged(msg.value);
    }

    function depositToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    receive() external payable {
        // Allow receiving ETH
    }

    function getStrategies() external view returns (Strategy[] memory) {
        return strategies;
    }

    function getStrategieCount() external view returns (uint256) {
        return strategies.length;
    }

    function getStrategy(uint256 strategyId) external view returns (Strategy memory) {
        require(strategyId < strategies.length, "Invalid strategy");
        return strategies[strategyId];
    }

    function getExecutionFee() public view returns (uint256) {
        return IStrategyVaultFactory(factory).executionFee();
    }
}
