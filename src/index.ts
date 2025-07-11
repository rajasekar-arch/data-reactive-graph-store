export { GraphStore } from './core/GraphStore';
export type { GraphStoreConfig } from './core/GraphStore';

// Core Types
export type {
  EntityId,
  GraphEntity,
  Node,
  Edge,
  GraphChangeEvent,
  GraphChangeSubscriber,
  Unsubscribe,
  NodeOptions,
  EdgeOptions,
  GraphBatch,
  GraphQuery,
} from './core/types';

// Errors
export {
  GraphStoreError,
  EntityNotFoundError,
  DuplicateEntityError,
  ConflictError,
  InvalidArgumentError,
  StorageError,
  SyncError,
} from './core/errors';

// Storage Adapters
export type { IStorageAdapter } from './storage/IStorageAdapter';
export { InMemoryStorageAdapter } from './storage/InMemoryStorageAdapter';

// Sync Strategies & Conflict Resolvers
export type { ISyncStrategy } from './sync/ISyncStrategy';
export type { SyncChanges, RemoteData } from './sync/ISyncStrategy';
export { NoOpSyncStrategy } from './sync/NoOpSyncStrategy';
export type { IConflictResolver } from './sync/IConflictResolver';
export type { ConflictResolutionResult } from './sync/IConflictResolver';
export { BasicTimestampConflictResolver } from './sync/BasicTimestampConflictResolver';

// Query Builder
export { GraphQueryBuilder } from './query/GraphQueryBuilder';

// Utilities (for advanced use or testing)
export { generateUUID, deepClone } from './utils'; // resetCircularIdCounter is from previous package, not directly used here.

