// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ERC4626Vault} from "./vault/ERC4626Vault.sol";
import {IMetricsRegistry} from "./metrics/IMetricsRegistry.sol";

/// @title VaultFactory
/// @notice Deploys and manages ERC-4626 vault instances across chains and protocols.
contract VaultFactory is AccessControl {
    using Address for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Address of the ERC-4626 vault implementation used for proxies.
    address public immutable vaultImplementation;

    /// @notice On-chain metrics registry injected into newly deployed vaults.
    IMetricsRegistry public immutable metricsRegistry;

    /// @dev Tracks deployed vault addresses.
    address[] private _allVaults;

    /// @dev Flag for quickly checking whether an address is a vault created by this factory.
    mapping(address => bool) public isVault;

    /// @dev Maps vault to protocol identifier (Aave, Curve, Pendle, etc.).
    mapping(address => bytes32) public vaultProtocolId;

    /// @dev Maintains approved bridge adapters per destination chain.
    mapping(uint256 => mapping(address => bool)) private _approvedBridgeAdapters;

    event VaultDeployed(address indexed asset, bytes32 indexed protocolId, address vault);
    event BridgeAdapterApprovalUpdated(uint256 indexed chainId, address indexed adapter, bool approved);

    error VaultFactoryInvalidConfig();

    struct DeployConfig {
        address asset;
        string name;
        string symbol;
        address admin;
        address operator;
        address pauser;
        uint256 depositCap;
        uint256 minLiquidity;
        ERC4626Vault.FeeConfig feeConfig;
    }

    constructor(address admin, IMetricsRegistry metricsRegistry_, address vaultImplementation_) {
        if (admin == address(0) || address(metricsRegistry_) == address(0) || vaultImplementation_ == address(0)) {
            revert VaultFactoryInvalidConfig();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        metricsRegistry = metricsRegistry_;
        vaultImplementation = vaultImplementation_;
    }

    /// @notice Deploys a new ERC-4626 proxy vault and initializes it with the supplied configuration.
    function deployVault(address asset, bytes32 protocolId, DeployConfig calldata config)
        external
        onlyRole(ADMIN_ROLE)
        returns (address vault)
    {
        if (config.asset != asset || config.admin == address(0)) {
            revert VaultFactoryInvalidConfig();
        }

        ERC4626Vault.InitializeParams memory params = ERC4626Vault.InitializeParams({
            asset: asset,
            name: config.name,
            symbol: config.symbol,
            admin: config.admin,
            operator: config.operator,
            pauser: config.pauser,
            depositCap: config.depositCap,
            minLiquidity: config.minLiquidity,
            feeConfig: config.feeConfig,
            metricsRegistry: address(metricsRegistry),
            factory: address(this)
        });

        bytes memory initData = abi.encodeWithSelector(ERC4626Vault.initialize.selector, params);
        vault = address(new ERC1967Proxy(vaultImplementation, initData));

        isVault[vault] = true;
        _allVaults.push(vault);
        vaultProtocolId[vault] = protocolId;

        emit VaultDeployed(asset, protocolId, vault);
    }

    /// @notice Approves or revokes a bridge adapter for a destination chain.
    function setBridgeAdapter(uint256 chainId, address adapter, bool approved) external onlyRole(ADMIN_ROLE) {
        if (adapter == address(0)) {
            revert VaultFactoryInvalidConfig();
        }
        _approvedBridgeAdapters[chainId][adapter] = approved;
        emit BridgeAdapterApprovalUpdated(chainId, adapter, approved);
    }

    /// @notice Returns true if an adapter is approved for the given destination chain.
    function isBridgeAdapterApproved(uint256 chainId, address adapter) external view returns (bool) {
        return _approvedBridgeAdapters[chainId][adapter];
    }

    /// @notice Getter exposing the list of all vaults deployed by this factory.
    function allVaults() external view returns (address[] memory) {
        return _allVaults;
    }
}
