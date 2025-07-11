// src/sync/ISyncStrategy.ts

import { Node, Edge, EntityId } from '../core/types';
import { IConflictResolver } from './IConflictResolver';
import { GraphStore } from '../core/GraphStore'; // Import GraphStore for context

/**
 * Represents a set of changes that need to be synchronized.
 */
export interface SyncChanges {
  nodesToPush: Node[]; // Nodes that have changed locally and need to be pushed to remote
  edgesToPush: Edge[]; // Edges that have changed locally and need to be pushed to remote
  nodeIdsToDelete: EntityId[]; // Node IDs marked for deletion locally
  edgeIdsToDelete: EntityId[]; // Edge IDs marked for deletion locally
  lastSyncedAt: Date | null; // Timestamp of the last successful sync
}

/**
 * Represents data pulled from the remote.
 */
export interface RemoteData {
  nodes: Node[];
  edges: Edge[];
  deletedNodeIds: EntityId[]; // IDs of nodes deleted on remote
  deletedEdgeIds: EntityId[]; // IDs of edges deleted on remote
  newLastSyncedAt: Date; // New timestamp to mark as last synced
}

/**
 * Interface for a pluggable synchronization strategy.
 * This defines how the local graph store interacts with a remote backend.
 */
export interface ISyncStrategy {
  /**
   * Initializes the synchronization strategy.
   * @param store The GraphStore instance this strategy is associated with.
   * @param conflictResolver The conflict resolver to use during sync.
   * @returns A Promise that resolves when initialization is complete.
   */
  init(store: GraphStore, conflictResolver: IConflictResolver): Promise<void>;

  /**
   * Pushes local changes to the remote backend.
   * @param changes The changes to push.
   * @returns A Promise that resolves when changes are pushed.
   */
  pushChanges(changes: SyncChanges): Promise<void>;

  /**
   * Pulls changes from the remote backend since the last sync.
   * @param lastSyncedAt The timestamp of the last successful sync.
   * @returns A Promise that resolves with the remote data.
   */
  pullChanges(lastSyncedAt: Date | null): Promise<RemoteData>;

  /**
   * Starts continuous synchronization (e.g., polling or WebSocket listener).
   * This method should handle pulling and pushing changes periodically or reactively.
   * @param intervalMs The interval in milliseconds for polling (if applicable).
   * @returns A function to stop continuous synchronization.
   */
  startSync(intervalMs?: number): () => void;

  /**
   * Performs a one-time, manual synchronization.
   * @returns A Promise that resolves when the sync is complete.
   */
  syncOnce(): Promise<void>;
}
