import { Readable } from 'svelte/store';
import type { DownDropEvent } from './draggable';
import type { SvelteTask } from '../task';

export type Events = {
    'move': { x?: number; y?: number; width?: number; };
    'drop': DownDropEvent;
}

export type Handlers = { [K in keyof Events]: (data: Events[K]) => void; };

export interface DragContext {
    active: Readable<boolean>;
    handlers: { 
        [taskId: PropertyKey]: Handlers
    };
    dragging: Readable<{ [taskId: PropertyKey]: boolean; }>;
    on(taskId: PropertyKey, handlers: Handlers);
    off(taskId: PropertyKey);
    trigger<K extends keyof Events>(name: K, taskId: PropertyKey, data: Events[K]);
    save(start: {x: number; y: number; width: number; }, tasks: SvelteTask[]);
    dropAll(event: DownDropEvent): void;
    moveAll(data: { x?: number; y?: number; width?: number; })
}
