// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

/// @title IBridgeAdapter
/// @notice Interface for bridge adapters used during cross-chain rebalancing.
interface IBridgeAdapter {
    /// @notice Quotes the cost of bridging `amount` of `asset` to the destination chain.
    /// @param asset Address of the ERC-20 token that will be bridged.
    /// @param amount Amount of tokens to bridge.
    /// @param dstChainId Destination chain identifier.
    /// @return bridgeFee The fee required for the bridge transaction.
    function quoteBridge(address asset, uint256 amount, uint256 dstChainId) external view returns (uint256 bridgeFee);

    /// @notice Bridges tokens to the destination chain.
    /// @param asset Address of the ERC-20 token that will be bridged.
    /// @param amount Amount of tokens to bridge.
    /// @param dstChainId Destination chain identifier.
    /// @param recipient Address of the recipient on the destination chain.
    /// @param extra ABI-encoded adapter specific params.
    function bridge(address asset, uint256 amount, uint256 dstChainId, address recipient, bytes calldata extra)
        external;
}
