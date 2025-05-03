import type { DraggableGroupBuilder } from './core/drag/draggable-group.builder.svelte';
import { GanttDataStore } from './core/store.svelte';
import { GanttContext, GanttContextOptions } from './gantt';

declare module 'svelte' {
    type Contexts = {
        'drag': DraggableGroupBuilder;
        'gantt': GanttContext & GanttDataStore;
        'options': GanttContextOptions;
    }

    export function setContext<K extends keyof Contexts, T extends Contexts[K]>(key: K, context: T);
    export function getContext<K extends keyof Contexts>(key: K): Contexts[K];
}
