// src/core/types.ts

/**
 * Represents a unique identifier for a Node or Edge.
 */
export type EntityId = string;

/**
 * Base interface for any entity in the graph (Node or Edge).
 */
export interface GraphEntity {
  id: EntityId;
  createdAt: Date;
  updatedAt: Date;
  version: number; // For optimistic concurrency or CRDT-like versioning
  deleted?: boolean; // Soft delete flag
  [key: string]: any; // Allow arbitrary properties
}

/**
 * Represents a Node in the graph.
 */
export interface Node extends GraphEntity {
  type: string; // e.g., 'User', 'Post', 'Product'
  data: Record<string, any>; // Arbitrary data associated with the node
}

/**
 * Represents an Edge connecting two Nodes in the graph.
 */
export interface Edge extends GraphEntity {
  source: EntityId; // ID of the source Node
  target: EntityId; // ID of the target Node
  relation: string; // e.g., 'FOLLOWS', 'LIKES', 'HAS_PRODUCT'
  data?: Record<string, any>; // Arbitrary data associated with the edge
}

/**
 * Represents a change event in the graph.
 */
export interface GraphChangeEvent {
  type: 'node:added' | 'node:updated' | 'node:deleted' | 'edge:added' | 'edge:updated' | 'edge:deleted';
  entity: Node | Edge;
  oldEntity?: Node | Edge; // For update/delete events
}

/**
 * Options for adding or updating a Node.
 */
export interface NodeOptions {
  id?: EntityId; // Optional ID for new nodes (will be generated if not provided)
  data?: Record<string, any>;
  version?: number; // For optimistic concurrency
}

/**
 * Options for adding or updating an Edge.
 */
export interface EdgeOptions {
  id?: EntityId; // Optional ID for new edges (will be generated if not provided)
  data?: Record<string, any>;
  version?: number; // For optimistic concurrency
}

/**
 * Represents a query for graph entities.
 */
export interface GraphQuery {
  nodeIds?: EntityId[];
  edgeIds?: EntityId[];
  nodeTypes?: string[];
  edgeRelations?: string[];
  // Add more complex query capabilities as needed (e.g., data filters, path queries)
}

/**
 * Represents a batch of changes to be applied atomically.
 */
export interface GraphBatch {
  nodesToAddOrUpdate?: Node[];
  edgesToAddOrUpdate?: Edge[];
  nodeIdsToDelete?: EntityId[];
  edgeIdsToDelete?: EntityId[];
}

/**
 * Interface for a subscriber function to graph changes.
 */
export type GraphChangeSubscriber = (event: GraphChangeEvent) => void;

/**
 * Interface for a function to unsubscribe from graph changes.
 */
export type Unsubscribe = () => void;