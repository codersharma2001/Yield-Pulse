// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

/// @title IMetricsRegistry
/// @notice Interface for pushing and retrieving on-chain vault metrics snapshots.
interface IMetricsRegistry {
    /// @notice Snapshot structure storing relevant vault metrics.
    struct Snapshot {
        uint128 tvl;
        int64 apyBps;
        uint64 timestamp;
        uint32 chainId;
        uint32 debtRatioBps;
    }

    /// @notice Stores a vault metrics snapshot.
    /// @param vault Address of the vault related to the snapshot.
    /// @param snapshot Structured snapshot payload.
    function pushSnapshot(address vault, Snapshot calldata snapshot) external;

    /// @notice Retrieves snapshots between the `from` and `to` timestamps, inclusive.
    /// @param vault Address of the vault.
    /// @param from Earliest timestamp (inclusive).
    /// @param to Latest timestamp (inclusive).
    /// @return snapshots Ordered array of snapshots.
    function getSnapshots(address vault, uint64 from, uint64 to) external view returns (Snapshot[] memory snapshots);
}
