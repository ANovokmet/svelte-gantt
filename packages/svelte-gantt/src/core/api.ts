import { setContext, getContext } from "svelte";
import type { SvelteTask, TaskModel } from "./task";
import type { SvelteRow } from "./row";
import type { TimeRangeModel } from "./timeRange";

type EventController<T extends any[]> = [(handler: (arg: T) => void) => () => void, (...params: T) => void];

type EventsAndArgs<T = any> = {
    [Event in keyof T]: T[Event] extends any[] ? T[Event] : never;
}

type EventMap<T extends EventsAndArgs> = {
    [Event in keyof T]: EventController<T[Event]>;
}

type EventFeature<T extends EventsAndArgs> = {
    on: {
        [Event in keyof T]: EventController<T[Event]>[0];
    },
    raise: {
        [Event in keyof T]: EventController<T[Event]>[1];
    }
}

function controller<T extends any[]>(): EventController<T> {
    const listeners: ((arg: T) => void)[] = [];

    function raise(...params: T) {
        for (const listener of listeners) {
            listener(params);
        }
    };

    function on(handler: (arg: T) => void) {
        listeners.push(handler);
        const removeListener = () => {
            const index = listeners.indexOf(handler);
            listeners.splice(index, 1);
        };

        return removeListener;
    };

    return [on, raise];
}

function feature<T extends EventsAndArgs>(events: EventMap<T>): EventFeature<T> {
    const result = { on: {}, raise: {} } as EventFeature<T>;
    for (const event in events) {
        const [on, raise] = events[event];
        result.on[event] = on;
        result.raise[event] = raise;
    }
    return result;
}

const contextKey = {};

export function provideGanttApi() {
    return setContext(contextKey, createGanttApi());
}

function createGanttApi() {
    return {
        tasks: feature({
            move: controller<[TaskModel]>(),
            resize: controller<[TaskModel]>(),
            select: controller<[SvelteTask]>(),
            switchRow: controller<[SvelteTask, SvelteRow, SvelteRow]>(),
            moveEnd: controller<[TaskModel]>(),
            change: controller<[{ task: SvelteTask; sourceRow: SvelteRow; targetRow: SvelteRow; previousState: any }]>(),
            changed: controller<[{ task: SvelteTask; sourceRow: SvelteRow; targetRow: SvelteRow; previousState: any }]>(),
            dblclicked: controller<[SvelteTask, MouseEvent]>(),
        }),
        gantt: feature({
            viewChanged: controller<[]>(),
            dateSelected: controller<[{ from: number, to: number }]>(),
        }),
        timeranges: feature({
            clicked: controller<[{ model: TimeRangeModel }]>(),
            resized: controller<[{ model: TimeRangeModel; left: number; width: number; }]>(),
            changed: controller<[{ model: TimeRangeModel; left: number; width: number; }]>(),
        }),
    };
}

export type GanttApi = ReturnType<typeof createGanttApi>;

export function useGanttApi() {
    return getContext(contextKey) as GanttApi;
}
