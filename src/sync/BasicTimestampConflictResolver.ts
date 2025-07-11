// src/sync/BasicTimestampConflictResolver.ts

import { IConflictResolver, ConflictResolutionResult } from './IConflictResolver';
import { Node, Edge } from '../core/types';
import { deepClone } from '../utils';

/**
 * A basic conflict resolver that uses the `updatedAt` timestamp.
 * It favors the entity with the most recent `updatedAt` timestamp.
 * If timestamps are equal, it might favor the local or remote based on a tie-breaking rule.
 * For true CRDTs, more sophisticated merging logic would be required.
 */
export class BasicTimestampConflictResolver implements IConflictResolver {
  /**
   * Resolves a conflict for a Node based on `updatedAt` timestamp.
   * Favors the entity with the later `updatedAt`. If equal, favors local.
   * @param localNode The local version of the node.
   * @param remoteNode The remote version of the node.
   * @returns The resolved node and a flag indicating if it was modified.
   */
  public resolveNodeConflict(localNode: Node, remoteNode: Node): ConflictResolutionResult<Node> {
    const localUpdatedAt = localNode.updatedAt.getTime();
    const remoteUpdatedAt = remoteNode.updatedAt.getTime();

    if (remoteUpdatedAt > localUpdatedAt) {
      // Remote is newer, take remote
      return { resolvedEntity: deepClone(remoteNode), wasModified: true };
    } else if (localUpdatedAt > remoteUpdatedAt) {
      // Local is newer, keep local
      return { resolvedEntity: deepClone(localNode), wasModified: false };
    } else {
      // Timestamps are equal, tie-break by version or ID (here, favor local)
      if (remoteNode.version > localNode.version) {
        return { resolvedEntity: deepClone(remoteNode), wasModified: true };
      }
      return { resolvedEntity: deepClone(localNode), wasModified: false };
    }
  }

  /**
   * Resolves a conflict for an Edge based on `updatedAt` timestamp.
   * Favors the entity with the later `updatedAt`. If equal, favors local.
   * @param localEdge The local version of the edge.
   * @param remoteEdge The remote version of the edge.
   * @returns The resolved edge and a flag indicating if it was modified.
   */
  public resolveEdgeConflict(localEdge: Edge, remoteEdge: Edge): ConflictResolutionResult<Edge> {
    const localUpdatedAt = localEdge.updatedAt.getTime();
    const remoteUpdatedAt = remoteEdge.updatedAt.getTime();

    if (remoteUpdatedAt > localUpdatedAt) {
      // Remote is newer, take remote
      return { resolvedEntity: deepClone(remoteEdge), wasModified: true };
    } else if (localUpdatedAt > remoteUpdatedAt) {
      // Local is newer, keep local
      return { resolvedEntity: deepClone(localEdge), wasModified: false };
    } else {
      // Timestamps are equal, tie-break by version or ID (here, favor local)
      if (remoteEdge.version > localEdge.version) {
        return { resolvedEntity: deepClone(remoteEdge), wasModified: true };
      }
      return { resolvedEntity: deepClone(localEdge), wasModified: false };
    }
  }
}