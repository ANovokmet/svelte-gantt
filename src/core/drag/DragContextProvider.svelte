<script context="module" lang="ts">
    import { Readable } from 'svelte/store';
    import { DownDropEvent } from './draggable';
    import { SvelteTask } from '../task';

    type Events = {
        'move': { x?: number; y?: number; width?: number; };
        'drop': DownDropEvent;
    }

    type Handlers = { [K in keyof Events]: (data: Events[K]) => void; };

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
</script>

<script lang="ts">
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';

    type Pos = {
        id: number;
        xDelta: number;
        yDelta: number;
        width: number;
        bWidth: number;
    }

    const _handlers: DragContext['handlers'] = {};
    let _relativePos: Pos[] = [];
    let _active = writable(false);

    const context: DragContext = {
        active: _active,
        handlers: _handlers,
        on(taskId, handlers) {
            _handlers[taskId] = handlers;
        },
        off(taskId) {
            delete _handlers[taskId];
        },
        trigger(name, taskId, data) {
            if (_handlers[taskId] && _handlers[taskId][name]) {
                _handlers[taskId][name](data);
            }
        },
        save(start: {x: number; y: number; width: number; }, tasks) {
            _relativePos = [];
            for (const task of tasks) {
                _relativePos.push({
                    id: task.model.id,
                    xDelta: task.left - start.x,
                    yDelta: task.top - start.y,
                    width: task.width,
                    bWidth: start.width,
                });
            }
        },
        dropAll(event) {
            $_active = false;
            for (const pos of _relativePos) {
                // somehow update tasks to (event.x + xDelta, event.y + yDelta)
                context.trigger('drop', pos.id, {
                    ...event,
                    mouseEvent: {
                        ...event.mouseEvent,
                        clientX: event.mouseEvent.clientX + pos.xDelta,
                        clientY: event.mouseEvent.clientY + pos.yDelta,
                    },
                    x: event.x + pos.xDelta,
                    y: event.y + pos.yDelta,
                    width: pos.width + (event.width - pos.bWidth) // wDelta
                } as DownDropEvent);
            }
        },
        moveAll({ x, y, width }: { x?: number; y?: number; width?: number; }) {
            $_active = true;
            for (const pos of _relativePos) {
                // somehow update tasks to (event.x + xDelta, event.y + yDelta)
                context.trigger('move', pos.id, {
                    x: x != null ? x + pos.xDelta : null,
                    y: y != null ? y + pos.yDelta : null,
                    width: width != null ? pos.width + (width - pos.bWidth) : null, // wDelta
                });
            }
        }
    };

    setContext('drag', context);
</script>

<slot></slot>
