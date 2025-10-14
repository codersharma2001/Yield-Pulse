// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IMetricsRegistry} from "./IMetricsRegistry.sol";

/// @title MetricsRegistry
/// @notice Stores compact vault metric snapshots emitted by operators/keepers for indexing.
contract MetricsRegistry is AccessControl, IMetricsRegistry {
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    mapping(address => Snapshot[]) private _snapshots;

    event RegistrySnapshotPushed(address indexed vault, Snapshot snapshot);

    error MetricsRegistryUnauthorized();

    constructor(address admin) {
        if (admin == address(0)) {
            revert MetricsRegistryUnauthorized();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PUBLISHER_ROLE, admin);
    }

    /// @notice Grants or revokes publisher permissions.
    function setPublisher(address publisher, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (allowed) {
            _grantRole(PUBLISHER_ROLE, publisher);
        } else {
            _revokeRole(PUBLISHER_ROLE, publisher);
        }
    }

    /// @inheritdoc IMetricsRegistry
    function pushSnapshot(address vault, Snapshot calldata snapshot) external override onlyRole(PUBLISHER_ROLE) {
        _snapshots[vault].push(snapshot);
        emit RegistrySnapshotPushed(vault, snapshot);
    }

    /// @inheritdoc IMetricsRegistry
    function getSnapshots(address vault, uint64 from, uint64 to)
        external
        view
        override
        returns (Snapshot[] memory snapshots)
    {
        Snapshot[] storage stored = _snapshots[vault];
        uint256 count;
        for (uint256 i; i < stored.length; ++i) {
            if (stored[i].timestamp >= from && stored[i].timestamp <= to) {
                ++count;
            }
        }

        snapshots = new Snapshot[](count);
        uint256 index;
        for (uint256 i; i < stored.length; ++i) {
            if (stored[i].timestamp >= from && stored[i].timestamp <= to) {
                snapshots[index++] = stored[i];
            }
        }
    }
}
