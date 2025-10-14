// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IBridgeAdapter} from "./IBridgeAdapter.sol";

/// @title BaseBridgeAdapter
/// @notice Shared functionality for concrete bridge adapters used for vault rebalancing.
abstract contract BaseBridgeAdapter is AccessControl, Pausable, IBridgeAdapter {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct BridgeFeeConfig {
        uint16 feeBps; // fee applied on amount (basis points)
        uint128 flatFee; // flat fee denominated in the bridged asset
    }

    mapping(uint256 => BridgeFeeConfig) internal _chainFeeConfig;
    mapping(uint256 => bool) internal _trustedRemotes;

    event BridgeFeeConfigUpdated(uint256 indexed chainId, uint16 feeBps, uint128 flatFee);
    event TrustedRemoteSet(uint256 indexed chainId, bool allowed);
    event BridgeInitiated(
        address indexed asset,
        uint256 indexed amount,
        uint256 indexed dstChainId,
        address adapterCaller,
        address recipient,
        bytes extraData
    );

    error BridgeAdapterUnauthorized();
    error BridgeAdapterInvalidRecipient();
    error BridgeAdapterUntrustedRemote(uint256 chainId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /// @inheritdoc IBridgeAdapter
    function quoteBridge(address, uint256 amount, uint256 dstChainId)
        public
        view
        virtual
        override
        returns (uint256)
    {
        BridgeFeeConfig memory config = _chainFeeConfig[dstChainId];
        if (config.feeBps == 0 && config.flatFee == 0) {
            return 0;
        }
        uint256 percentFee = (amount * config.feeBps) / 10_000;
        return percentFee + config.flatFee;
    }

    /// @notice Updates the fee configuration for a destination chain.
    function setBridgeFeeConfig(uint256 chainId, BridgeFeeConfig calldata config) external onlyRole(ADMIN_ROLE) {
        require(config.feeBps <= 2000, "fee too high");
        _chainFeeConfig[chainId] = config;
        emit BridgeFeeConfigUpdated(chainId, config.feeBps, config.flatFee);
    }

    /// @notice Marks a destination chain as trusted/untrusted.
    function setTrustedRemote(uint256 chainId, bool allowed) external onlyRole(ADMIN_ROLE) {
        _trustedRemotes[chainId] = allowed;
        emit TrustedRemoteSet(chainId, allowed);
    }

    /// @notice Returns true if a destination chain is trusted.
    function isTrustedRemote(uint256 chainId) public view returns (bool) {
        return _trustedRemotes[chainId];
    }

    /// @notice Internal hook that concrete adapters implement to execute bridge calls.
    function _bridge(address asset, uint256 amount, uint256 dstChainId, address recipient, bytes calldata extra)
        internal
        virtual;

    /// @inheritdoc IBridgeAdapter
    function bridge(address asset, uint256 amount, uint256 dstChainId, address recipient, bytes calldata extra)
        external
        override
        whenNotPaused
    {
        if (!_trustedRemotes[dstChainId]) {
            revert BridgeAdapterUntrustedRemote(dstChainId);
        }
        if (recipient == address(0)) {
            revert BridgeAdapterInvalidRecipient();
        }
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        _bridge(asset, amount, dstChainId, recipient, extra);
        emit BridgeInitiated(asset, amount, dstChainId, msg.sender, recipient, extra);
    }
}
