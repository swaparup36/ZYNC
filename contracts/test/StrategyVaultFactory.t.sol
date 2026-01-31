// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {StrategyVaultFactory} from "../src/StrategyVaultFactory.sol";
import {StrategyVault} from "../src/StrategyVault.sol";

contract StrategyVaultFactoryTest is Test {
    StrategyVaultFactory factory;
    address user = address(0x1234);
    address anotherUser = address(0x5678);

    event VaultCreated(address indexed user, address vault);

    function setUp() public {
        factory = new StrategyVaultFactory(address(0x8888));
    }

    function testCreateVault() public {
        vm.prank(user);
        address vault = factory.createVault();

        address[] memory userVaults = factory.getUserVaults(user);
        assertEq(userVaults.length, 1);
        assertEq(userVaults[0], vault);
        assertTrue(factory.isVault(vault));
    }

    function testMultipleVaultsPerUser() public {
        vm.prank(user);
        address vault1 = factory.createVault();
        vm.prank(user);
        address vault2 = factory.createVault();

        address[] memory userVaults = factory.getUserVaults(user);
        assertEq(userVaults.length, 2);
        assertEq(userVaults[0], vault1);
        assertEq(userVaults[1], vault2);
    }

    function testVaultsAreUserSpecific() public {
        vm.prank(user);
        address vault1 = factory.createVault();
        vm.prank(anotherUser);
        address vault2 = factory.createVault();

        address[] memory user1Vaults = factory.getUserVaults(user);
        address[] memory user2Vaults = factory.getUserVaults(anotherUser);

        assertEq(user1Vaults.length, 1);
        assertEq(user1Vaults[0], vault1);
        assertEq(user2Vaults.length, 1);
        assertEq(user2Vaults[0], vault2);
    }

    function testIsVaultMapping() public {
        vm.prank(user);
        address vault = factory.createVault();

        assertTrue(factory.isVault(vault));
        assertFalse(factory.isVault(address(0x9999)));
    }

    function testGetUserVaultsEmpty() public {
        address[] memory userVaults = factory.getUserVaults(user);
        assertEq(userVaults.length, 0);
    }

    function testUpdateProtocolTreasury() public {
        address newTreasury = address(0x7777);

        factory.updateProtocolTreasury(newTreasury);

        assertEq(factory.protocolTreasury(), newTreasury);
    }

    function testUpdateProtocolTreasury_reverts_when_not_owner() public {
        address newTreasury = address(0x7777);

        vm.prank(user);
        vm.expectRevert("Not owner");
        factory.updateProtocolTreasury(newTreasury);
    }

    function testProtocolTreasury_is_set_correctly() public {
        assertEq(factory.protocolTreasury(), address(0x8888));
    }

    function testProtocolOwner_is_set_correctly() public {
        assertEq(factory.protocolOwner(), address(this));
    }

    function testVault_has_correct_feeRecipient() public {
        vm.prank(user);
        address vaultAddr = factory.createVault();

        StrategyVault vault = StrategyVault(payable(vaultAddr));
        assertEq(vault.feeRecipient(), address(0x8888));
    }

    function testVault_has_correct_owner() public {
        vm.prank(user);
        address vaultAddr = factory.createVault();

        StrategyVault vault = StrategyVault(payable(vaultAddr));
        assertEq(vault.owner(), user);
    }

    function testVaultCreated_event_emitted() public {
        vm.prank(user);

        vm.expectEmit(true, false, false, false);
        emit VaultCreated(user, address(0));

        factory.createVault();
    }

    function testUpdateProtocolTreasury_updates_existing_treasury() public {
        address newTreasury = address(0x7777);
        address oldTreasury = factory.protocolTreasury();

        assertEq(oldTreasury, address(0x8888));

        factory.updateProtocolTreasury(newTreasury);

        assertEq(factory.protocolTreasury(), newTreasury);
        assertTrue(factory.protocolTreasury() != oldTreasury);
    }

    function testNewVault_uses_updated_treasury() public {
        address newTreasury = address(0x7777);

        factory.updateProtocolTreasury(newTreasury);

        vm.prank(user);
        address vaultAddr = factory.createVault();

        StrategyVault vault = StrategyVault(payable(vaultAddr));
        assertEq(vault.feeRecipient(), newTreasury);
    }

    function testIsVault_returns_false_for_non_vault() public {
        assertFalse(factory.isVault(address(0x9999)));
        assertFalse(factory.isVault(address(this)));
        assertFalse(factory.isVault(user));
    }

    function testGetUserVaults_returns_correct_order() public {
        vm.startPrank(user);
        address vault1 = factory.createVault();
        address vault2 = factory.createVault();
        address vault3 = factory.createVault();
        vm.stopPrank();

        address[] memory userVaults = factory.getUserVaults(user);

        assertEq(userVaults.length, 3);
        assertEq(userVaults[0], vault1);
        assertEq(userVaults[1], vault2);
        assertEq(userVaults[2], vault3);
    }

    function testMultipleUsers_independent_vault_lists() public {
        vm.prank(user);
        address userVault1 = factory.createVault();

        vm.prank(anotherUser);
        address anotherVault1 = factory.createVault();

        vm.prank(user);
        address userVault2 = factory.createVault();

        vm.prank(anotherUser);
        address anotherVault2 = factory.createVault();

        address[] memory user1Vaults = factory.getUserVaults(user);
        address[] memory user2Vaults = factory.getUserVaults(anotherUser);

        assertEq(user1Vaults.length, 2);
        assertEq(user2Vaults.length, 2);

        assertEq(user1Vaults[0], userVault1);
        assertEq(user1Vaults[1], userVault2);
        assertEq(user2Vaults[0], anotherVault1);
        assertEq(user2Vaults[1], anotherVault2);
    }

    function testProtocolOwner_set_at_deployment() public {
        address deployer = address(this);
        assertEq(factory.protocolOwner(), deployer);
    }

    function testProtocolTreasury_set_at_deployment() public {
        assertEq(factory.protocolTreasury(), address(0x8888));
    }
}

