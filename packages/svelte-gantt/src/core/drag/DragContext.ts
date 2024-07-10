import type { DownDropEvent } from './draggable';
import type { SvelteTask } from '../task';
import type { SvelteRow } from '../row';
import type { Readable } from 'svelte/store';

export interface DragContext {
    rootState: Readable<{ [taskId: PropertyKey]: State; }>;
    off(taskId: PropertyKey);
    save(start: { x: number; y: number; width: number; }, task: SvelteTask, event: DownDropEvent);
    dropAll(event: DownDropEvent): void;
    moveAll(data: { x?: number; y?: number; width?: number; event?: MouseEvent }, task: SvelteTask, state: State);
    setState(task: SvelteTask, state: State);
    dragAllowed(task: SvelteTask): boolean;
    resizeAllowed(task: SvelteTask): boolean;
    mouseUp(task: SvelteTask);
}

export type Position = {
    left: number;
    top: number;
    width: number;
    from: number;
    to: number;
}

export type DragChange = {
    valid: boolean;
    task: SvelteTask;
    current: Position;
    previous: Position;
    sourceRow: SvelteRow;
    targetRow: SvelteRow;
}

export type State = Partial<{
    dragging: boolean;
    resizing: boolean;
    x: number;
    y: number;
    width: number;
    /** @deprecated */
    ignoreClick: boolean;
}>;