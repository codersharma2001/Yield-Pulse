// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {BaseBridgeAdapter} from "./BaseBridgeAdapter.sol";

/// @title AxelarBridgeAdapter
/// @notice Simplified Axelar bridge adapter that escrows assets prior to off-chain relaying.
contract AxelarBridgeAdapter is BaseBridgeAdapter {
    using SafeERC20 for IERC20;

    mapping(bytes32 => bool) public processedMessages;

    event AxelarBridgeQueued(
        address indexed asset, uint256 amount, uint256 indexed dstChainId, address recipient, bytes32 messageId
    );

    constructor(address admin) BaseBridgeAdapter(admin) {}

    function _bridge(address asset, uint256 amount, uint256 dstChainId, address recipient, bytes calldata extra)
        internal
        override
    {
        bytes32 messageId = keccak256(abi.encode(asset, amount, dstChainId, recipient, block.timestamp, extra));
        processedMessages[messageId] = true;
        emit AxelarBridgeQueued(asset, amount, dstChainId, recipient, messageId);
        // Assets remain escrowed inside this adapter to mimic cross-chain custody. Relayer would complete transfer off-chain.
    }

    /// @notice Admin-only escape hatch to release escrowed funds back to a recipient address.
    function releaseEscrow(address asset, address recipient, uint256 amount) external onlyRole(ADMIN_ROLE) {
        IERC20(asset).safeTransfer(recipient, amount);
    }
}
