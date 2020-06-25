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
    addAll(entities: T[]): void;
    update(entity: T): void;
    upsert(entity: T): void;
    upsertAll(entities: T[]): void;
    delete(id: number): void;
    deleteAll(ids: number[]): void;
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
        delete: (id: number) => update(state => {
            const { [id]: _, ...entities } = state.entities;
            return {
                ids: state.ids.filter(i => i !== id),
                entities
            };
        }),
        deleteAll: (ids: number[]) => update(state => {
            const entities = { ...state.entities };
            const idState = {};

            ids.forEach(id => {
                delete entities[id];
                idState[id] = true;
            });

            return {
                ids: state.ids.filter(i => !idState[i]),
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

            items.forEach(item => {
                if (!entities[item.model.id]) {
                    ids.push(item.model.id);
                }
                entities[item.model.id] = item;
            });

            return {
                ids,
                entities
            };
        }),
        addAll: (items: T[]) => {
            const ids = [];
            const entities = {};

            for (const entity of items) {
                ids.push(entity.model.id);
                entities[entity.model.id] = entity;
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
    return $allTasks.reduce((cache, task) => {
        if (!cache[task.model.resourceId])
            cache[task.model.resourceId] = [];
        cache[task.model.resourceId].push(task.model.id);
        return cache;
    }, {});
});


export function all<T extends EntityType>(store: EntityStore<T>): Readable<T[]> {
    return derived(store, ({ ids, entities }) => ids.map(id => entities[id]));
}

export function where<T extends EntityType>(store: EntityStore<T>, filterFn: (value: T) => any): Readable<T[]> {
    return derived(store, ({ ids, entities }) => {
        const result = [];
        for(const id of ids) {
            const entity = entities[id];
            if(filterFn(entity)) {
                result.push(entity);
            }
        }
        return result;
    });
}
