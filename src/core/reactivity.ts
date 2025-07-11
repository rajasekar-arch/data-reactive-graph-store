// src/core/reactivity.ts

import { GraphChangeEvent, GraphChangeSubscriber, Unsubscribe } from './types';

/**
 * A simple Observable implementation for reactive graph updates.
 * This allows subscribers to be notified of graph changes.
 */
export class GraphObservable {
  private subscribers: Set<GraphChangeSubscriber> = new Set();

  /**
   * Notifies all subscribers about a graph change event.
   * @param event The GraphChangeEvent to dispatch.
   */
  public notify(event: GraphChangeEvent): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error in graph change subscriber:', error);
        // In a production system, you might want more sophisticated error handling
        // for subscriber errors (e.g., removing the faulty subscriber, logging to a service).
      }
    });
  }

  /**
   * Subscribes to graph change events.
   * @param subscriber The function to call when a change occurs.
   * @returns An unsubscribe function to stop receiving updates.
   */
  public subscribe(subscriber: GraphChangeSubscriber): Unsubscribe {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Checks if there are any active subscribers.
   * @returns True if there are subscribers, false otherwise.
   */
  public hasSubscribers(): boolean {
    return this.subscribers.size > 0;
  }
}
