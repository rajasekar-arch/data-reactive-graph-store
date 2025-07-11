// src/query/GraphQueryBuilder.ts

import { GraphStore } from '../core/GraphStore';
import { Node, Edge, EntityId, GraphQuery } from '../core/types';

/**
 * A fluent API for building and executing graph queries.
 * This class provides a more readable way to construct complex queries.
 */
export class GraphQueryBuilder {
  private store: GraphStore;
  private currentQuery: GraphQuery = {};

  constructor(store: GraphStore) {
    this.store = store;
  }

  /**
   * Filters nodes by their IDs.
   * @param nodeIds A single ID or an array of IDs.
   * @returns The GraphQueryBuilder instance for chaining.
   */
  public withNodeIds(nodeIds: EntityId | EntityId[]): GraphQueryBuilder {
    this.currentQuery.nodeIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    return this;
  }

  /**
   * Filters nodes by their types.
   * @param nodeTypes A single type string or an array of type strings.
   * @returns The GraphQueryBuilder instance for chaining.
   */
  public withNodeTypes(nodeTypes: string | string[]): GraphQueryBuilder {
    this.currentQuery.nodeTypes = Array.isArray(nodeTypes) ? nodeTypes : [nodeTypes];
    return this;
  }

  /**
   * Filters edges by their IDs.
   * @param edgeIds A single ID or an array of IDs.
   * @returns The GraphQueryBuilder instance for chaining.
   */
  public withEdgeIds(edgeIds: EntityId | EntityId[]): GraphQueryBuilder {
    this.currentQuery.edgeIds = Array.isArray(edgeIds) ? edgeIds : [edgeIds];
    return this;
  }

  /**
   * Filters edges by their relations.
   * @param edgeRelations A single relation string or an array of relation strings.
   * @returns The GraphQueryBuilder instance for chaining.
   */
  public withEdgeRelations(edgeRelations: string | string[]): GraphQueryBuilder {
    this.currentQuery.edgeRelations = Array.isArray(edgeRelations) ? edgeRelations : [edgeRelations];
    return this;
  }

  // --- Advanced Query Methods (Conceptual - would require more complex graph traversal logic) ---

  /**
   * Finds all nodes connected to a given node by a specific relation.
   * This would typically involve traversing edges.
   * @param startNodeId The ID of the starting node.
   * @param relation The relation type to follow (e.g., 'FOLLOWS').
   * @param direction 'out' for outgoing edges, 'in' for incoming edges, 'both' for both.
   * @returns The GraphQueryBuilder instance for chaining.
   */
  // public connectedTo(startNodeId: EntityId, relation?: string, direction: 'out' | 'in' | 'both' = 'out'): GraphQueryBuilder {
  //   // This method would internally modify currentQuery to include connected nodes/edges
  //   // and would require actual graph traversal logic within the store.
  //   // For now, it's a placeholder.
  //   console.warn('GraphQueryBuilder.connectedTo is a conceptual method and requires full graph traversal implementation.');
  //   return this;
  // }

  /**
   * Executes the built query and returns the matching nodes and edges.
   * @returns An object containing matching nodes and edges.
   */
  public execute(): { nodes: Node[]; edges: Edge[] } {
    return this.store.query(this.currentQuery);
  }

  /**
   * Resets the query builder to its initial state.
   * @returns The GraphQueryBuilder instance for chaining.
   */
  public reset(): GraphQueryBuilder {
    this.currentQuery = {};
    return this;
  }
}
