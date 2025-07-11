# data-reactive-graph-store
A client-side, reactive data store that treats data as a graph, allowing you to define relationships and query across them. It would include built-in, pluggable offline-first synchronization (e.g., CRDT-inspired merging, conflict resolution strategies) and provide reactive updates when any related part of the graph changes.

```markdown
# `data-reactive-graph-store`

[![npm version](https://badge.fury.io/js/%40data%2Freactive-graph-store.svg)](https://www.npmjs.com/package/data-reactive-graph-store)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A client-side, reactive graph data store designed for managing complex, interconnected data with a focus on extensibility for offline-first synchronization and conflict resolution.

## 🌟 Why `data-reactive-graph-store`?

Traditional state management often treats data as hierarchical trees. However, many real-world applications (social networks, collaborative documents, knowledge graphs) inherently manage data as a graph. This package provides a robust foundation for:

* **Graph-Oriented Data Model:** Store and manage data as nodes and edges, defining explicit relationships.
* **Reactive Updates:** Get notified in real-time when any part of the graph changes.
* **Pluggable Architecture:** Easily swap out storage mechanisms (in-memory, IndexedDB, etc.) and integrate custom synchronization strategies (e.g., with a remote backend) and conflict resolvers.
* **Offline-First Readiness:** Designed with synchronization in mind, providing hooks for advanced merging logic (like CRDTs).
* **Type-Safe:** Built entirely with TypeScript for a robust and error-resistant development experience.

## ✨ Features

* **Node & Edge Management:** Add, get, update, and delete nodes and edges.
* **Reactive API:** Subscribe to granular graph change events.
* **Optimistic Concurrency:** Built-in versioning for conflict detection.
* **Soft Deletion:** Option to logically delete entities without physical removal.
* **Pluggable Storage:** Use the default in-memory store or implement your own `IStorageAdapter`.
* **Pluggable Synchronization:** Integrate with remote backends via `ISyncStrategy`.
* **Pluggable Conflict Resolution:** Define how conflicting data versions are merged using `IConflictResolver`.
* **Basic Querying:** Find nodes and edges by ID, type, or relation.

## 🚀 Installation

```bash
npm install data-reactive-graph-store
# Or using yarn:
# yarn add data-reactive-graph-store
```

## 📚 Usage

### 1. Initialize the Graph Store

```typescript
import { GraphStore, InMemoryStorageAdapter, BasicTimestampConflictResolver, NoOpSyncStrategy } from 'data-reactive-graph-store';

async function runApp() {
  // Option 1: Basic in-memory store (data lost on refresh)
  const store = new GraphStore();

  // Option 2: Configure with custom adapters (e.g., for IndexedDB, a real sync backend)
  // const myIndexedDBAdapter = new MyIndexedDBAdapter(); // You'd implement this
  // const myRealSyncStrategy = new MyRealSyncStrategy(); // You'd implement this
  // const myCRDTResolver = new MyCRDTConflictResolver(); // You'd implement this

  // const store = new GraphStore({
  //   storageAdapter: myIndexedDBAdapter,
  //   syncStrategy: myRealSyncStrategy,
  //   conflictResolver: myCRDTResolver,
  //   syncIntervalMs: 5000 // Sync every 5 seconds
  // });

  await store.init();
  console.log('Graph store initialized and ready.');

  // --- 2. Subscribe to Changes (Reactivity) ---
  const unsubscribe = store.subscribe(event => {
    console.log(`[Graph Change] Type: ${event.type}, Entity ID: ${event.entity.id}`);
    // console.log('Entity:', event.entity);
  });

  // --- 3. Add Nodes ---
  const user1 = await store.addNode('User', { name: 'Alice', email: 'alice@example.com' });
  const user2 = await store.addNode('User', { name: 'Bob', email: 'bob@example.com' });
  const post1 = await store.addNode('Post', { title: 'First Post', content: 'Hello Graph!' });

  console.log(`Added User: ${user1.id}, Post: ${post1.id}`);

  // --- 4. Add Edges (Relationships) ---
  const edge1 = await store.addEdge(user1.id, post1.id, 'AUTHORED', { data: { timestamp: new Date() } });
  const edge2 = await store.addEdge(user1.id, user2.id, 'FOLLOWS');

  console.log(`Added Edges: ${edge1.id} (AUTHORED), ${edge2.id} (FOLLOWS)`);

  // --- 5. Get Entities ---
  try {
    const fetchedUser1 = store.getNode(user1.id);
    console.log('Fetched User 1:', fetchedUser1.data.name);

    const fetchedEdge1 = store.getEdge(edge1.id);
    console.log('Fetched Edge 1 Relation:', fetchedEdge1.relation);
  } catch (error) {
    console.error('Error fetching entity:', error);
  }

  // --- 6. Update Entities ---
  const updatedUser1 = await store.updateNode(user1.id, { name: 'Alice Smith' });
  console.log('Updated User 1 Name:', updatedUser1.data.name);

  // --- 7. Query the Graph ---
  const users = store.query({ nodeTypes: ['User'] });
  console.log('All Users:', users.nodes.map(u => u.data.name));

  const aliceAuthoredPosts = store.query({
    nodeIds: [post1.id], // Filter for post1
    edgeRelations: ['AUTHORED'] // Filter for AUTHORED edges
  });
  console.log('Alice authored edges:', aliceAuthoredPosts.edges.length); // This query is basic, for complex traversal, see GraphQueryBuilder

  // --- 8. Using GraphQueryBuilder (more fluent API) ---
  const queryBuilder = new GraphStore({}).query(store); // Pass store instance to builder
  const allPosts = queryBuilder.withNodeTypes('Post').execute();
  console.log('All Posts via QueryBuilder:', allPosts.nodes.map(p => p.data.title));

  // --- 9. Delete Entities ---
  await store.deleteNode(post1.id); // This will also soft-delete the AUTHORED edge
  console.log('Deleted Post 1.');

  try {
    store.getNode(post1.id);
  } catch (error) {
    console.log('Post 1 is indeed not found (or soft-deleted).');
  }

  // --- 10. Start/Stop Synchronization (if a real sync strategy is configured) ---
  // store.startSync(); // Starts continuous sync
  // setTimeout(() => {
  //   store.stopSync();
  //   console.log('Sync stopped.');
  // }, 10000);

  // --- 11. Clean up subscription ---
  unsubscribe();
  console.log('Unsubscribed from graph changes.');
}

runApp().catch(console.error);
```

## 🛠️ Extensibility & Pluggable Components

The core strength of `data-reactive-graph-store` lies in its modular design:

### `IStorageAdapter`

Implement this interface to persist your graph data to various backends:

* **`InMemoryStorageAdapter` (Default):** Data is lost on refresh. Good for testing.
* **`IndexedDBStorageAdapter` (Future):** For robust client-side persistence in browsers.
* **`LocalStorageAdapter` (Future):** Simpler, but less scalable for large graphs.

### `ISyncStrategy`

Implement this interface to define how your local graph store synchronizes with a remote server:

* **`NoOpSyncStrategy` (Default):** Performs no actual remote sync.
* **`PollingSyncStrategy` (Future):** Periodically fetches/pushes changes.
* **`WebSocketSyncStrategy` (Future):** Real-time synchronization via WebSockets.
* **`CRDTSyncStrategy` (Advanced Future):** For true distributed, conflict-free data merging.

### `IConflictResolver`

Implement this interface to define how conflicts are resolved during synchronization:

* **`BasicTimestampConflictResolver` (Default):** Favors the most recently updated entity.
* **`LastWriterWinsResolver` (Future):** A common strategy based on timestamps.
* **`MergeResolver` (Advanced Future):** For merging properties of conflicting entities (requires deeper CRDT concepts).

## 🔒 Security & Scalability

* **Client-Side Focus:** This library operates on the client-side. **True data security (authentication, authorization, data validation) must be enforced on your backend server.** The client-side store is for local data management and reactivity.
* **Optimistic Concurrency:** The `version` field on `Node` and `Edge` allows for optimistic concurrency control, helping detect and resolve conflicts during updates, especially in multi-user or offline scenarios.
* **Scalability:**
    * Uses `Map` objects for `O(1)` average time complexity for node/edge lookups by ID.
    * Reactive updates are targeted, notifying only relevant subscribers.
    * Pluggable storage and sync allow you to scale persistence and network interactions independently.
    * `applyBatch` method supports atomic updates to the underlying storage, crucial for consistency during sync.

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Clone your forked repository: `git clone git@github.com:rajasekar-arch/data-reactive-graph-store.git`
3.  Install dependencies: `npm install`
4.  Build the project: `npm run build`
5.  Run tests: `npm test`
6.  Create a new branch for your feature or bug fix.
7.  Make your changes, ensuring they adhere to the coding standards and include tests.
8.  Commit your changes and push to your fork.
9.  Open a pull request to the main repository.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.