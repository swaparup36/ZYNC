// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract MockOracle {
    int256 private answer;

    function setAnswer(int256 _answer) external {
        answer = _answer;
    }

    function latestAnswer() external view returns (int256) {
        return answer;
    }
}
