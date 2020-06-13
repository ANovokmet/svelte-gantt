import { writable, Readable, derived } from 'svelte/store';
import { SvelteTask } from './task';
import { SvelteRow } from './row';
import { SvelteTimeRange } from './timeRange';

interface EntityState<T> {
    ids: number[],
    entities: { [key: number]: T }
}

interface EntityType {
    model: { id: number }
}

export interface EntityStore<T extends EntityType> extends Readable<EntityState<T>> {
    _update(updater: (value: EntityState<T>) => EntityState<T>): void;
    add(entity: T): void;
    update(entity: T): void;
    addAll(entities: T[]): void;
    refresh(): void;
    set(value: EntityState<T>): void;
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
        update: (item: T) => update(({ ids, entities }) => ({
            ids,
            entities: {
                ...entities,
                [item.model.id]: item
            }
        })),
        addAll: (items: T[]) => {
            const ids = [];
            const entities = {};

            for(const entity of items) {
                ids.push(entity.model.id);
                entities[entity.model.id] = entity;
            }

            set({ ids, entities });
        },
        refresh: () => update(store => ({...store}))
    };
}

export const taskStore = createEntityStore<SvelteTask>();
export const rowStore = createEntityStore<SvelteRow>();
export const timeRangeStore = createEntityStore<SvelteTimeRange>();

export const allTasks = derived(taskStore, ({ids, entities}) => ids.map(id => entities[id]));
export const allRows = derived(rowStore, ({ids, entities}) => ids.map(id => entities[id]));
export const allTimeRanges = derived(timeRangeStore, ({ids, entities}) => ids.map(id => entities[id]));

export const filteredRows = derived(allRows, $allRows => $allRows.filter(row => !row.hidden));

export const rowTaskCache = derived(allTasks, $allTasks => {
    return $allTasks.reduce((cache, task) => {
        if (!cache[task.model.resourceId]) 
            cache[task.model.resourceId] = [];
        cache[task.model.resourceId].push(task.model.id);
        return cache;
    }, {});
});
