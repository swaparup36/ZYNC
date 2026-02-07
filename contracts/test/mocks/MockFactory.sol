// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract MockFactory {
    uint256 public executionFee;

    constructor(uint256 _executionFee) {
        executionFee = _executionFee;
    }

    function setExecutionFee(uint256 _executionFee) external {
        executionFee = _executionFee;
    }
}
