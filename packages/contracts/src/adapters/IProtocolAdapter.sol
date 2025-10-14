// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IProtocolAdapter
/// @notice Adapter interface that mediates interactions between the ERC-4626 vault and an underlying strategy.
interface IProtocolAdapter {
    /// @notice Emitted when assets are deposited into the strategy.
    /// @param caller Address initiating the deposit.
    /// @param assets Amount of underlying assets supplied.
    /// @param shares Accounting units returned by the strategy, if any.
    event StrategyDeposit(address indexed caller, uint256 assets, uint256 shares);

    /// @notice Emitted when assets are withdrawn from the strategy.
    /// @param caller Address initiating the withdrawal.
    /// @param recipient Recipient of the withdrawn assets.
    /// @param assets Amount of underlying assets returned to the vault.
    event StrategyWithdraw(address indexed caller, address indexed recipient, uint256 assets);

    /// @notice Returns the ERC-20 asset managed by the strategy.
    function asset() external view returns (IERC20);

    /// @notice Current amount of underlying assets accounted for by the strategy.
    function totalAssets() external view returns (uint256);

    /// @notice Deposits underlying assets into the strategy.
    /// @param assets Amount of assets to deposit. Caller must have transferred/approved funds.
    /// @return shares Strategy-specific accounting units minted or credited.
    function deposit(uint256 assets) external returns (uint256 shares);

    /// @notice Withdraws underlying assets from the strategy to the recipient address.
    /// @param recipient Address receiving the withdrawn assets.
    /// @param assets Amount of assets requested.
    /// @return withdrawn Amount of assets actually withdrawn (may be less in loss scenarios).
    function withdraw(address recipient, uint256 assets) external returns (uint256 withdrawn);

    /// @notice Withdraws the entire managed position back to the recipient.
    /// @param recipient Address receiving the withdrawn assets.
    /// @return withdrawn Amount of assets returned.
    function withdrawAll(address recipient) external returns (uint256 withdrawn);
}
