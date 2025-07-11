// src/utils/index.ts

import { EntityId, Node, Edge } from '../core/types';
import { InvalidArgumentError } from '../core/errors';

/**
 * Generates a simple UUID (v4) for entity IDs.
 * In a real-world scenario, consider a more robust UUID library or ULID for better sorting.
 */
export function generateUUID(): EntityId {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Performs a deep clone of an object.
 * Uses structuredClone if available (browser, Node.js 17+), falls back to JSON.parse/stringify.
 * NOTE: JSON.parse/stringify has limitations (e.g., no functions, undefined, BigInt, circular refs).
 * For production, consider a dedicated deep cloning library for full fidelity.
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  // Fallback for older environments or if structuredClone is not available
  // WARNING: This fallback has limitations (e.g., won't clone functions, undefined, BigInt, circular refs will error)
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Validates if an ID is a non-empty string.
 * @param id The ID to validate.
 * @param entityType The type of entity (e.g., 'Node', 'Edge') for error messages.
 * @throws {InvalidArgumentError} if the ID is invalid.
 */
export function validateEntityId(id: EntityId, entityType: string): void {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new InvalidArgumentError(`${entityType} ID cannot be empty.`);
  }
}

/**
 * Validates if a Node object is valid.
 * @param node The Node object to validate.
 * @throws {InvalidArgumentError} if the Node is invalid.
 */
export function validateNode(node: Node): void {
  validateEntityId(node.id, 'Node');
  if (!node.type || typeof node.type !== 'string' || node.type.trim() === '') {
    throw new InvalidArgumentError('Node must have a non-empty type.');
  }
  if (typeof node.data !== 'object' || node.data === null) {
    throw new InvalidArgumentError('Node must have a data object.');
  }
}

/**
 * Validates if an Edge object is valid.
 * @param edge The Edge object to validate.
 * @throws {InvalidArgumentError} if the Edge is invalid.
 */
export function validateEdge(edge: Edge): void {
  validateEntityId(edge.id, 'Edge');
  validateEntityId(edge.source, 'Edge source');
  validateEntityId(edge.target, 'Edge target');
  if (!edge.relation || typeof edge.relation !== 'string' || edge.relation.trim() === '') {
    throw new InvalidArgumentError('Edge must have a non-empty relation.');
  }
  if (edge.data !== undefined && (typeof edge.data !== 'object' || edge.data === null)) {
    throw new InvalidArgumentError('Edge data must be an object or undefined.');
  }
}