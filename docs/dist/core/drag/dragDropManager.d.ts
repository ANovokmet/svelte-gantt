import { SvelteRow } from '../row';
import { Writable } from 'svelte/store';
import { EntityStore } from '../store';
export declare type DropHandler = (event: MouseEvent) => any;
export declare class DragDropManager {
    handlerMap: {
        [key: string]: DropHandler;
    };
    constructor(rowStore: Writable<EntityStore<SvelteRow>>);
    register(target: string, handler: DropHandler): void;
    getTarget(target: string, event: MouseEvent): SvelteRow;
}
