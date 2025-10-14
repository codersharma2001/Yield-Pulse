// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {BaseBridgeAdapter} from "./BaseBridgeAdapter.sol";

/// @title LayerZeroBridgeAdapter
/// @notice Simplified LayerZero bridge adapter used for vault rebalancing simulations on testnets.
contract LayerZeroBridgeAdapter is BaseBridgeAdapter {
    using SafeERC20 for IERC20;

    event LayerZeroBridge(address indexed asset, uint256 amount, uint256 indexed dstChainId, address recipient);

    constructor(address admin) BaseBridgeAdapter(admin) {}

    function _bridge(address asset, uint256 amount, uint256 dstChainId, address recipient, bytes calldata /*extra*/ )
        internal
        override
    {
        IERC20(asset).safeTransfer(recipient, amount);
        emit LayerZeroBridge(asset, amount, dstChainId, recipient);
    }
}
