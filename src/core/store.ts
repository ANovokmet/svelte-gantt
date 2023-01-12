import { writable, derived } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { SvelteTask } from './task';
import type { SvelteRow } from './row';
import type { SvelteTimeRange } from './timeRange';

interface EntityState<T> {
    ids: (string | number)[],
    entities: { [key: string]: T }
}

interface EntityType {
    model: { id: number | string },
    hidden?: boolean
}

export interface EntityStore<T extends EntityType> extends Readable<EntityState<T>> {
    _update(updater: (value: EntityState<T>) => EntityState<T>): void;
    add(entity: T): void;
    addAll(entities: T[]): void;
    update(entity: T): void;
    upsert(entity: T): void;
    upsertAll(entities: T[]): void;
    delete(id: number | string): void;
    deleteAll(ids: (number | string)[]): void;
    refresh(): void;
    set(value: EntityState<T>): void;
    entities?:any;
}

function createEntityStore<T extends EntityType>(): EntityStore<T> {
    const { subscribe, set, update } = writable<EntityState<T>>({ ids: [], entities: {} });

    return {
        set,
        _update: update,
        subscribe,
        add: (item: T) => update(({ ids, entities }) => ({
            ids: [...ids, item.model.id],
            entities: {
                ...entities,
                [item.model.id]: item
            }
        })),
        delete: (id: number | string) => update(state => {
            const { [id]: _, ...entities } = state.entities;
            return {
                ids: state.ids.filter(i => i !== id),
                entities
            };
        }),
        deleteAll: (ids: (number | string)[]) => update(state => {
            const entities = { ...state.entities };
            const idSet = new Set(ids);
        
            for (let i = 0; i < state.ids.length; i++) {
                if (idSet.has(state.ids[i])) {
                    delete entities[state.ids[i]];
                }
            }
        
            return {
                ids: state.ids.filter(i => !idSet.has(i)),
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
            }
        }),
        upsertAll: (items: T[]) => update(state => {
            const entities = { ...state.entities };
            const ids = [...state.ids];

            for (let i = 0; i < items.length; i++) {
                if (!ids.includes(items[i].model.id)) {
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

            set({ ids, entities });
        },
        refresh: () => update(store => ({ ...store }))
    };
}

export const taskStore = createEntityStore<SvelteTask>();
export const rowStore = createEntityStore<SvelteRow>();
export const timeRangeStore = createEntityStore<SvelteTimeRange>();

export const allTasks = all(taskStore);
export const allRows = all(rowStore);
export const allTimeRanges = all(timeRangeStore);

export const rowTaskCache = derived(allTasks, $allTasks => {
    const cache = {};
    for (let i = 0; i < $allTasks.length; i++) {
        const task = $allTasks[i];
        if (!cache[task.model.resourceId]) {
            cache[task.model.resourceId] = [];
        }
    cache[task.model.resourceId].push(task.model.id);
    }
    return cache;
});

export function all<T extends EntityType>(store: EntityStore<T>): Readable<T[]> {
    return derived(store, ({ ids, entities }) => {
        const results = [];
        for (let i = 0; i < ids.length; i++) {
            results.push(entities[ids[i]]);
        }
        return results;
    });
}

export function where<T extends EntityType>(store: EntityStore<T>, filterFn: (value: T) => any): Readable<T[]> {
    return derived(store, ({ ids, entities }) => {
        const results = [];
        for (let i = 0; i < ids.length; i++) {
            if (filterFn(entities[ids[i]])) {
                results.push(entities[ids[i]]);
            }
        }
        return results;
    });
}