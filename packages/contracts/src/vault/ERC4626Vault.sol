// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {IProtocolAdapter} from "../adapters/IProtocolAdapter.sol";
import {IBridgeAdapter} from "../adapters/IBridgeAdapter.sol";
import {IMetricsRegistry} from "../metrics/IMetricsRegistry.sol";
import {VaultFactory} from "../VaultFactory.sol";

/// @title ERC4626Vault
/// @notice Cross-chain ERC-4626 vault implementation with strategy hooks, fee mechanics, and bridge-aware rebalancing.
contract ERC4626Vault is
    Initializable,
    ERC4626Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_BPS = 10_000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    /// @notice Configuration for management/performance fees.
    struct FeeConfig {
        uint16 managementFeeBps;
        uint16 performanceFeeBps;
        address feeRecipient;
    }

    /// @notice Parameters required during proxy initialization.
    struct InitializeParams {
        address asset;
        string name;
        string symbol;
        address admin;
        address operator;
        address pauser;
        uint256 depositCap;
        uint256 minLiquidity;
        FeeConfig feeConfig;
        address metricsRegistry;
        address factory;
    }

    /// @notice Parameters used when invoking a rebalance operation across chains.
    struct RebalanceParams {
        uint256 dstChainId;
        uint256 amount;
        address recipient;
        bytes extraData;
    }

    /// @dev Instance of the vault factory used for adapter approvals.
    VaultFactory public factory;

    /// @dev Strategy adapter responsible for deploying idle assets into underlying protocols.
    IProtocolAdapter public strategy;

    /// @dev On-chain metrics registry for pushing vault snapshots.
    IMetricsRegistry public metricsRegistry;

    FeeConfig public feeConfig;
    uint256 public depositCap;
    uint256 public minLiquidity;
    uint48 public lastFeeAccrual;

    mapping(uint256 => address) private _bridgeAdapters;

    event StrategySet(address indexed previousStrategy, address indexed newStrategy, uint256 migratedAssets);
    event BridgeAdapterSet(uint256 indexed chainId, address adapter);
    event FeeConfigUpdated(uint16 managementFeeBps, uint16 performanceFeeBps, address feeRecipient);
    event DepositCapUpdated(uint256 newDepositCap);
    event MinLiquidityUpdated(uint256 newMinLiquidity);
    event ManagementFeeAccrued(uint256 feeAssets, uint256 feeShares);
    event PerformanceFeeAccrued(uint256 gain, uint256 feeAssets, uint256 feeShares);
    event Rebalanced(uint256 indexed dstChainId, address indexed adapter, address recipient, uint256 amount);
    event SnapshotPushed(uint256 tvl, int64 apyBps, uint32 debtRatioBps);

    error VaultUnauthorized();
    error VaultInvalidConfig();
    error VaultInsufficientLiquidity();
    error VaultBridgeAdapterNotApproved(uint256 chainId, address adapter);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Proxy initializer configuring roles, fee parameters, and base ERC-4626 metadata.
    function initialize(InitializeParams calldata params) external initializer {
        if (
            params.asset == address(0) || params.admin == address(0) || params.factory == address(0)
                || params.metricsRegistry == address(0)
        ) {
            revert VaultInvalidConfig();
        }

        __ERC20_init(params.name, params.symbol);
        __ERC4626_init(IERC20(params.asset));
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        factory = VaultFactory(params.factory);
        metricsRegistry = IMetricsRegistry(params.metricsRegistry);
        depositCap = params.depositCap;
        minLiquidity = params.minLiquidity;
        feeConfig = params.feeConfig;
        lastFeeAccrual = uint48(block.timestamp);

        _grantRole(DEFAULT_ADMIN_ROLE, params.admin);
        _grantRole(ADMIN_ROLE, params.admin);

        if (params.operator != address(0)) {
            _grantRole(OPERATOR_ROLE, params.operator);
        }
        if (params.pauser != address(0)) {
            _grantRole(PAUSER_ROLE, params.pauser);
        }
        _validateFeeConfig(params.feeConfig);
    }

    // ===== Vault configuration =====

    /// @notice Updates the vault deposit cap, restricting total assets under management.
    function setDepositCap(uint256 newCap) external onlyRole(ADMIN_ROLE) {
        depositCap = newCap;
        emit DepositCapUpdated(newCap);
    }

    /// @notice Updates the minimum amount of liquidity that must remain in the vault after operations.
    function setMinLiquidity(uint256 newMinLiquidity) external onlyRole(ADMIN_ROLE) {
        minLiquidity = newMinLiquidity;
        emit MinLiquidityUpdated(newMinLiquidity);
    }

    /// @notice Assigns the fee configuration.
    function setFeeConfig(FeeConfig calldata newConfig) external onlyRole(ADMIN_ROLE) {
        _validateFeeConfig(newConfig);
        feeConfig = newConfig;
        emit FeeConfigUpdated(newConfig.managementFeeBps, newConfig.performanceFeeBps, newConfig.feeRecipient);
    }

    /// @notice Sets the bridge adapter for a destination chain after verifying factory approval.
    function setBridgeAdapter(uint256 chainId, address adapter) external onlyRole(ADMIN_ROLE) {
        if (adapter != address(0) && !factory.isBridgeAdapterApproved(chainId, adapter)) {
            revert VaultBridgeAdapterNotApproved(chainId, adapter);
        }
        _bridgeAdapters[chainId] = adapter;
        emit BridgeAdapterSet(chainId, adapter);
    }

    /// @notice Returns the preferred bridge adapter for a destination chain.
    function getBridgeAdapter(uint256 chainId) public view returns (address) {
        return _bridgeAdapters[chainId];
    }

    /// @notice Sets a new underlying strategy adapter, withdrawing funds from the previous one if present.
    function setStrategy(address newStrategy) external onlyRole(ADMIN_ROLE) {
        address previous = address(strategy);
        uint256 migrated;
        if (previous != address(0)) {
            migrated = strategy.withdrawAll(address(this));
        }

        IERC20 token = IERC20(asset());
        if (previous != address(0)) {
            token.forceApprove(previous, 0);
        }

        if (newStrategy != address(0)) {
            IProtocolAdapter adapter = IProtocolAdapter(newStrategy);
            if (address(adapter.asset()) != address(asset())) {
                revert VaultInvalidConfig();
            }
            strategy = adapter;
            token.forceApprove(newStrategy, 0);
        } else {
            strategy = IProtocolAdapter(address(0));
        }

        emit StrategySet(previous, newStrategy, migrated);
    }

    /// @notice Accrues time-based management fees by minting shares to the fee recipient.
    function accrueManagementFee() public {
        FeeConfig memory config = feeConfig;
        if (config.managementFeeBps == 0 || config.feeRecipient == address(0)) {
            lastFeeAccrual = uint48(block.timestamp);
            return;
        }

        uint256 elapsed = block.timestamp - uint256(lastFeeAccrual);
        if (elapsed == 0) {
            return;
        }

        uint256 assetsBefore = totalAssets();
        if (assetsBefore == 0) {
            lastFeeAccrual = uint48(block.timestamp);
            return;
        }

        uint256 feeAssets = (assetsBefore * config.managementFeeBps * elapsed) / (MAX_BPS * SECONDS_PER_YEAR);
        if (feeAssets > 0) {
            uint256 feeShares = convertToShares(feeAssets);
            if (feeShares > 0) {
                _mint(config.feeRecipient, feeShares);
                emit ManagementFeeAccrued(feeAssets, feeShares);
            }
        }
        lastFeeAccrual = uint48(block.timestamp);
    }

    /// @notice Reports realized gains or losses and applies performance fees on the net gain.
    function reportHarvest(uint256 gain, uint256 loss) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        accrueManagementFee();

        if (loss > gain) {
            uint256 netLoss = loss - gain;
            uint256 balance = IERC20(asset()).balanceOf(address(this));
            if (balance < netLoss) {
                revert VaultInsufficientLiquidity();
            }
        }

        FeeConfig memory config = feeConfig;
        if (gain > loss && config.performanceFeeBps > 0 && config.feeRecipient != address(0)) {
            uint256 netGain = gain - loss;
            uint256 feeAssets = (netGain * config.performanceFeeBps) / MAX_BPS;
            uint256 feeShares = convertToShares(feeAssets);
            if (feeShares > 0) {
                _mint(config.feeRecipient, feeShares);
                emit PerformanceFeeAccrued(netGain, feeAssets, feeShares);
            }
        }
    }

    /// @notice Pushes a snapshot to the metrics registry using current vault state.
    function pushSnapshot(int64 apyBps) external onlyRole(OPERATOR_ROLE) {
        uint256 assetsTotal = totalAssets();
        uint256 strategyAssets = _strategyAssets();
        uint32 debtRatioBps = assetsTotal == 0 ? 0 : uint32((strategyAssets * MAX_BPS) / assetsTotal);

        IMetricsRegistry.Snapshot memory snapshot = IMetricsRegistry.Snapshot({
            tvl: uint128(assetsTotal),
            apyBps: apyBps,
            timestamp: uint64(block.timestamp),
            chainId: uint32(block.chainid),
            debtRatioBps: debtRatioBps
        });
        metricsRegistry.pushSnapshot(address(this), snapshot);
        emit SnapshotPushed(assetsTotal, apyBps, debtRatioBps);
    }

    // ===== Rebalancing =====

    /// @notice Bridges idle liquidity to a destination chain using the configured adapter.
    function rebalance(RebalanceParams calldata params) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused {
        accrueManagementFee();

        if (params.amount == 0) revert VaultInvalidConfig();
        uint256 adapterChainId = params.dstChainId;
        address adapter = getBridgeAdapter(adapterChainId);
        if (adapter == address(0)) {
            revert VaultBridgeAdapterNotApproved(adapterChainId, address(0));
        }
        if (!factory.isBridgeAdapterApproved(adapterChainId, adapter)) {
            revert VaultBridgeAdapterNotApproved(adapterChainId, adapter);
        }

        uint256 totalBefore = totalAssets();
        if (totalBefore < params.amount + minLiquidity) {
            revert VaultInsufficientLiquidity();
        }

        _ensureLiquidity(params.amount);

        IERC20 token = IERC20(asset());
        token.safeIncreaseAllowance(adapter, params.amount);
        IBridgeAdapter(adapter).bridge(asset(), params.amount, adapterChainId, params.recipient, params.extraData);
        token.forceApprove(adapter, 0);

        emit Rebalanced(adapterChainId, adapter, params.recipient, params.amount);
    }

    // ===== ERC-4626 overrides =====

    function totalAssets() public view override returns (uint256) {
        return super.totalAssets() + _strategyAssets();
    }

    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256) {
        _enforceDepositCap(assets);
        accrueManagementFee();
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver) public override nonReentrant whenNotPaused returns (uint256) {
        uint256 assets = previewMint(shares);
        _enforceDepositCap(assets);
        accrueManagementFee();
        return super.mint(shares, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant returns (uint256) {
        accrueManagementFee();
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant returns (uint256) {
        accrueManagementFee();
        return super.redeem(shares, receiver, owner);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw(address recipient, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (recipient == address(0)) {
            revert VaultInvalidConfig();
        }
        IERC20(asset()).safeTransfer(recipient, amount);
    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        _deployIntoStrategy(assets);
    }

    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        _pullFromStrategy(assets);
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    function _authorizeUpgrade(address) internal view override {
        if (!hasRole(ADMIN_ROLE, _msgSender())) {
            revert VaultUnauthorized();
        }
    }

    function _strategyAssets() internal view returns (uint256) {
        if (address(strategy) == address(0)) {
            return 0;
        }
        return strategy.totalAssets();
    }

    function _deployIntoStrategy(uint256 assets) internal {
        if (assets == 0 || address(strategy) == address(0)) {
            return;
        }
        IERC20 token = IERC20(asset());
        token.forceApprove(address(strategy), 0);
        token.forceApprove(address(strategy), assets);
        strategy.deposit(assets);
        token.forceApprove(address(strategy), 0);
    }

    function _pullFromStrategy(uint256 amount) internal {
        if (amount == 0) {
            return;
        }
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        if (balance >= amount) {
            return;
        }
        if (address(strategy) == address(0)) {
            revert VaultInsufficientLiquidity();
        }
        uint256 shortfall = amount - balance;
        uint256 withdrawn = strategy.withdraw(address(this), shortfall);
        if (withdrawn < shortfall) {
            revert VaultInsufficientLiquidity();
        }
    }

    function _enforceDepositCap(uint256 assets) internal view {
        if (depositCap == 0) {
            return;
        }
        if (totalAssets() + assets > depositCap) {
            revert VaultInvalidConfig();
        }
    }

    function _ensureLiquidity(uint256 amount) internal {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        if (balance >= amount) {
            return;
        }
        if (address(strategy) == address(0)) {
            revert VaultInsufficientLiquidity();
        }
        _pullFromStrategy(amount);
    }

    function _validateFeeConfig(FeeConfig memory config) internal pure {
        if (config.managementFeeBps > 2_000 || config.performanceFeeBps > 5_000) {
            revert VaultInvalidConfig();
        }
        if ((config.managementFeeBps > 0 || config.performanceFeeBps > 0) && config.feeRecipient == address(0)) {
            revert VaultInvalidConfig();
        }
    }
}
