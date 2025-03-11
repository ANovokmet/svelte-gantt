<script lang="ts">
    import { getContext } from 'svelte';
    import type { SvelteTask } from '../task';
    import { createDraggable } from './draggable';
    import { scrollIfOutOfBounds } from '../../utils/dom';
    import { onDestroy, type Snippet } from 'svelte';

    interface Props {
        task: SvelteTask;
        children?: Snippet<
            [
                {
                    state: any;
                    onPointerDown(e: PointerEvent): void;
                }
            ]
        >;
    }

    let { task, children }: Props = $props();

    const { rowContainer, mainContainer } = getContext('gantt');
    const { resizeHandleWidth } = getContext('options');
    const context = getContext('drag');

    const root = context.rootState;

    let __state$ = $derived($root[task.model.id]);
    let _dragging = $derived(__state$?.dragging ?? false);
    let _resizing = $derived(__state$?.resizing ?? false);
    let _ignoreClick = $derived(__state$?.ignoreClick ?? false);
    const _state = $derived.by(() => {
        if (_dragging || _resizing) {
            return {
                x: __state$?.x ?? task.left,
                y: __state$?.y ?? task.top,
                width: __state$?.width ?? task.width,
                dragging: _dragging,
                resizing: _resizing
            };
        } else {
            return {
                x: task.left,
                y: task.top,
                width: task.width,
                dragging: _dragging,
                resizing: _resizing
            };
        }
    });

    export const dragAllowed: (task: SvelteTask) => boolean = null;
    export const resizeAllowed: (task: SvelteTask) => boolean = null;

    const onPointerDown = createDraggable({
        container: rowContainer,
        resizeHandleWidth,
        getX: () => _state.x,
        getY: () => _state.y,
        getWidth: () => _state.width,
        dragAllowed() {
            const fn = dragAllowed ?? context.dragAllowed ?? (() => true);
            return fn(task);
        },
        resizeAllowed() {
            const fn = resizeAllowed ?? context.resizeAllowed ?? (() => true);
            return fn(task);
        },
        onDown(event) {
            context.save(event, task, event);
        },
        onMouseUp() {
            context.mouseUp(task);
        },
        onResize(event) {
            context.moveAll(event, task, {
                x: event.x,
                y: event.width,
                resizing: true,
                ignoreClick: true
            });
        },
        onDrag(event) {
            context.moveAll(event, task, {
                x: event.x,
                y: event.y,
                dragging: true,
                ignoreClick: true
            });
            scrollIfOutOfBounds(event.event, mainContainer);
        },
        onDrop(event) {
            context.dropAll(event);
        }
    });

    onDestroy(() => {
        context.off(task.model.id);
    });
</script>

{@render children?.({ state: _state, onPointerDown })}
