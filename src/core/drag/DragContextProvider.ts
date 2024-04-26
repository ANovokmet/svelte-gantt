import { Readable } from 'svelte/store';
import { DownDropEvent } from './draggable';
import { SvelteTask } from '../task';

export type Events = {
    'move': { x?: number; y?: number; width?: number; };
    'drop': DownDropEvent;
}

export type Handlers = { [K in keyof Events]: (data: Events[K]) => void; };

export interface DragContext {
    active: Readable<boolean>;
    handlers: { 
        [taskId: number]: Handlers
    };
    on(taskId: number, handlers: Handlers);
    off(taskId: number);
    trigger<K extends keyof Events>(name: K, taskId: number, data: Events[K]);
    save(start: {x: number; y: number; width: number; }, tasks: SvelteTask[]);
    dropAll(event: DownDropEvent): void;
    moveAll(data: { x?: number; y?: number; width?: number; })
}
