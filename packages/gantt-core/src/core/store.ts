import type { SvelteTask } from './task';
import type { SvelteRow } from './row';
import type { SvelteTimeRange } from './timeRange';
import { memo } from '../utils/getters';

export interface EntityState<T, K = PropertyKey> {
  ids: K[];
  entities: { [key: PropertyKey]: T };
}

interface EntityType<K = PropertyKey> {
  model: { id: K };
  hidden?: boolean;
}

export type EntityKey = string | number | symbol;

export interface EntityStore<T extends EntityType, K extends EntityKey = EntityKey> {
  updateRaw(updater: (value: EntityState<T>) => EntityState<T>): void;
  add(entity: T): void;
  addAll(entities: T[]): void;
  update(entity: T): void;
  upsert(entity: T): void;
  upsertAll(entities: T[]): void;
  delete(id: K): void;
  deleteAll(ids: K[]): void;
  refresh(): void;
  set(value: EntityState<T>): void;
  entities: Record<K, T>;
  ids: PropertyKey[];
  readonly all: T[];
}

type EntityStoreProps<T extends EntityType> = {
  readonly state: EntityState<T>;
  onStateChange: (state: EntityState<T>) => void;
}

function createEntityStore<T extends EntityType, K extends EntityKey = EntityKey>(
  options: EntityStoreProps<T>,
): EntityStore<T, K> {
  // state = { ids: [], entities: {} }

  function update(fn: (prev: EntityState<T>) => EntityState<T>) {
    // untrack(() => {
    //   const next = fn(options.state);

    //   options.state = next;
    // });
    const next = fn(options.state);
    options.onStateChange(next);
  }

  function set(next: EntityState<T>) {
    // untrack(() => {
    //   options.state = next;
    // });
    options.onStateChange(next);
  }

  const all = memo(() => [options.state], state => state.ids.map(id => options.state.entities[id]));

  return {
    get ids() {
      return options.state.ids;
    },
    get entities() {
      return options.state.entities as Record<K, T>;
    },
    get all() {
      return all();
    },
    set,
    updateRaw: update,
    add: (item: T) => update(({ ids, entities }) => ({
      ids: [...ids, item.model.id],
      entities: {
        ...entities,
        [item.model.id]: item
      }
    })),
    delete: (id: K) => update(state => {
      const { [id]: _, ...entities } = state.entities;
      return {
        ids: state.ids.filter(i => i !== id),
        entities
      };
    }),
    deleteAll: (ids: K[]) => update(state => {
      const entities = { ...state.entities };
      const idSet = new Set(ids);

      for (let i = 0; i < state.ids.length; i++) {
        if (idSet.has(state.ids[i] as K)) {
          delete entities[state.ids[i]];
        }
      }

      return {
        ids: state.ids.filter(i => !idSet.has(i as K)),
        entities
      };
    }),
    update: (item: T) => update(({ ids, entities }) => ({
      ids,
      entities: {
        ...entities,
        [item.model.id]: item
      }
    })),
    upsert: (item: T) => update(({ ids, entities }) => {
      const hasIndex = ids.indexOf(item.model.id) !== -1;

      return {
        ids: hasIndex ? ids : [...ids, item.model.id],
        entities: {
          ...entities,
          [item.model.id]: item
        }
      };
    }),
    upsertAll: (items: T[]) => update(state => {
      const entities = { ...state.entities };
      const ids = [...state.ids];

      for (let i = 0; i < items.length; i++) {
        if (ids.indexOf(items[i].model.id) === -1) {
          ids.push(items[i].model.id);
        }
        entities[items[i].model.id] = items[i];
      }

      return {
        ids,
        entities
      };
    }),
    addAll: (items: T[]) => {
      const ids = [];
      const entities = {};

      for (let i = 0; i < items.length; i++) {
        ids.push(items[i].model.id);
        entities[items[i].model.id] = items[i];
      }

      // untrack(() => {
      //   options.state.ids = ids;
      //   options.state.entities = entities;
      // })

      set({ ids, entities });
    },
    refresh: () => update(store => ({ ...store }))
  };
}

type DataStoreProps = {
  state: DataStoreState;
  onStateChange: (state: DataStoreState) => void;
}

type DataStoreState = {
  tasks: EntityState<SvelteTask>;
  rows: EntityState<SvelteRow>;
  timeRanges: EntityState<SvelteTimeRange>;
}

export function createDataStore(options: DataStoreProps) {
  const taskStore = createEntityStore<SvelteTask>({
    get state() {
      return options.state.tasks;
    },
    onStateChange(state) {
      options.onStateChange({
        ...options.state,
        tasks: state,
      });
    },
  });

  const rowStore = createEntityStore<SvelteRow>({
    get state() {
      return options.state.rows;
    },
    onStateChange(state) {
      options.onStateChange({
        ...options.state,
        rows: state,
      });
    },
  });

  const timeRangeStore = createEntityStore<SvelteTimeRange>({
    get state() {
      return options.state.timeRanges;
    },
    onStateChange(state) {
      options.onStateChange({
        ...options.state,
        timeRanges: state,
      });
    },
  });

  const rowTaskCache = memo(() => [taskStore.all], allTasks => {
    const cache: { [rowId: PropertyKey]: PropertyKey[]; } = {};
    for (const task of allTasks) {
      if (!cache[task.model.resourceId]) {
        cache[task.model.resourceId] = [];
      }
      cache[task.model.resourceId].push(task.model.id);
    }
    return cache;
  });

  return {
    taskStore,
    rowStore,
    timeRangeStore,
    get rowTaskCache() { return rowTaskCache(); },
  };
}

export type GanttDataStore = ReturnType<typeof createDataStore>;
