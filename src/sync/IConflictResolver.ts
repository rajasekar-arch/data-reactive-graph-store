// src/sync/IConflictResolver.ts

import { Node, Edge } from '../core/types';

/**
 * Represents the outcome of a conflict resolution.
 */
export interface ConflictResolutionResult<T extends Node | Edge> {
  /** The entity that should be kept (the resolved version). */
  resolvedEntity: T;
  /** True if the entity was modified during resolution, false otherwise. */
  wasModified: boolean;
}

/**
 * Interface for a pluggable conflict resolution strategy.
 * This is crucial for offline-first and multi-device synchronization.
 * Conflict resolvers decide how to merge conflicting versions of an entity.
 */
export interface IConflictResolver {
  /**
   * Resolves a conflict between a local and a remote version of a Node.
   * @param localNode The version of the node currently in the local store.
   * @param remoteNode The version of the node received from the remote.
   * @returns The resolved node and a flag indicating if it was modified.
   */
  resolveNodeConflict(localNode: Node, remoteNode: Node): ConflictResolutionResult<Node>;

  /**
   * Resolves a conflict between a local and a remote version of an Edge.
   * @param localEdge The version of the edge currently in the local store.
   * @param remoteEdge The version of the edge received from the remote.
   * @returns The resolved edge and a flag indicating if it was modified.
   */
  resolveEdgeConflict(localEdge: Edge, remoteEdge: Edge): ConflictResolutionResult<Edge>;
}
