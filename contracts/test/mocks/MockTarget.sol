// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract MockTarget {
    uint256 public lastAmount;
    bool public shouldRevert;

    function setRevert(bool _revert) external {
        shouldRevert = _revert;
    }

    function doThing(uint256 amount) external payable {
        if (shouldRevert) {
            revert("Mock failure");
        }
        lastAmount = amount;
    }

    function doAnotherThing(uint256 amount) external payable {
        if (shouldRevert) {
            revert("Mock failure");
        }
        lastAmount = amount;
    }

    function doAnotherThingThatIsNowAllowed(uint256 amount) external payable {
        if (shouldRevert) {
            revert("Mock failure");
        }
        lastAmount = amount;
    }
}

