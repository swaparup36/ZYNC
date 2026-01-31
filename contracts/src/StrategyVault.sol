// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface OracleInterface {
    function latestAnswer() external view returns (int256);
}

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
    }

    enum Operator {
        LT, // Less Than
        GT, // Greater Than
        EQ // Equal To
    }

    enum AmountSource {
        CALLDATA,   // amount comes from calldata
        MSG_VALUE,  // amount comes from msg.value
        NONE        // no amount involved
    }

    mapping(address => mapping(bytes4 => bool)) allowedActions;
    uint8 MAX_FAILURES;
    uint256 public executionFee; // e.g. 0.001 ETH
    uint256 public executionBalance;
    address public feeRecipient;

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
        int256 answer = OracleInterface(oracle).latestAnswer();
        require(answer > 0, "Invalid oracle value");
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

    function executeStrategy(uint256 strategyId, bytes calldata data) external payable {
        require(
            executionBalance >= executionFee,
            "Insufficient execution balance"
        );
        require(strategyId < strategies.length, "Invalid strategy");

        Strategy storage strategy = strategies[strategyId];

        require(!strategy.paused, "Strategy paused");
        require(block.timestamp < strategy.expiry, "Strategy expired");
        require(
            strategy.lastExecution == 0 ||
            block.timestamp >= strategy.lastExecution + strategy.cooldown,
            "Cooldown active"
        );
        require(strategy.failureCount < MAX_FAILURES, "Strategy disabled");

        require(_checkConditions(strategyId), "Conditions not met");

        require(data.length >= 4, "Invalid calldata");

        bytes4 selector;
        assembly {
            selector := calldataload(data.offset)
        }

        require(selector == strategy.action.selector, "Selector mismatch");
        require(
            allowedActions[strategy.action.target][selector],
            "Action not allowed"
        );

        uint256 amount = 0;

        if (strategy.action.amountSource == AmountSource.CALLDATA) {
            // ERC20 style or calldata-based amount
            amount = _extractAmount(data, strategy.action.amountIndex);
            require(amount <= strategy.maxAmount, "Amount exceeds maxAmount");
            require(msg.value == 0, "ETH not allowed for calldata-based action");
        } else if (strategy.action.amountSource == AmountSource.MSG_VALUE) {
            // Payable ETH-based action
            require(strategy.action.isPayable, "Action not payable");
            require(msg.value > 0, "ETH required");
            require(msg.value <= strategy.maxAmount, "ETH exceeds maxAmount");
            amount = msg.value;
        } else if (strategy.action.amountSource == AmountSource.NONE) {
            // Pure call, no value transfer
            require(msg.value == 0, "ETH not allowed");
            amount = 0;
        }

        strategy.lastExecution = block.timestamp;

        (bool success, ) = strategy.action.target.call{value: msg.value}(data);

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
        (bool ok, ) = payable(feeRecipient).call{value: executionFee / 2}("");
        require(ok, "Fee transfer failed");

        (ok, ) = payable(msg.sender).call{value: executionFee / 2}("");
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

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit ETHWithdrawn(msg.sender, amount);
    }

    function recharge() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
        executionBalance += msg.value;
        emit VaultRecharged(msg.value);
    }

    // Fallback function to receive ETH
    receive() external payable {}

}
