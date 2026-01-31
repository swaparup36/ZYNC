// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {StrategyVault} from "./StrategyVault.sol"; 

contract StrategyVaultFactory {
    mapping(address => address[]) public userVaults;
    mapping(address => bool) public isVault;

    event VaultCreated(address indexed user, address vault);

    function createVault() external returns (address vault) {
        StrategyVault vaultInstance = new StrategyVault(msg.sender);
        vault = address(vaultInstance);
        userVaults[msg.sender].push(vault);
        isVault[vault] = true;
        emit VaultCreated(msg.sender, vault);
        return vault;
    }

    function getUserVaults(address user) external view returns (address[] memory) {
        return userVaults[user];
    }
}
