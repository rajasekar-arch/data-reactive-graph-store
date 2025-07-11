// src/storage/IStorageAdapter.ts

import { Node, Edge, EntityId } from '../core/types';

/**
 * Interface for a pluggable storage adapter.
 * This allows the GraphStore to persist data to various backends (in-memory, IndexedDB, localStorage, etc.).
 */
export interface IStorageAdapter {
  /**
   * Initializes the storage.
   * @returns A Promise that resolves when initialization is complete.
   */
  init(): Promise<void>;

  /**
   * Loads all nodes from storage.
   * @returns A Promise that resolves with a Map of nodes, keyed by ID.
   */
  loadNodes(): Promise<Map<EntityId, Node>>;

  /**
   * Loads all edges from storage.
   * @returns A Promise that resolves with a Map of edges, keyed by ID.
   */
  loadEdges(): Promise<Map<EntityId, Edge>>;

  /**
   * Saves a single node to storage.
   * @param node The node to save.
   * @returns A Promise that resolves when the node is saved.
   */
  saveNode(node: Node): Promise<void>;

  /**
   * Deletes a single node from storage.
   * @param nodeId The ID of the node to delete.
   * @returns A Promise that resolves when the node is deleted.
   */
  deleteNode(nodeId: EntityId): Promise<void>;

  /**
   * Saves a single edge to storage.
   * @param edge The edge to save.
   * @returns A Promise that resolves when the edge is saved.
   */
  saveEdge(edge: Edge): Promise<void>;

  /**
   * Deletes a single edge from storage.
   * @param edgeId The ID of the edge to delete.
   * @returns A Promise that resolves when the edge is deleted.
   */
  deleteEdge(edgeId: EntityId): Promise<void>;

  /**
   * Applies a batch of changes to storage atomically.
   * This is crucial for maintaining data consistency during sync operations.
   * @param nodesToSave A Map of nodes to save/update.
   * @param nodeIdsToDelete A Set of node IDs to delete.
   * @param edgesToSave A Map of edges to save/update.
   * @param edgeIdsToDelete A Set of edge IDs to delete.
   * @returns A Promise that resolves when the batch is applied.
   */
  applyBatch(
    nodesToSave: Map<EntityId, Node>,
    nodeIdsToDelete: Set<EntityId>,
    edgesToSave: Map<EntityId, Edge>,
    edgeIdsToDelete: Set<EntityId>
  ): Promise<void>;
}
