// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {StrategyVault} from "./StrategyVault.sol";

contract StrategyVaultFactory {
    mapping(address => address[]) public userVaults;
    address[] public allVaults;
    mapping(address => bool) public isVault;
    address public protocolTreasury;
    address public protocolOwner;
    uint256 public executionFee;

    event VaultCreated(address indexed user, address vault);

    constructor(address _treasury) {
        protocolTreasury = _treasury;
        protocolOwner = msg.sender;
        executionFee = 0.01 ether;
    }

    modifier onlyOwner() {
        require(msg.sender == protocolOwner, "Not owner");
        _;
    }

    function createVault() external returns (address vault) {
        StrategyVault vaultInstance = new StrategyVault(msg.sender, protocolTreasury);
        vault = address(vaultInstance);
        userVaults[msg.sender].push(vault);
        isVault[vault] = true;
        allVaults.push(vault);
        emit VaultCreated(msg.sender, vault);
        return vault;
    }

    function getUserVaults(address user) external view returns (address[] memory) {
        return userVaults[user];
    }

    function updateProtocolTreasury(address _treasury) external onlyOwner {
        protocolTreasury = _treasury;
    }

    function updateExecutionFee(uint256 _executionFee) external onlyOwner {
        executionFee = _executionFee;
    }

    function updateProtocolOwner(address _owner) external onlyOwner {
        protocolOwner = _owner;
    }

    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }
}
