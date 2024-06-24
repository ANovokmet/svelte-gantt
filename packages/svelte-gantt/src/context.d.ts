import { DragContext } from './core/drag';
import { GanttDataStore } from './core/store';
import { GanttContext, GanttContextDimensions, GanttContextOptions, GanttContextServices } from './gantt';

declare module 'svelte' {
    type Contexts = {
        'drag': DragContext;
        'gantt': GanttContext;
        'dataStore': GanttDataStore;
        'services': GanttContextServices;
        'options': GanttContextOptions;
        'dimensions': GanttContextDimensions;
    }

    export function setContext<K extends keyof Contexts, T extends Contexts[K]>(key: K, context: T);
    export function getContext<K extends keyof Contexts>(key: K): Contexts[K];
}
