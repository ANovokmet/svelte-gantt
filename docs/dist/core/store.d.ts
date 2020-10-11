import { Readable } from 'svelte/store';
import { SvelteTask } from './task';
import { SvelteRow } from './row';
import { SvelteTimeRange } from './timeRange';
interface EntityState<T> {
    ids: number[];
    entities: {
        [key: number]: T;
    };
}
interface EntityType {
    model: {
        id: number;
    };
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
export declare const taskStore: EntityStore<SvelteTask>;
export declare const rowStore: EntityStore<SvelteRow>;
export declare const timeRangeStore: EntityStore<SvelteTimeRange>;
export declare const allTasks: Readable<SvelteTask[]>;
export declare const allRows: Readable<SvelteRow[]>;
export declare const allTimeRanges: Readable<SvelteTimeRange[]>;
export declare const rowTaskCache: Readable<{}>;
export declare function all<T extends EntityType>(store: EntityStore<T>): Readable<T[]>;
export declare function where<T extends EntityType>(store: EntityStore<T>, filterFn: (value: T) => any): Readable<T[]>;
export {};
