// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IProtocolAdapter} from "../../src/adapters/IProtocolAdapter.sol";

/// @notice Mock strategy adapter that simply escrows tokens within the contract.
contract MockProtocolAdapter is IProtocolAdapter {
    using SafeERC20 for IERC20;

    IERC20 private immutable _asset;
    uint256 private _totalAssets;

    constructor(IERC20 asset_) {
        _asset = asset_;
    }

    function asset() external view override returns (IERC20) {
        return _asset;
    }

    function totalAssets() external view override returns (uint256) {
        return _totalAssets;
    }

    function deposit(uint256 assets) external override returns (uint256 shares) {
        _asset.safeTransferFrom(msg.sender, address(this), assets);
        _totalAssets += assets;
        emit StrategyDeposit(msg.sender, assets, assets);
        return assets;
    }

    function withdraw(address recipient, uint256 assets) external override returns (uint256 withdrawn) {
        if (assets > _totalAssets) {
            assets = _totalAssets;
        }
        _totalAssets -= assets;
        _asset.safeTransfer(recipient, assets);
        emit StrategyWithdraw(msg.sender, recipient, assets);
        return assets;
    }

    function withdrawAll(address recipient) external override returns (uint256 withdrawn) {
        uint256 amount = _totalAssets;
        _totalAssets = 0;
        _asset.safeTransfer(recipient, amount);
        emit StrategyWithdraw(msg.sender, recipient, amount);
        return amount;
    }

    function simulateGain(uint256 amount) external {
        _asset.safeTransferFrom(msg.sender, address(this), amount);
        _totalAssets += amount;
    }
}
