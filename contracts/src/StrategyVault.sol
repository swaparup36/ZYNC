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
    }

    enum Operator {
        LT, // Less Than
        GT, // Greater Than
        EQ // Equal To
    }

    mapping(address => mapping(bytes4 => bool)) allowedActions;
    uint8 MAX_FAILURES;

    constructor(address _owner) {
        owner = _owner;
        MAX_FAILURES = 3;
    }

    event StrategyCreated(uint256 indexed strategyId);
    event ActionAllowed(address indexed target, bytes4 indexed selector);
    event ActionDisallowed(address indexed target, bytes4 indexed selector);
    event StrategyExecuted(uint256 indexed strategyId);
    event StrategyExecutionFailed(uint256 strategyId);

    modifier onlyOwner {
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
        require(strategyId < strategies.length, "Invalid strategy");
        
        Strategy storage strategy = strategies[strategyId];

        require(!strategy.paused, "Strategy paused");
        require(block.timestamp < strategy.expiry, "Strategy expired");
        require(strategy.lastExecution == 0 || block.timestamp >= strategy.lastExecution + strategy.cooldown, "Cooldown active");
        require(strategy.failureCount < MAX_FAILURES, "Strategy disabled");

        require(_checkConditions(strategyId), "Conditions not met");

        require(data.length >= 4, "Invalid calldata");
        bytes4 selector;
        assembly {
            selector := calldataload(data.offset)
        }
        uint256 amount = _extractAmount(data, strategy.action.amountIndex);
        
        require(amount <= strategy.maxAmount, "Amount exceeds maxAmount");
        // ETH value is bounded by maxAmount if function is payable
        require(msg.value <= strategy.maxAmount, "ETH exceeds maxAmount");
        require(selector == strategy.action.selector, "Selector mismatch");
        require(allowedActions[strategy.action.target][selector], "Action not allowed");

        strategy.lastExecution = block.timestamp;

        (bool success, ) = strategy.action.target.call(data);

        if (!success) {
            strategy.failureCount += 1;

            if (strategy.failureCount >= MAX_FAILURES) {
                strategy.paused = true;
            }

            emit StrategyExecutionFailed(strategyId);
        } else {
            strategy.failureCount = 0;
            emit StrategyExecuted(strategyId);
        }
    }
}
