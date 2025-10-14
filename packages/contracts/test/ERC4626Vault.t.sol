// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {ERC4626Vault} from "../src/vault/ERC4626Vault.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {MetricsRegistry} from "../src/metrics/MetricsRegistry.sol";
import {IMetricsRegistry} from "../src/metrics/IMetricsRegistry.sol";
import {LayerZeroBridgeAdapter} from "../src/adapters/LayerZeroBridgeAdapter.sol";
import {AxelarBridgeAdapter} from "../src/adapters/AxelarBridgeAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockProtocolAdapter} from "./mocks/MockProtocolAdapter.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract ERC4626VaultTest is Test {
    MockERC20 internal asset;
    MetricsRegistry internal metrics;
    ERC4626Vault internal vaultImplementation;
    VaultFactory internal factory;
    ERC4626Vault internal vault;
    LayerZeroBridgeAdapter internal layerZero;
    AxelarBridgeAdapter internal axelar;

    address internal constant USER = address(0xBEEF);
    address internal constant FEE_RECIPIENT = address(0xFEE);

    function setUp() public {
        asset = new MockERC20("Mock Asset", "MOCK");
        metrics = new MetricsRegistry(address(this));
        vaultImplementation = new ERC4626Vault();
        factory = new VaultFactory(address(this), IMetricsRegistry(metrics), address(vaultImplementation));

        layerZero = new LayerZeroBridgeAdapter(address(this));
        axelar = new AxelarBridgeAdapter(address(this));
        layerZero.setTrustedRemote(101, true);
        axelar.setTrustedRemote(102, true);

        factory.setBridgeAdapter(101, address(layerZero), true);
        factory.setBridgeAdapter(102, address(axelar), true);

        ERC4626Vault.FeeConfig memory feeConfig =
            ERC4626Vault.FeeConfig({managementFeeBps: 0, performanceFeeBps: 0, feeRecipient: address(0)});

        VaultFactory.DeployConfig memory config = VaultFactory.DeployConfig({
            asset: address(asset),
            name: "Yield Vault",
            symbol: "yvMOCK",
            admin: address(this),
            operator: address(this),
            pauser: address(this),
            depositCap: 1_000_000 ether,
            minLiquidity: 0,
            feeConfig: feeConfig
        });

        address vaultAddress = factory.deployVault(address(asset), bytes32("AAVE"), config);
        vault = ERC4626Vault(vaultAddress);
        metrics.setPublisher(vaultAddress, true);

        asset.mint(USER, 1_000_000 ether);
        vm.startPrank(USER);
        asset.approve(address(vault), type(uint256).max);
        vm.stopPrank();
    }

    function testDepositAndWithdraw() public {
        vm.prank(USER);
        uint256 shares = vault.deposit(100 ether, USER);
        assertEq(shares, 100 ether);
        assertEq(vault.totalAssets(), 100 ether);

        vm.prank(USER);
        uint256 assetsWithdrawn = vault.withdraw(40 ether, USER, USER);
        assertEq(assetsWithdrawn, 40 ether);
        assertEq(vault.totalAssets(), 60 ether);
    }

    function testDepositCapEnforced() public {
        vault.setDepositCap(100 ether);
        vm.prank(USER);
        vault.deposit(80 ether, USER);
        vm.prank(USER);
        vm.expectRevert(ERC4626Vault.VaultInvalidConfig.selector);
        vault.deposit(30 ether, USER);
    }

    function testAccrueManagementFeeMintsShares() public {
        vault.setFeeConfig(
            ERC4626Vault.FeeConfig({managementFeeBps: 200, performanceFeeBps: 0, feeRecipient: FEE_RECIPIENT})
        );

        vm.prank(USER);
        vault.deposit(100 ether, USER);

        vm.warp(block.timestamp + 365 days);
        vault.accrueManagementFee();

        uint256 feeShares = vault.balanceOf(FEE_RECIPIENT);
        assertGt(feeShares, 0);
        assertApproxEqAbs(feeShares, 2 ether, 1e12); // allow minor rounding
    }

    function testPerformanceFeeOnHarvest() public {
        vault.setFeeConfig(
            ERC4626Vault.FeeConfig({managementFeeBps: 0, performanceFeeBps: 2000, feeRecipient: FEE_RECIPIENT})
        );

        vm.prank(USER);
        vault.deposit(100 ether, USER);

        asset.mint(address(vault), 20 ether);
        uint256 supplyBefore = vault.totalSupply();
        uint256 assetsBefore = vault.totalAssets();
        uint256 feeAssets = (20 ether * 2000) / 10_000;
        uint256 expectedShares = (feeAssets * supplyBefore) / assetsBefore;

        vault.reportHarvest(20 ether, 0);

        uint256 feeShares = vault.balanceOf(FEE_RECIPIENT);
        assertGt(feeShares, 0);
        assertApproxEqAbs(feeShares, expectedShares, 10);
    }

    function testStrategyIntegration() public {
        MockProtocolAdapter adapter = new MockProtocolAdapter(asset);
        vault.setStrategy(address(adapter));

        vm.prank(USER);
        vault.deposit(200 ether, USER);

        assertEq(asset.balanceOf(address(adapter)), 200 ether);
        assertEq(vault.totalAssets(), 200 ether);

        vm.prank(USER);
        vault.withdraw(50 ether, USER, USER);
        assertEq(asset.balanceOf(USER), 1_000_000 ether - 150 ether);
        assertEq(asset.balanceOf(address(adapter)), 150 ether);
    }

    function testRebalanceWithLayerZeroAdapter() public {
        vault.setBridgeAdapter(101, address(layerZero));

        vm.prank(USER);
        vault.deposit(150 ether, USER);

        ERC4626Vault.RebalanceParams memory params = ERC4626Vault.RebalanceParams({
            dstChainId: 101,
            amount: 40 ether,
            recipient: address(0xCAFE),
            extraData: bytes("")
        });

        vault.rebalance(params);
        assertEq(asset.balanceOf(address(0xCAFE)), 40 ether);
        assertEq(vault.totalAssets(), 110 ether);
    }

    function testRebalanceFailsForUnapprovedAdapter() public {
        vm.prank(USER);
        vault.deposit(100 ether, USER);

        ERC4626Vault.RebalanceParams memory params = ERC4626Vault.RebalanceParams({
            dstChainId: 999,
            amount: 10 ether,
            recipient: address(0xCAFE),
            extraData: bytes("")
        });

        vm.expectRevert(
            abi.encodeWithSelector(ERC4626Vault.VaultBridgeAdapterNotApproved.selector, 999, address(0))
        );
        vault.rebalance(params);
    }

    function testPushSnapshot() public {
        vm.prank(USER);
        vault.deposit(80 ether, USER);

        vault.pushSnapshot(1200);
        IMetricsRegistry.Snapshot[] memory snapshots = metrics.getSnapshots(address(vault), 0, type(uint64).max);
        assertEq(snapshots.length, 1);
        assertEq(snapshots[0].tvl, 80 ether);
        assertEq(snapshots[0].apyBps, 1200);
    }

    function testPausePreventsDepositAllowsWithdraw() public {
        vm.prank(USER);
        vault.deposit(60 ether, USER);

        vault.pause();
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        vm.prank(USER);
        vault.deposit(10 ether, USER);

        vm.prank(USER);
        uint256 withdrawn = vault.withdraw(20 ether, USER, USER);
        assertEq(withdrawn, 20 ether);
    }
}
