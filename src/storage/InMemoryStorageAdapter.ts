// src/storage/InMemoryStorageAdapter.ts

import { IStorageAdapter } from './IStorageAdapter';
import { Node, Edge, EntityId } from '../core/types';
import { deepClone } from '../utils';
import { StorageError } from '../core/errors';

/**
 * An in-memory implementation of the IStorageAdapter.
 * Useful for testing and simple client-side applications where persistence
 * across page reloads is not required. Data is lost when the app closes.
 */
export class InMemoryStorageAdapter implements IStorageAdapter {
  private nodes: Map<EntityId, Node> = new Map();
  private edges: Map<EntityId, Edge> = new Map();

  constructor() {
    // Initialize with empty maps
  }

  public async init(): Promise<void> {
    // No async initialization needed for in-memory storage
    console.log('InMemoryStorageAdapter initialized.');
  }

  public async loadNodes(): Promise<Map<EntityId, Node>> {
    try {
      // Return a deep clone to prevent external modification of internal state
      return new Map(Array.from(this.nodes.entries()).map(([id, node]) => [id, deepClone(node)]));
    } catch (error: any) {
      throw new StorageError('Failed to load nodes from in-memory storage.', error);
    }
  }

  public async loadEdges(): Promise<Map<EntityId, Edge>> {
    try {
      // Return a deep clone to prevent external modification of internal state
      return new Map(Array.from(this.edges.entries()).map(([id, edge]) => [id, deepClone(edge)]));
    } catch (error: any) {
      throw new StorageError('Failed to load edges from in-memory storage.', error);
    }
  }

  public async saveNode(node: Node): Promise<void> {
    try {
      this.nodes.set(node.id, deepClone(node));
    } catch (error: any) {
      throw new StorageError(`Failed to save node '${node.id}' to in-memory storage.`, error);
    }
  }

  public async deleteNode(nodeId: EntityId): Promise<void> {
    try {
      this.nodes.delete(nodeId);
    } catch (error: any) {
      throw new StorageError(`Failed to delete node '${nodeId}' from in-memory storage.`, error);
    }
  }

  public async saveEdge(edge: Edge): Promise<void> {
    try {
      this.edges.set(edge.id, deepClone(edge));
    } catch (error: any) {
      throw new StorageError(`Failed to save edge '${edge.id}' to in-memory storage.`, error);
    }
  }

  public async deleteEdge(edgeId: EntityId): Promise<void> {
    try {
      this.edges.delete(edgeId);
    } catch (error: any) {
      throw new StorageError(`Failed to delete edge '${edgeId}' from in-memory storage.`, error);
    }
  }

  public async applyBatch(
    nodesToSave: Map<EntityId, Node>,
    nodeIdsToDelete: Set<EntityId>,
    edgesToSave: Map<EntityId, Edge>,
    edgeIdsToDelete: Set<EntityId>
  ): Promise<void> {
    try {
      // Apply deletions first
      nodeIdsToDelete.forEach(id => this.nodes.delete(id));
      edgeIdsToDelete.forEach(id => this.edges.delete(id));

      // Then apply saves/updates
      nodesToSave.forEach((node, id) => this.nodes.set(id, deepClone(node)));
      edgesToSave.forEach((edge, id) => this.edges.set(id, deepClone(edge)));
    } catch (error: any) {
      throw new StorageError('Failed to apply batch to in-memory storage.', error);
    }
  }
}
