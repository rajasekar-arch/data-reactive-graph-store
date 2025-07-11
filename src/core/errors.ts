// src/core/errors.ts

import { EntityId } from "./types";

/**
 * Base error class for all graph store related issues.
 */
export class GraphStoreError extends Error {
  public readonly name: string = 'GraphStoreError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GraphStoreError.prototype);
  }
}

/**
 * Error thrown when an entity (Node or Edge) is not found.
 */
export class EntityNotFoundError extends GraphStoreError {
  public readonly name: string = 'EntityNotFoundError';
  constructor(id: EntityId, type: 'Node' | 'Edge') {
    super(`${type} with ID '${id}' not found.`);
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}

/**
 * Error thrown when a duplicate entity ID is encountered during creation.
 */
export class DuplicateEntityError extends GraphStoreError {
  public readonly name: string = 'DuplicateEntityError';
  constructor(id: EntityId, type: 'Node' | 'Edge') {
    super(`${type} with ID '${id}' already exists.`);
    Object.setPrototypeOf(this, DuplicateEntityError.prototype);
  }
}

/**
 * Error thrown when an optimistic concurrency conflict occurs.
 */
export class ConflictError extends GraphStoreError {
  public readonly name: string = 'ConflictError';
  constructor(id: EntityId, message: string = 'Optimistic concurrency conflict.') {
    super(`Conflict for entity '${id}': ${message}`);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error thrown when an invalid argument is provided to a graph operation.
 */
export class InvalidArgumentError extends GraphStoreError {
  public readonly name: string = 'InvalidArgumentError';
  constructor(message: string) {
    super(`Invalid argument: ${message}`);
    Object.setPrototypeOf(this, InvalidArgumentError.prototype);
  }
}

/**
 * Error thrown when a storage operation fails.
 */
export class StorageError extends GraphStoreError {
  public readonly name: string = 'StorageError';
  constructor(message: string, public readonly originalError?: any) {
    super(`Storage operation failed: ${message}`);
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Error thrown when a synchronization operation fails.
 */
export class SyncError extends GraphStoreError {
  public readonly name: string = 'SyncError';
  constructor(message: string, public readonly originalError?: any) {
    super(`Synchronization failed: ${message}`);
    Object.setPrototypeOf(this, SyncError.prototype);
  }
}
