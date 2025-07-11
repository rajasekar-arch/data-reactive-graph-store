// src/sync/NoOpSyncStrategy.ts

import { ISyncStrategy, SyncChanges, RemoteData } from './ISyncStrategy';
import { IConflictResolver } from './IConflictResolver';
import { GraphStore } from '../core/GraphStore'; // Import GraphStore for context
import { SyncError } from '../core/errors';

/**
 * A "No-Operation" synchronization strategy.
 * This strategy does not perform any actual remote synchronization.
 * It's useful for purely local graph stores or as a placeholder.
 */
export class NoOpSyncStrategy implements ISyncStrategy {
  private store?: GraphStore;
  private conflictResolver?: IConflictResolver;
  private syncInterval: any;

  public async init(store: GraphStore, conflictResolver: IConflictResolver): Promise<void> {
    this.store = store;
    this.conflictResolver = conflictResolver;
    console.log('NoOpSyncStrategy initialized. No remote sync will occur.');
  }

  public async pushChanges(changes: SyncChanges): Promise<void> {
    console.log('NoOpSyncStrategy: Push changes (no-op)', changes);
    // In a real sync strategy, you'd send these changes to a remote server.
  }

  public async pullChanges(lastSyncedAt: Date | null): Promise<RemoteData> {
    console.log('NoOpSyncStrategy: Pull changes (no-op)', lastSyncedAt);
    // In a real sync strategy, you'd fetch changes from a remote server.
    return {
      nodes: [],
      edges: [],
      deletedNodeIds: [],
      deletedEdgeIds: [],
      newLastSyncedAt: new Date(),
    };
  }

  public startSync(intervalMs: number = 60000): () => void {
    console.log(`NoOpSyncStrategy: Starting continuous sync (no-op) every ${intervalMs}ms.`);
    // Simulate periodic sync, but without actual remote interaction
    this.syncInterval = setInterval(() => {
      console.log('NoOpSyncStrategy: Simulating periodic sync check.');
      // In a real strategy, you'd call this.syncOnce() here.
    }, intervalMs);

    return () => {
      console.log('NoOpSyncStrategy: Stopping continuous sync.');
      clearInterval(this.syncInterval);
    };
  }

  public async syncOnce(): Promise<void> {
    console.log('NoOpSyncStrategy: Performing one-time sync (no-op).');
    if (!this.store || !this.conflictResolver) {
      throw new SyncError('Sync strategy not initialized.');
    }

    // This is where the core sync logic would live:
    // 1. Get local changes (e.g., from a transaction log or by comparing with last known remote state)
    // 2. Push local changes to remote
    // 3. Pull remote changes
    // 4. Apply remote changes locally, resolving conflicts
    // 5. Update last synced timestamp

    // For NoOp, we just log and return.
    const lastSyncedAt = this.store.getLastSyncedAt();
    const remoteData = await this.pullChanges(lastSyncedAt);
    // In a real sync, remoteData would be processed and applied to the store.
    // this.store.applyRemoteChanges(remoteData, this.conflictResolver);
    this.store.setLastSyncedAt(remoteData.newLastSyncedAt);
    console.log('NoOpSyncStrategy: One-time sync complete.');
  }
}
