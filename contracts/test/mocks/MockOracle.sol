// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MockOracle is AggregatorV3Interface {
    int256 public answer;
    uint256 public updatedAtTimestamp;
    uint8 public override decimals = 8;

    constructor() {
        updatedAtTimestamp = block.timestamp;
    }

    function setAnswer(int256 _answer) external {
        answer = _answer;
        updatedAtTimestamp = block.timestamp;
    }

    function setStaleData(bool stale) external {
        if (stale) {
            updatedAtTimestamp = 0;
        } else {
            updatedAtTimestamp = block.timestamp;
        }
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        return (0, answer, 0, updatedAtTimestamp, 0);
    }

    function description() external pure override returns (string memory) {
        return "Mock Oracle";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 /*_roundId*/
    )
        external
        view
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        return (0, answer, 0, updatedAtTimestamp, 0);
    }
}
