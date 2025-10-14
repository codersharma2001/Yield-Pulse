// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {VaultFactory} from "../src/VaultFactory.sol";
import {ERC4626Vault} from "../src/vault/ERC4626Vault.sol";
import {MetricsRegistry} from "../src/metrics/MetricsRegistry.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract VaultFactoryTest is Test {
    VaultFactory internal factory;
    MetricsRegistry internal metrics;
    ERC4626Vault internal implementation;
    MockERC20 internal asset;

    function setUp() public {
        metrics = new MetricsRegistry(address(this));
        implementation = new ERC4626Vault();
        factory = new VaultFactory(address(this), metrics, address(implementation));
        asset = new MockERC20("Mock", "MOCK");
    }

    function testDeployVaultRegisters() public {
        VaultFactory.DeployConfig memory config = VaultFactory.DeployConfig({
            asset: address(asset),
            name: "Vault",
            symbol: "vMOCK",
            admin: address(this),
            operator: address(this),
            pauser: address(this),
            depositCap: 1_000 ether,
            minLiquidity: 10 ether,
            feeConfig: ERC4626Vault.FeeConfig({managementFeeBps: 0, performanceFeeBps: 0, feeRecipient: address(0)})
        });

        address vaultAddr = factory.deployVault(address(asset), bytes32("TEST"), config);
        assertTrue(factory.isVault(vaultAddr));
        assertEq(factory.vaultProtocolId(vaultAddr), bytes32("TEST"));
    }

    function testSetBridgeAdapterApproval() public {
        address adapter = address(0x1234);
        factory.setBridgeAdapter(101, adapter, true);
        assertTrue(factory.isBridgeAdapterApproved(101, adapter));
        factory.setBridgeAdapter(101, adapter, false);
        assertFalse(factory.isBridgeAdapterApproved(101, adapter));
    }

    function testDeployVaultInvalidConfigReverts() public {
        VaultFactory.DeployConfig memory config = VaultFactory.DeployConfig({
            asset: address(asset),
            name: "Vault",
            symbol: "vMOCK",
            admin: address(0),
            operator: address(0),
            pauser: address(0),
            depositCap: 0,
            minLiquidity: 0,
            feeConfig: ERC4626Vault.FeeConfig({managementFeeBps: 0, performanceFeeBps: 0, feeRecipient: address(0)})
        });

        vm.expectRevert(VaultFactory.VaultFactoryInvalidConfig.selector);
        factory.deployVault(address(asset), bytes32("TEST"), config);
    }
}
