// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

using SafeERC20 for IERC20;

contract StrategyVault {
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

    mapping(address => mapping(bytes4 => bool)) allowedActions;
    uint8 MAX_FAILURES;
    uint256 public executionFee; // e.g. 0.001 ETH
    // ETH hold for execution fees
    uint256 public executionBalance;
    address public feeRecipient;
    bool private _executing;

    constructor(address _owner, address _feeRecipient) {
        owner = _owner;
        feeRecipient = _feeRecipient;
        MAX_FAILURES = 3;
        executionFee = 0.0003 ether; // Default execution fee
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

        strategies.push();
        uint256 strategyId = strategies.length - 1;
        Strategy storage strategy = strategies[strategyId];

        for (uint256 i = 0; i < conditions.length; i++) {
            strategy.conditions.push(conditions[i]);
        }

        strategy.action = action;

        if (action.amountSource == AmountSource.MSG_VALUE) {
            // Allow value to be 0 or greater - will be validated at execution time
        } else {
            require(action.value == 0, "ETH value reserved for payable actions");
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

    function _extractAmountFromStorage(bytes storage data, uint8 amountIndex) internal view returns (uint256 amount) {
        uint256 offset = 4 + uint256(amountIndex) * 32;
        require(data.length >= offset + 32, "Arg out of bounds");

        assembly {
            let dataSlot := data.slot
        }

        bytes memory dataMem = data;
        assembly {
            amount := mload(add(add(dataMem, 0x20), offset))
        }
    }

    function canExecute(uint256 strategyId) public view returns (bool) {
        if (strategyId >= strategies.length) {
            return false;
        }

        Strategy storage strategy = strategies[strategyId];

        if (strategy.paused) return false;
        if (block.timestamp >= strategy.expiry) return false;
        if (strategy.lastExecution > 0 && block.timestamp < strategy.lastExecution + strategy.cooldown) return false;
        if (strategy.failureCount >= MAX_FAILURES) return false;

        return _checkConditions(strategyId);
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

    function executeStrategy(uint256 strategyId) external payable nonReentrant {
        require(executionBalance >= executionFee, "Insufficient execution balance");
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

        bytes4 selector;
        bytes memory actionData = action.data;
        assembly {
            selector := mload(add(actionData, 32))
        }

        require(selector == strategy.action.selector, "Selector mismatch");
        require(allowedActions[strategy.action.target][strategy.action.selector], "Action not allowed");

        uint256 amount = 0;
        uint256 callValue = 0;

        if (strategy.action.amountSource == AmountSource.CALLDATA) {
            // ERC20 style or calldata-based amount
            require(msg.value == 0, "ETH not allowed for calldata-based action");
            amount = _extractAmountFromStorage(action.data, strategy.action.amountIndex);
            require(amount <= strategy.maxAmount, "Amount exceeds maxAmount");
            callValue = 0;
        } else if (strategy.action.amountSource == AmountSource.MSG_VALUE) {
            // Payable ETH-based action
            require(strategy.action.isPayable, "Action not payable");
            require(msg.value == 0, "Executor should not send ETH");

            amount = strategy.action.value;
            require(amount > 0, "ETH required");
            require(amount <= strategy.maxAmount, "ETH exceeds maxAmount");

            uint256 vaultBalance = address(this).balance;
            require(vaultBalance >= executionBalance, "Vault undercollateralized");
            require(vaultBalance - executionBalance >= amount, "Insufficient vault ETH");

            callValue = amount;
        } else if (strategy.action.amountSource == AmountSource.NONE) {
            // No value transfer
            require(msg.value == 0, "ETH not allowed");
            callValue = 0;
        }

        strategy.lastExecution = block.timestamp;

        (bool success,) = strategy.action.target.call{value: callValue}(action.data);

        if (!success) {
            strategy.failureCount += 1;

            if (strategy.failureCount >= MAX_FAILURES) {
                strategy.paused = true;
            }

            emit StrategyExecutionFailed(strategyId);
            return;
        }

        executionBalance -= executionFee;
        // Pay the half execution fee to the feeRecipient and half to msg.sender
        (bool ok,) = payable(feeRecipient).call{value: executionFee / 2}("");
        require(ok, "Fee transfer failed");

        (ok,) = payable(msg.sender).call{value: executionFee / 2}("");
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
}
