// src/core/GraphStore.ts

import {
  Node,
  Edge,
  EntityId,
  NodeOptions,
  EdgeOptions,
  GraphChangeEvent,
  GraphChangeSubscriber,
  Unsubscribe,
  GraphBatch,
  GraphQuery,
} from './types';
import {
  GraphStoreError,
  EntityNotFoundError,
  DuplicateEntityError,
  InvalidArgumentError,
  ConflictError,
  SyncError,
} from './errors';
import { GraphObservable } from './reactivity';
import { generateUUID, deepClone, validateNode, validateEdge, validateEntityId } from '../utils';
import { IStorageAdapter } from '../storage/IStorageAdapter';
import { InMemoryStorageAdapter } from '../storage/InMemoryStorageAdapter'; // Default adapter
import { ISyncStrategy, RemoteData } from '../sync/ISyncStrategy';
import { IConflictResolver } from '../sync/IConflictResolver';
import { NoOpSyncStrategy } from '../sync/NoOpSyncStrategy'; // Default sync strategy
import { BasicTimestampConflictResolver } from '../sync/BasicTimestampConflictResolver'; // Default conflict resolver

/**
 * Configuration options for the GraphStore.
 */
export interface GraphStoreConfig {
  /**
   * The storage adapter to use for persistence. Defaults to InMemoryStorageAdapter.
   */
  storageAdapter?: IStorageAdapter;
  /**
   * The synchronization strategy to use for remote sync. Defaults to NoOpSyncStrategy.
   */
  syncStrategy?: ISyncStrategy;
  /**
   * The conflict resolution strategy for sync. Defaults to BasicTimestampConflictResolver.
   */
  conflictResolver?: IConflictResolver;
  /**
   * The interval for continuous synchronization in milliseconds (if syncStrategy supports it).
   * Default is 60 seconds (60000 ms).
   */
  syncIntervalMs?: number;
}

/**
 * The core Reactive Graph Store.
 * Manages nodes and edges, provides reactive updates, and supports pluggable persistence and synchronization.
 */
export class GraphStore {
  private nodes: Map<EntityId, Node> = new Map();
  private edges: Map<EntityId, Edge> = new Map();
  private readonly observable: GraphObservable = new GraphObservable();
  private readonly storageAdapter: IStorageAdapter;
  private readonly syncStrategy: ISyncStrategy;
  private readonly conflictResolver: IConflictResolver;
  private lastSyncedAt: Date | null = null;
  private syncStopFunction: Unsubscribe | null = null;

  constructor(config?: GraphStoreConfig) {
    this.storageAdapter = config?.storageAdapter || new InMemoryStorageAdapter();
    this.conflictResolver = config?.conflictResolver || new BasicTimestampConflictResolver();
    this.syncStrategy = config?.syncStrategy || new NoOpSyncStrategy();
    this.syncStrategy.init(this, this.conflictResolver).catch(e => {
      console.error('Failed to initialize sync strategy:', e);
      // Depending on severity, you might want to throw or emit an event here.
    });
  }

  /**
   * Initializes the graph store by loading data from the storage adapter.
   * Must be called before performing any operations on the store.
   * @returns A Promise that resolves when initialization is complete.
   */
  public async init(): Promise<void> {
    try {
      await this.storageAdapter.init();
      this.nodes = await this.storageAdapter.loadNodes();
      this.edges = await this.storageAdapter.loadEdges();
      console.log(`GraphStore initialized. Loaded ${this.nodes.size} nodes and ${this.edges.size} edges.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error initializing GraphStore:', error.message);
        throw new GraphStoreError(`Failed to initialize GraphStore: ${error.message}`);
      }
    }
  }

  /**
   * Starts continuous synchronization with the remote backend.
   * @param intervalMs The interval in milliseconds for polling (if applicable to the sync strategy).
   */
  public startSync(intervalMs?: number): void {
    if (this.syncStopFunction) {
      console.warn('Sync is already running. Stopping previous sync before starting a new one.');
      this.syncStopFunction();
    }
    this.syncStopFunction = this.syncStrategy.startSync(intervalMs);
  }

  /**
   * Stops continuous synchronization.
   */
  public stopSync(): void {
    if (this.syncStopFunction) {
      this.syncStopFunction();
      this.syncStopFunction = null;
    }
  }

  /**
   * Performs a one-time, manual synchronization with the remote backend.
   * @returns A Promise that resolves when the sync is complete.
   */
  public async syncOnce(): Promise<void> {
    try {
      await this.syncStrategy.syncOnce();
    } catch (error: any) {
      throw new SyncError(`Manual sync failed: ${error.message}`, error);
    }
  }

  /**
   * Gets the timestamp of the last successful synchronization.
   * @returns The Date object of the last sync, or null if never synced.
   */
  public getLastSyncedAt(): Date | null {
    return this.lastSyncedAt;
  }

  /**
   * Sets the timestamp of the last successful synchronization.
   * This is typically called by the sync strategy.
   * @param date The Date object to set as the last synced time.
   */
  public setLastSyncedAt(date: Date): void {
    this.lastSyncedAt = date;
  }

  /**
   * Subscribes to graph change events.
   * @param subscriber The function to call when a change occurs.
   * @returns An unsubscribe function to stop receiving updates.
   */
  public subscribe(subscriber: GraphChangeSubscriber): Unsubscribe {
    return this.observable.subscribe(subscriber);
  }

  /**
   * Adds a new node to the graph.
   * @param type The type of the node (e.g., 'User', 'Post').
   * @param data The data associated with the node.
   * @param options Optional NodeOptions including a custom ID or version.
   * @returns A Promise that resolves with the newly added Node.
   * @throws {DuplicateEntityError} if a node with the same ID already exists.
   * @throws {InvalidArgumentError} if the node data is invalid.
   */
  public async addNode(type: string, data: Record<string, any>, options?: NodeOptions): Promise<Node> {
    const id = options?.id || generateUUID();
    validateEntityId(id, 'Node');

    if (this.nodes.has(id)) {
      throw new DuplicateEntityError(id, 'Node');
    }

    const now = new Date();
    const newNode: Node = {
      id,
      type,
      data: deepClone(data),
      createdAt: now,
      updatedAt: now,
      version: options?.version ?? 1,
      deleted: false,
    };
    validateNode(newNode);

    this.nodes.set(id, newNode);
    await this.storageAdapter.saveNode(newNode);
    this.observable.notify({ type: 'node:added', entity: deepClone(newNode) });
    return deepClone(newNode);
  }

  /**
   * Retrieves a node by its ID.
   * @param id The ID of the node.
   * @returns The Node object.
   * @throws {EntityNotFoundError} if the node is not found.
   */
  public getNode(id: EntityId): Node {
    validateEntityId(id, 'Node');
    const node = this.nodes.get(id);
    if (!node || node.deleted) {
      throw new EntityNotFoundError(id, 'Node');
    }
    return deepClone(node);
  }

  /**
   * Updates an existing node.
   * @param id The ID of the node to update.
   * @param newData The new data to merge into the node's existing data.
   * @param options Optional NodeOptions including version for optimistic concurrency.
   * @returns A Promise that resolves with the updated Node.
   * @throws {EntityNotFoundError} if the node is not found.
   * @throws {ConflictError} if an optimistic concurrency conflict occurs.
   */
  public async updateNode(id: EntityId, newData: Record<string, any>, options?: NodeOptions): Promise<Node> {
    validateEntityId(id, 'Node');
    const existingNode = this.nodes.get(id);
    if (!existingNode || existingNode.deleted) {
      throw new EntityNotFoundError(id, 'Node');
    }

    if (options?.version !== undefined && options.version !== existingNode.version) {
      throw new ConflictError(id, `Expected version ${options.version}, but current version is ${existingNode.version}.`);
    }

    const oldNode = deepClone(existingNode);
    const updatedNode: Node = {
      ...existingNode,
      data: { ...existingNode.data, ...newData },
      updatedAt: new Date(),
      version: existingNode.version + 1,
    };
    validateNode(updatedNode);

    this.nodes.set(id, updatedNode);
    await this.storageAdapter.saveNode(updatedNode);
    this.observable.notify({ type: 'node:updated', entity: deepClone(updatedNode), oldEntity: oldNode });
    return deepClone(updatedNode);
  }

  /**
   * Deletes a node from the graph.
   * @param id The ID of the node to delete.
   * @param softDelete If true, marks the node as deleted instead of physically removing it. Default is true.
   * @returns A Promise that resolves when the node is deleted.
   * @throws {EntityNotFoundError} if the node is not found.
   */
  public async deleteNode(id: EntityId, softDelete: boolean = true): Promise<void> {
    validateEntityId(id, 'Node');
    const existingNode = this.nodes.get(id);
    if (!existingNode || existingNode.deleted) {
      throw new EntityNotFoundError(id, 'Node');
    }

    const oldNode = deepClone(existingNode);

    if (softDelete) {
      const deletedNode: Node = {
        ...existingNode,
        deleted: true,
        updatedAt: new Date(),
        version: existingNode.version + 1,
      };
      this.nodes.set(id, deletedNode);
      await this.storageAdapter.saveNode(deletedNode);
    } else {
      this.nodes.delete(id);
      await this.storageAdapter.deleteNode(id);
    }

    // Also delete or soft-delete associated edges
    const edgesToDelete: Edge[] = [];
    this.edges.forEach(edge => {
      if (edge.source === id || edge.target === id) {
        edgesToDelete.push(edge);
      }
    });

    for (const edge of edgesToDelete) {
      await this.deleteEdge(edge.id, softDelete); // Recursively soft-delete/delete edges
    }

    this.observable.notify({ type: 'node:deleted', entity: oldNode });
  }

  /**
   * Adds a new edge to the graph.
   * @param sourceId The ID of the source node.
   * @param targetId The ID of the target node.
   * @param relation The type of relationship (e.g., 'FOLLOWS', 'LIKES').
   * @param options Optional EdgeOptions including a custom ID or data.
   * @returns A Promise that resolves with the newly added Edge.
   * @throws {EntityNotFoundError} if source or target node is not found.
   * @throws {DuplicateEntityError} if an edge with the same ID already exists.
   * @throws {InvalidArgumentError} if the edge data is invalid.
   */
  public async addEdge(sourceId: EntityId, targetId: EntityId, relation: string, options?: EdgeOptions): Promise<Edge> {
    validateEntityId(sourceId, 'Edge source');
    validateEntityId(targetId, 'Edge target');

    if (!this.nodes.has(sourceId) || this.nodes.get(sourceId)?.deleted) {
      throw new EntityNotFoundError(sourceId, 'Node');
    }
    if (!this.nodes.has(targetId) || this.nodes.get(targetId)?.deleted) {
      throw new EntityNotFoundError(targetId, 'Node');
    }

    const id = options?.id || generateUUID();
    validateEntityId(id, 'Edge');

    if (this.edges.has(id)) {
      throw new DuplicateEntityError(id, 'Edge');
    }

    const now = new Date();
    const newEdge: Edge = {
      id,
      source: sourceId,
      target: targetId,
      relation,
      data: options?.data ? deepClone(options.data) : undefined,
      createdAt: now,
      updatedAt: now,
      version: options?.version ?? 1,
      deleted: false,
    };
    validateEdge(newEdge);

    this.edges.set(id, newEdge);
    await this.storageAdapter.saveEdge(newEdge);
    this.observable.notify({ type: 'edge:added', entity: deepClone(newEdge) });
    return deepClone(newEdge);
  }

  /**
   * Retrieves an edge by its ID.
   * @param id The ID of the edge.
   * @returns The Edge object.
   * @throws {EntityNotFoundError} if the edge is not found.
   */
  public getEdge(id: EntityId): Edge {
    validateEntityId(id, 'Edge');
    const edge = this.edges.get(id);
    if (!edge || edge.deleted) {
      throw new EntityNotFoundError(id, 'Edge');
    }
    return deepClone(edge);
  }

  /**
   * Updates an existing edge.
   * @param id The ID of the edge to update.
   * @param newData The new data to merge into the edge's existing data.
   * @param options Optional EdgeOptions including version for optimistic concurrency.
   * @returns A Promise that resolves with the updated Edge.
   * @throws {EntityNotFoundError} if the edge is not found.
   * @throws {ConflictError} if an optimistic concurrency conflict occurs.
   */
  public async updateEdge(id: EntityId, newData: Record<string, any>, options?: EdgeOptions): Promise<Edge> {
    validateEntityId(id, 'Edge');
    const existingEdge = this.edges.get(id);
    if (!existingEdge || existingEdge.deleted) {
      throw new EntityNotFoundError(id, 'Edge');
    }

    if (options?.version !== undefined && options.version !== existingEdge.version) {
      throw new ConflictError(id, `Expected version ${options.version}, but current version is ${existingEdge.version}.`);
    }

    const oldEdge = deepClone(existingEdge);
    const updatedEdge: Edge = {
      ...existingEdge,
      data: existingEdge.data ? { ...existingEdge.data, ...newData } : newData, // Merge or set new data
      updatedAt: new Date(),
      version: existingEdge.version + 1,
    };
    validateEdge(updatedEdge);

    this.edges.set(id, updatedEdge);
    await this.storageAdapter.saveEdge(updatedEdge);
    this.observable.notify({ type: 'edge:updated', entity: deepClone(updatedEdge), oldEntity: oldEdge });
    return deepClone(updatedEdge);
  }

  /**
   * Deletes an edge from the graph.
   * @param id The ID of the edge to delete.
   * @param softDelete If true, marks the edge as deleted instead of physically removing it. Default is true.
   * @returns A Promise that resolves when the edge is deleted.
   * @throws {EntityNotFoundError} if the edge is not found.
   */
  public async deleteEdge(id: EntityId, softDelete: boolean = true): Promise<void> {
    validateEntityId(id, 'Edge');
    const existingEdge = this.edges.get(id);
    if (!existingEdge || existingEdge.deleted) {
      throw new EntityNotFoundError(id, 'Edge');
    }

    const oldEdge = deepClone(existingEdge);

    if (softDelete) {
      const deletedEdge: Edge = {
        ...existingEdge,
        deleted: true,
        updatedAt: new Date(),
        version: existingEdge.version + 1,
      };
      this.edges.set(id, deletedEdge);
      await this.storageAdapter.saveEdge(deletedEdge);
    } else {
      this.edges.delete(id);
      await this.storageAdapter.deleteEdge(id);
    }

    this.observable.notify({ type: 'edge:deleted', entity: oldEdge });
  }

  /**
   * Applies a batch of changes to the graph store atomically.
   * This is typically used by synchronization strategies.
   * @param batch The batch of changes to apply.
   * @returns A Promise that resolves when the batch is applied.
   */
  public async applyBatch(batch: GraphBatch): Promise<void> {
    const nodesToSaveMap = new Map<EntityId, Node>();
    const nodeIdsToDeleteSet = new Set<EntityId>();
    const edgesToSaveMap = new Map<EntityId, Edge>();
    const edgeIdsToDeleteSet = new Set<EntityId>();

    const events: GraphChangeEvent[] = [];

    // Process nodes to add/update
    batch.nodesToAddOrUpdate?.forEach(newNode => {
      validateNode(newNode);
      const existingNode = this.nodes.get(newNode.id);
      if (existingNode) {
        const resolution = this.conflictResolver.resolveNodeConflict(existingNode, newNode);
        if (resolution.wasModified || existingNode.version < resolution.resolvedEntity.version) {
          nodesToSaveMap.set(resolution.resolvedEntity.id, resolution.resolvedEntity);
          this.nodes.set(resolution.resolvedEntity.id, resolution.resolvedEntity);
          events.push({ type: 'node:updated', entity: deepClone(resolution.resolvedEntity), oldEntity: deepClone(existingNode) });
        }
      } else {
        nodesToSaveMap.set(newNode.id, newNode);
        this.nodes.set(newNode.id, newNode);
        events.push({ type: 'node:added', entity: deepClone(newNode) });
      }
    });

    // Process edges to add/update
    batch.edgesToAddOrUpdate?.forEach(newEdge => {
      validateEdge(newEdge);
      const existingEdge = this.edges.get(newEdge.id);
      if (existingEdge) {
        const resolution = this.conflictResolver.resolveEdgeConflict(existingEdge, newEdge);
        if (resolution.wasModified || existingEdge.version < resolution.resolvedEntity.version) {
          edgesToSaveMap.set(resolution.resolvedEntity.id, resolution.resolvedEntity);
          this.edges.set(resolution.resolvedEntity.id, resolution.resolvedEntity);
          events.push({ type: 'edge:updated', entity: deepClone(resolution.resolvedEntity), oldEntity: deepClone(existingEdge) });
        }
      } else {
        edgesToSaveMap.set(newEdge.id, newEdge);
        this.edges.set(newEdge.id, newEdge);
        events.push({ type: 'edge:added', entity: deepClone(newEdge) });
      }
    });

    // Process node deletions
    batch.nodeIdsToDelete?.forEach(id => {
      validateEntityId(id, 'Node');
      const existingNode = this.nodes.get(id);
      if (existingNode && !existingNode.deleted) {
        nodeIdsToDeleteSet.add(id);
        this.nodes.delete(id); // Actual deletion from in-memory
        events.push({ type: 'node:deleted', entity: deepClone(existingNode) });
        // Also mark associated edges for deletion
        this.edges.forEach(edge => {
          if ((edge.source === id || edge.target === id) && !edge.deleted) {
            edgeIdsToDeleteSet.add(edge.id);
            this.edges.delete(edge.id); // Actual deletion from in-memory
            events.push({ type: 'edge:deleted', entity: deepClone(edge) });
          }
        });
      }
    });

    // Process edge deletions
    batch.edgeIdsToDelete?.forEach(id => {
      validateEntityId(id, 'Edge');
      const existingEdge = this.edges.get(id);
      if (existingEdge && !existingEdge.deleted) {
        edgeIdsToDeleteSet.add(id);
        this.edges.delete(id); // Actual deletion from in-memory
        events.push({ type: 'edge:deleted', entity: deepClone(existingEdge) });
      }
    });

    await this.storageAdapter.applyBatch(
      nodesToSaveMap,
      nodeIdsToDeleteSet,
      edgesToSaveMap,
      edgeIdsToDeleteSet
    );

    events.forEach(event => this.observable.notify(event));
  }

  /**
   * Queries the graph for nodes and edges based on specified criteria.
   * This is a basic query mechanism. For complex graph traversals,
   * you might build a dedicated query builder or graph traversal engine.
   * @param query The GraphQuery object defining criteria.
   * @returns An object containing matching nodes and edges.
   */
  public query(query: GraphQuery): { nodes: Node[]; edges: Edge[] } {
    const matchingNodes: Node[] = [];
    const matchingEdges: Edge[] = [];

    // Filter nodes
    this.nodes.forEach(node => {
      if (node.deleted) return;
      let matches = true;
      if (query.nodeIds && !query.nodeIds.includes(node.id)) {
        matches = false;
      }
      if (query.nodeTypes && !query.nodeTypes.includes(node.type)) {
        matches = false;
      }
      if (matches) {
        matchingNodes.push(deepClone(node));
      }
    });

    // Filter edges
    this.edges.forEach(edge => {
      if (edge.deleted) return;
      let matches = true;
      if (query.edgeIds && !query.edgeIds.includes(edge.id)) {
        matches = false;
      }
      if (query.edgeRelations && !query.edgeRelations.includes(edge.relation)) {
        matches = false;
      }
      // Ensure source and target nodes exist and are not deleted
      if (!this.nodes.has(edge.source) || this.nodes.get(edge.source)?.deleted) {
        matches = false;
      }
      if (!this.nodes.has(edge.target) || this.nodes.get(edge.target)?.deleted) {
        matches = false;
      }

      if (matches) {
        matchingEdges.push(deepClone(edge));
      }
    });

    return { nodes: matchingNodes, edges: matchingEdges };
  }

  /**
   * Gets all nodes in the store.
   * @returns A Map of all nodes, keyed by ID.
   */
  public getAllNodes(): Map<EntityId, Node> {
    const activeNodes = new Map<EntityId, Node>();
    this.nodes.forEach((node, id) => {
      if (!node.deleted) {
        activeNodes.set(id, deepClone(node));
      }
    });
    return activeNodes;
  }

  /**
   * Gets all edges in the store.
   * @returns A Map of all edges, keyed by ID.
   */
  public getAllEdges(): Map<EntityId, Edge> {
    const activeEdges = new Map<EntityId, Edge>();
    this.edges.forEach((edge, id) => {
      if (!edge.deleted) {
        activeEdges.set(id, deepClone(edge));
      }
    });
    return activeEdges;
  }
}

